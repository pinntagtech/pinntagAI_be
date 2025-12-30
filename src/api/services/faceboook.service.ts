import axios from "axios";
import qs from "qs";
import OpenAI from "openai";
import { logger } from "../../utils/logger.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  full_picture?: string;
  attachments?: {
    data: {
      type: string;
      description?: string;
      title?: string;
      media?: {
        image?: {
          src?: string;
        };
      };
      url?: string;
    }[];
  };
  reactions?: {
    summary?: {
      total_count?: number;
    };
  };
  comments?: {
    summary?: {
      total_count?: number;
    };
  };
  shares?: {
    count?: number;
  };
}

interface AIAnalysisResult {
  suitable: boolean;
  reason: string;
  score: number;
  type?: "event" | "offer" | "spotlight" | "flashlight";
  title?: string;
  schedule?: {
    startDate: string | null;
    endDate: string | null;
    startTime: string | null;
    endTime: string | null;
    isRecurring: boolean;
  };
  ticketUrl?: string | null;
  // Legacy field for backward compatibility
  category?:
    | "promotion"
    | "event"
    | "product"
    | "service"
    | "announcement"
    | "other";
}

const AI_MODEL_NAME = "gpt-4o"; // OpenAI GPT-4o supports vision/multimodal

export class FacebookService {
  constructor() {}

  /**
   * Generates the Facebook Login URL for the user to authenticate
   */
  getLoginUrl(
    redirectUri: string,
    scope: string[] = ["public_profile", "email", "user_posts"]
  ) {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const scopeString = scope.join(",");
    return `https://www.facebook.com/v24.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopeString}`;
  }

  /**
   * Exchanges an authorization code for a short-lived user access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string) {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;

    const config = {
      method: "get",
      url: `https://graph.facebook.com/v24.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${encodeURIComponent(code)}`,
    };

    try {
      logger.info(
        {
          clientId,
          redirectUri,
          codeLength: code.length,
          url: config.url.replace(clientSecret!, '***SECRET***').replace(code, '***CODE***')
        },
        "Attempting to exchange code for token"
      );

      const response = await axios.request(config);
      logger.info(
        { data: response.data },
        "Exchanged code for short-lived token"
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      logger.error({
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        clientId,
        redirectUri
      }, "Error exchanging code for token");
      return {
        success: false,
        data: error.response?.data?.error?.message || error.message,
      };
    }
  }

  async fetchLongLivedToken(token: string) {
    const client_id = process.env.FACEBOOK_CLIENT_ID;
    const client_secret = process.env.FACEBOOK_CLIENT_SECRET;
    const fb_exchange_token = token;
    const grant_type = "fb_exchange_token";

    const config = {
      method: "get",
      url: `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=${grant_type}&client_id=${client_id}&client_secret=${client_secret}&fb_exchange_token=${fb_exchange_token}`,
      headers: {},
    };

    const result = axios
      .request(config)
      .then((response) => {
        logger.info({ data: response.data }, "Fetched long-lived token");
        return {
          success: true,
          data: response.data,
        };
      })
      .catch((error) => {
        logger.error(
          { error: error.message },
          "Error fetching long-lived token"
        );
        return {
          success: false,
          data: error.message,
        };
      });
    return result;
  }

  /**
   * Converts a short-lived Page Access Token to a Long-Lived Page Access Token
   * and optionally saves it to the business_ai_assistant database
   * @param pageAccessToken - Short-lived page access token from frontend
   * @param businessId - Optional business ID to save the token in database
   * @param pageId - Optional Facebook page ID (will be fetched automatically if not provided)
   *
   * IMPORTANT: Page tokens obtained from /me/accounts with a long-lived user token
   * are already long-lived (60 days). This method is mainly for extending tokens
   * that were obtained with short-lived user tokens.
   *
   * Long-lived page tokens:
   * - Last approximately 60 days
   * - Can be refreshed before expiration
   * - Never expire if the page's permissions aren't revoked
   */
  async generateLongLivedPageToken(
    pageAccessToken: string,
    businessId?: string,
    pageId?: string
  ) {
    try {
      const client_id = process.env.FACEBOOK_CLIENT_ID;
      const client_secret = process.env.FACEBOOK_CLIENT_SECRET;

      // Fetch comprehensive page information using the page access token
      let resolvedPageId = pageId;
      let pageMetadata: any = null;

      try {
        const pageInfoConfig = {
          method: "get",
          url: `https://graph.facebook.com/v24.0/me?fields=id,name,category,about,description,followers_count,website,phone,emails,picture{url},cover{source}&access_token=${pageAccessToken}`,
        };

        const pageInfoResponse = await axios.request(pageInfoConfig);
        const pageData = pageInfoResponse.data;

        resolvedPageId = pageData.id;
        pageMetadata = {
          name: pageData.name || null,
          category: pageData.category || null,
          about: pageData.about || pageData.description || null,
          followers: pageData.followers_count || 0,
          website: pageData.website || null,
          phone: pageData.phone || null,
          email: pageData.emails?.[0] || null,
          profilePicture: pageData.picture?.data?.url || null,
          coverPhoto: pageData.cover?.source || null,
          rawData: pageData,
        };

        logger.info(
          { pageId: resolvedPageId, pageName: pageData.name, category: pageData.category },
          "Fetched comprehensive page metadata from page access token"
        );
      } catch (pageInfoError: any) {
        logger.warn(
          { error: pageInfoError.message },
          "Could not fetch page metadata from token, continuing without it"
        );
      }

      // Exchange page token for long-lived version
      const config = {
        method: "get",
        url: `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${client_id}&client_secret=${client_secret}&fb_exchange_token=${pageAccessToken}`,
        headers: {},
      };

      const response = await axios.request(config);
      const longLivedToken = response.data.access_token;
      const expiresIn = response.data.expires_in; // Usually 5183944 seconds (~60 days)

      logger.info(
        {
          hasAccessToken: !!longLivedToken,
          expiresIn,
          businessId,
          pageId: resolvedPageId,
        },
        "Generated long-lived page access token"
      );

      // If businessId is provided, save the token to database
      if (businessId) {
        const { BusinessAIAssistantModel } = await import(
          "../../models/businessAIAssistant.model.js"
        );

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

        const updateData: any = {
          facebookPageAccessToken: longLivedToken,
          facebookPageTokenExpiresAt: expiresAt,
        };

        if (resolvedPageId) {
          updateData.facebookPageId = resolvedPageId;
        }

        // Add page metadata if available
        if (pageMetadata) {
          updateData.facebookPageName = pageMetadata.name;
          updateData.facebookPageCategory = pageMetadata.category;
          updateData.facebookPageAbout = pageMetadata.about;
          updateData.facebookPageFollowers = pageMetadata.followers;
          updateData.facebookPageWebsite = pageMetadata.website;
          updateData.facebookPagePhone = pageMetadata.phone;
          updateData.facebookPageEmail = pageMetadata.email;
          updateData.facebookPageProfilePicture = pageMetadata.profilePicture;
          updateData.facebookPageCoverPhoto = pageMetadata.coverPhoto;
          updateData.facebookPageMetadata = pageMetadata.rawData;
        }

        const updatedBusiness = await BusinessAIAssistantModel.findOneAndUpdate(
          { businessId },
          { $set: updateData },
          { new: true }
        );

        if (!updatedBusiness) {
          logger.warn({ businessId }, "Business not found for token save");
          return {
            success: false,
            data: `Business with ID ${businessId} not found`,
          };
        }

        logger.info(
          { businessId, pageId: resolvedPageId, expiresAt, pageName: pageMetadata?.name },
          "Saved long-lived page access token and metadata to database"
        );

        return {
          success: true,
          data: {
            accessToken: longLivedToken,
            tokenType: response.data.token_type,
            expiresIn,
            expiresAt,
            savedToDatabase: true,
            businessId,
            pageId: resolvedPageId || null,
            pageMetadata: pageMetadata ? {
              name: pageMetadata.name,
              category: pageMetadata.category,
              about: pageMetadata.about,
              followers: pageMetadata.followers,
              website: pageMetadata.website,
              phone: pageMetadata.phone,
              email: pageMetadata.email,
              profilePicture: pageMetadata.profilePicture,
              coverPhoto: pageMetadata.coverPhoto,
            } : null,
          },
        };
      }

      // Return without saving to database
      return {
        success: true,
        data: {
          accessToken: longLivedToken,
          tokenType: response.data.token_type,
          expiresIn,
          savedToDatabase: false,
          pageId: resolvedPageId || null,
          pageMetadata: pageMetadata ? {
            name: pageMetadata.name,
            category: pageMetadata.category,
            about: pageMetadata.about,
            followers: pageMetadata.followers,
            website: pageMetadata.website,
            phone: pageMetadata.phone,
            email: pageMetadata.email,
            profilePicture: pageMetadata.profilePicture,
            coverPhoto: pageMetadata.coverPhoto,
          } : null,
        },
      };
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
          response: error.response?.data,
        },
        "Error generating long-lived page access token"
      );
      return {
        success: false,
        data: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Complete OAuth flow: Get page access token from user token and save metadata
   * Used specifically for OAuth callback after getting user access token
   * @param userAccessToken - Long-lived user access token
   * @param businessId - Business ID to save the page data
   */
  async completeOAuthFlow(userAccessToken: string, businessId: string) {
    try {
      logger.info({ businessId }, "Starting complete OAuth flow");

      // Step 1: Get list of pages user manages
      const pagesConfig = {
        method: "get",
        url: `https://graph.facebook.com/v24.0/me/accounts?access_token=${userAccessToken}`,
      };

      const pagesResponse = await axios.request(pagesConfig);
      const pages = pagesResponse.data.data;

      if (!pages || pages.length === 0) {
        return {
          success: false,
          data: "No Facebook pages found for this account. Please create a page first.",
        };
      }

      // Use the first page (or you could let user select)
      const firstPage = pages[0];
      const pageAccessToken = firstPage.access_token; // This is already long-lived
      const pageId = firstPage.id;
      const pageName = firstPage.name;

      logger.info(
        { pageId, pageName, totalPages: pages.length },
        "Found pages, using first page"
      );

      // Step 2: Fetch comprehensive page metadata
      const pageInfoConfig = {
        method: "get",
        url: `https://graph.facebook.com/v24.0/${pageId}?fields=id,name,category,about,description,followers_count,website,phone,emails,picture{url},cover{source}&access_token=${pageAccessToken}`,
      };

      const pageInfoResponse = await axios.request(pageInfoConfig);
      const pageData = pageInfoResponse.data;

      const pageMetadata = {
        name: pageData.name || null,
        category: pageData.category || null,
        about: pageData.about || pageData.description || null,
        followers: pageData.followers_count || 0,
        website: pageData.website || null,
        phone: pageData.phone || null,
        email: pageData.emails?.[0] || null,
        profilePicture: pageData.picture?.data?.url || null,
        coverPhoto: pageData.cover?.source || null,
        rawData: pageData,
      };

      logger.info(
        { pageId, pageName: pageData.name, category: pageData.category },
        "Fetched comprehensive page metadata"
      );

      // Step 3: Save to database
      const { BusinessAIAssistantModel } = await import(
        "../../models/businessAIAssistant.model.js"
      );

      // Calculate expiration date (page tokens from /me/accounts are already long-lived, ~60 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60); // 60 days

      const updateData: any = {
        facebookPageAccessToken: pageAccessToken,
        facebookPageId: pageId,
        facebookPageTokenExpiresAt: expiresAt,
        facebookPageName: pageMetadata.name,
        facebookPageCategory: pageMetadata.category,
        facebookPageAbout: pageMetadata.about,
        facebookPageFollowers: pageMetadata.followers,
        facebookPageWebsite: pageMetadata.website,
        facebookPagePhone: pageMetadata.phone,
        facebookPageEmail: pageMetadata.email,
        facebookPageProfilePicture: pageMetadata.profilePicture,
        facebookPageCoverPhoto: pageMetadata.coverPhoto,
        facebookPageMetadata: pageMetadata.rawData,
      };

      const updatedBusiness = await BusinessAIAssistantModel.findOneAndUpdate(
        { businessId },
        { $set: updateData },
        { new: true }
      );

      if (!updatedBusiness) {
        logger.warn({ businessId }, "Business not found for token save");
        return {
          success: false,
          data: `Business with ID ${businessId} not found`,
        };
      }

      logger.info(
        { businessId, pageId, pageName: pageMetadata.name },
        "Successfully saved page access token and metadata to AI assistant database"
      );

      // Step 4: Update Pinntag backend business schema
      try {
        await this.updatePinntagBackendBusiness(businessId, {
          pageId,
          pageAccessToken,
          expiresAt,
          pageMetadata,
        });
        logger.info(
          { businessId, pageId },
          "Successfully updated Pinntag backend business with Facebook data"
        );
      } catch (backendError: any) {
        logger.error(
          { error: backendError.message, businessId },
          "Failed to update Pinntag backend, but AI assistant data was saved successfully"
        );
        // Don't fail the whole flow if backend update fails
      }

      return {
        success: true,
        data: {
          accessToken: pageAccessToken,
          expiresAt,
          pageId,
          pageMetadata: {
            name: pageMetadata.name,
            category: pageMetadata.category,
            about: pageMetadata.about,
            followers: pageMetadata.followers,
            website: pageMetadata.website,
            phone: pageMetadata.phone,
            email: pageMetadata.email,
            profilePicture: pageMetadata.profilePicture,
            coverPhoto: pageMetadata.coverPhoto,
          },
        },
      };
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
          response: error.response?.data,
        },
        "Error completing OAuth flow"
      );
      return {
        success: false,
        data: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Update Pinntag backend business with Facebook metadata
   * Updates business.facebookMetaData directly in the database
   */
  async updatePinntagBackendBusiness(
    businessId: string,
    facebookData: {
      pageId: string;
      pageAccessToken: string;
      expiresAt: Date;
      pageMetadata: any;
    }
  ) {
    try {
      const { getBackendBusinessModel } = await import(
        "../../models/pinntagBackend/business.model.js"
      );
      const { getBackendConnection } = await import(
        "../../db/connection.js"
      );

      const backendConn = await getBackendConnection();
      if (!backendConn) {
        logger.warn("Pinntag backend database connection not available, skipping update");
        return;
      }

      const BusinessBackendModel = getBackendBusinessModel(backendConn);

      // Prepare Facebook metadata matching Pinntag backend schema
      const facebookMetaData = {
        pageId: facebookData.pageId,
        pageAccessToken: facebookData.pageAccessToken,
        tokenExpiresAt: facebookData.expiresAt,
        pageInfo: {
          name: facebookData.pageMetadata.name,
          about: facebookData.pageMetadata.about,
          category: facebookData.pageMetadata.category,
          followers: facebookData.pageMetadata.followers,
          website: facebookData.pageMetadata.website,
          phone: facebookData.pageMetadata.phone,
          email: facebookData.pageMetadata.email,
          profilePicture: facebookData.pageMetadata.profilePicture,
          coverPhoto: facebookData.pageMetadata.coverPhoto,
        },
      };

      logger.info(
        { businessId, pageId: facebookData.pageId },
        "Updating Pinntag backend business database with Facebook data"
      );

      // Update the business document
      const result = await BusinessBackendModel.findByIdAndUpdate(
        businessId,
        {
          $set: {
            isFacebookConnected: true,
            facebookMetaData: facebookMetaData,
          },
        },
        { new: true }
      );

      if (!result) {
        logger.warn(
          { businessId },
          "Business not found in Pinntag backend database"
        );
        return;
      }

      logger.info(
        { businessId, pageId: facebookData.pageId },
        "Successfully updated Pinntag backend business database"
      );

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
          businessId,
        },
        "Error updating Pinntag backend business database"
      );
      throw error;
    }
  }

  async createSocialPost(
    token: string,
    message: string,
    mediaIds: Array<string>
  ) {
    const data: { message: string; [key: string]: string } = {
      message,
    };
    if (mediaIds.length > 0) {
      mediaIds.forEach((mediaId, index) => {
        data[`attached_media[${index}]`] = `{media_fbid:${mediaId}}`;
      });
    }

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://graph.facebook.com/v24.0/me/feed",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      data: qs.stringify(data),
    };
    logger.info({ config }, "Config for facebook post");
    const result = axios
      .request(config)
      .then((response) => {
        logger.info({ data: response.data }, "Created social post");
        return {
          success: true,
          data: response.data,
        };
      })
      .catch((error) => {
        logger.error({ error: error.message }, "Error creating social post");
        return {
          success: false,
          data: error.message,
        };
      });
    return result;
  }

  async uploadImage(token: string, url: string) {
    const data = JSON.stringify({
      access_token: token,
      published: false,
      url,
    });

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://graph.facebook.com/v24.0/me/photos",
      headers: {
        "Content-Type": "application/json",
      },
      data,
    };

    const result = axios.request(config).then(
      (response) => {
        logger.info({ data: response.data }, "Uploaded image");
        return {
          success: true,
          data: response.data,
        };
      },
      (error) => {
        logger.error({ error: error.message }, "Error uploading image");
        return {
          success: false,
          data: error.message,
        };
      }
    );
    return result;
  }

  /**
   * Fetches all Facebook posts and events, saves them to database, and returns AI-filtered results
   * Retrieves the page access token from business_ai_assistant database
   * @param businessId - Business ID to fetch token and associate posts with
   * @param useAI - Whether to use AI filtering (default: true)
   * @param minScore - Minimum AI score for filtering (default: 60)
   */
  async fetchAndSavePageData(
    businessId: string,
    useAI: boolean = true,
    minScore: number = 60
  ) {
    try {
      const { FacebookPostModel } = await import(
        "../../models/facebookPost.model.js"
      );
      const { BusinessAIAssistantModel } = await import(
        "../../models/businessAIAssistant.model.js"
      );

      // Fetch business and get saved Facebook token
      const business = await BusinessAIAssistantModel.findOne({ businessId });

      if (!business) {
        logger.error({ businessId }, "Business not found");
        return {
          success: false,
          error: `Business with ID ${businessId} not found`,
        };
      }

      if (!business.facebookPageAccessToken) {
        logger.error({ businessId }, "No Facebook page access token found");
        return {
          success: false,
          error: "No Facebook page access token found for this business. Please connect your Facebook page first.",
        };
      }

      const token = business.facebookPageAccessToken;
      const pageId = business.facebookPageId;

      // Check if token is expired
      if (business.facebookPageTokenExpiresAt) {
        const now = new Date();
        if (business.facebookPageTokenExpiresAt < now) {
          logger.warn(
            { businessId, expiresAt: business.facebookPageTokenExpiresAt },
            "Facebook page access token has expired"
          );
          return {
            success: false,
            error: "Facebook page access token has expired. Please reconnect your Facebook page.",
          };
        }
      }

      logger.info(
        { businessId, pageId },
        "Using saved Facebook token to fetch page data"
      );

      // Fetch all posts and events
      const allData = await this.getAllPosts(token);

      if (!allData.success || !allData.data) {
        return {
          success: false,
          error: allData.error || "Failed to fetch Facebook data",
        };
      }

      const events = allData.data.events || [];
      const savedPosts: any[] = [];
      const skippedPosts: any[] = [];

      // Save each event/post to database (skip if already exists)
      for (const item of events) {
        try {
          // Check if post already exists for this business
          const existingPost = await FacebookPostModel.findOne({
            postId: item.id,
            businessId: businessId,
          });

          if (existingPost) {
            logger.info(
              { postId: item.id, businessId },
              "Post already exists in database, skipping"
            );
            skippedPosts.push({
              postId: item.id,
              reason: "Already exists in database",
            });
            continue; // Skip this post
          }

          const postData: any = {
            businessId,
            facebookPageId: pageId,
            postId: item.id,
            type: item.source === "facebook_events_api" ? "event" : "post",
            source: item.source,
            title: item.title,
            message: item.metadata?.aiReason || item.description,
            description: item.description,
            fullPicture: item.images?.[0] || null,
            images: item.images || [],
            reactions: 0,
            comments: 0,
            shares: 0,
            lastSyncedAt: new Date(),
            rawData: item,
          };

          // Add event-specific data
          if (item.schedule) {
            postData.eventData = {
              startDate: item.schedule.startDate,
              endDate: item.schedule.endDate,
              startTime: item.schedule.startTime,
              endTime: item.schedule.endTime,
              location: item.location,
              isOnline: item.isOnline || false,
            };
          }

          // Add AI analysis if available
          if (item.metadata?.aiConfidenceScore !== undefined) {
            postData.aiAnalysis = {
              suitable: true,
              reason: item.metadata.aiReason || "",
              score: item.metadata.aiConfidenceScore,
              type: item.type || item.metadata.aiType,
              title: item.title,
              schedule: item.schedule ? {
                startDate: item.schedule.startDate,
                endDate: item.schedule.endDate,
                startTime: item.schedule.startTime,
                endTime: item.schedule.endTime,
                isRecurring: item.schedule.isRecurring || false,
              } : undefined,
              ticketUrl: item.ticketUrl || null,
              category: item.metadata.aiCategory || "event",
            };
          }

          // Insert new post
          const savedPost = await FacebookPostModel.create(postData);

          savedPosts.push(savedPost);
          logger.info(
            { postId: item.id, businessId },
            "Successfully saved new post to database"
          );
        } catch (saveError: any) {
          logger.error(
            { error: saveError.message, postId: item.id },
            "Error saving post to database"
          );
          skippedPosts.push({ postId: item.id, error: saveError.message });
        }
      }

      logger.info(
        {
          businessId,
          pageId,
          totalFetched: events.length,
          saved: savedPosts.length,
          skipped: skippedPosts.length,
        },
        "Completed saving Facebook data to database"
      );

      // Apply AI filtering if requested
      let filteredPosts = savedPosts;
      if (useAI && minScore > 0) {
        filteredPosts = savedPosts.filter((post) => {
          const score = post.aiAnalysis?.score || 0;
          return score >= minScore;
        });

        logger.info(
          {
            total: savedPosts.length,
            filtered: filteredPosts.length,
            minScore,
          },
          "Applied AI filtering to saved posts"
        );
      }

      return {
        success: true,
        data: {
          posts: filteredPosts,
          summary: {
            totalFetched: events.length,
            totalSaved: savedPosts.length,
            totalFiltered: filteredPosts.length,
            skipped: skippedPosts.length,
            businessId,
            pageId,
          },
          skippedPosts: skippedPosts.length > 0 ? skippedPosts : undefined,
        },
      };
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
          businessId,
        },
        "Error in fetchAndSavePageData"
      );
      return {
        success: false,
        error: error.message || "Failed to fetch and save Facebook data",
      };
    }
  }

  /**
   * Fetches all events from both Facebook Events API and Posts (with AI analysis)
   * Returns structured event data with title, description, image, schedule, and location
   * Filters to only return future events (after current date)
   */
  async getAllPosts(token: string) {
    try {
      const now = new Date();
      const events: any[] = [];

      // ============================================================================
      // 1. FETCH FACEBOOK EVENTS (Structured Data - PREFERRED)
      // ============================================================================
      try {
        const eventsConfig = {
          method: "get",
          url: "https://graph.facebook.com/v20.0/me/events?fields=id,name,description,start_time,end_time,place,cover,is_canceled,is_online,is_draft,ticket_uri",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const eventsResponse = await axios.request(eventsConfig);
        const fbEvents = eventsResponse.data.data || [];
        const eventIds = new Set(fbEvents.map((e: any) => e.id));

        // Filter and transform Facebook Events
        fbEvents.forEach((event: any) => {
          // Skip canceled, draft, or past events
          if (event.is_canceled || event.is_draft) return;

          const eventStartTime = event.start_time ? new Date(event.start_time) : null;
          if (!eventStartTime || eventStartTime <= now) return;

          events.push({
            id: event.id,
            source: "facebook_events_api",
            title: event.name || "Untitled Event",
            description: event.description || "",
            type: "event",
            images: event.cover?.source ? [event.cover.source] : [],
            schedule: {
              startDate: eventStartTime.toISOString().split('T')[0],
              endDate: event.end_time ? new Date(event.end_time).toISOString().split('T')[0] : eventStartTime.toISOString().split('T')[0],
              startTime: eventStartTime.toTimeString().split(' ')[0],
              endTime: event.end_time ? new Date(event.end_time).toTimeString().split(' ')[0] : null,
              isRecurring: false,
            },
            ticketUrl: event.ticket_uri || null,
            location: {
              name: event.place?.name || null,
              address1: event.place?.location?.street || null,
              address2: null,
              city: event.place?.location?.city || null,
              state: event.place?.location?.state || null,
              country: event.place?.location?.country || null,
              zipcode: event.place?.location?.zip || null,
              latitude: event.place?.location?.latitude || null,
              longitude: event.place?.location?.longitude || null,
            },
            isOnline: event.is_online || false,
            metadata: {
              facebookEventId: event.id,
              extractedFromEventsApi: true,
            }
          });
        });

        logger.info(
          { totalFbEvents: fbEvents.length, futureEvents: events.length },
          "Fetched Facebook Events API"
        );

        // ============================================================================
        // 2. FETCH POSTS AND ANALYZE WITH AI (OCR for event flyers)
        // ============================================================================
        const postsResponse = await this.getAllPostsForPinntag(token, true, 80);

        if (postsResponse.success && postsResponse.data?.posts) {
          for (const post of postsResponse.data.posts) {
            // Skip auto-generated event posts (we already have them from Events API)
            const postEventId = post.id.split('_')[1];
            if (eventIds.has(postEventId)) {
              logger.info(
                { postId: post.id, eventId: postEventId },
                "Skipping auto-generated event post (already in Events API)"
              );
              continue;
            }

            // Process all suitable posts (events, offers, spotlight, flashlight)
            // Use AI-generated data (title, type, schedule, ticketUrl)
            const aiAnalysis = post.aiAnalysis;
            const aiReason = aiAnalysis.reason || "";
            const eventType = aiAnalysis?.type || 'spotlight';

            // Use AI-generated schedule if available, otherwise fallback to manual extraction
            let schedule = aiAnalysis?.schedule;
            if (!schedule || !schedule.startDate) {
              // Fallback: Try to extract date/time from AI reason or post message
              const dateMatch = aiReason.match(/(?:on|at)?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2})/i);
              const timeMatch = aiReason.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i);

              let eventDate = null;
              if (dateMatch) {
                try {
                  eventDate = new Date(dateMatch[1]);
                  if (isNaN(eventDate.getTime())) eventDate = null;
                } catch (e) {
                  eventDate = null;
                }
              }

              schedule = {
                startDate: eventDate ? eventDate.toISOString().split('T')[0] : null,
                endDate: eventDate ? eventDate.toISOString().split('T')[0] : null,
                startTime: timeMatch ? timeMatch[1] : null,
                endTime: null,
                isRecurring: false,
              };
            }

            // Skip if it's an event in the past (but keep offers/spotlight/flashlight regardless of date)
            if (eventType === 'event' && schedule?.startDate) {
              const eventDate = new Date(schedule.startDate);
              if (eventDate <= now) continue;
            }

            // Use AI-generated title or fallback
            const title = aiAnalysis?.title || post.message?.substring(0, 50) || `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} from Post`;

            // Extract images
            const images: string[] = [];
            if (post.full_picture) images.push(post.full_picture);
            if (post.attachments?.data) {
              post.attachments.data.forEach((att: any) => {
                if (att.media?.image?.src && !images.includes(att.media.image.src)) {
                  images.push(att.media.image.src);
                }
              });
            }

            events.push({
              id: post.id,
              source: "facebook_post_ai_extracted",
              title: title,
              description: post.message || aiReason,
              type: eventType,
              images: images,
              schedule: {
                startDate: schedule.startDate,
                endDate: schedule.endDate,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                isRecurring: schedule.isRecurring || false,
              },
              ticketUrl: aiAnalysis?.ticketUrl || null,
              location: {
                name: null,
                address1: null,
                address2: null,
                city: null,
                state: null,
                country: null,
                zipcode: null,
                latitude: null,
                longitude: null,
              },
              isOnline: false,
              metadata: {
                facebookPostId: post.id,
                extractedFromImage: !post.message,
                aiConfidenceScore: aiAnalysis.score,
                aiReason: aiReason,
                aiType: eventType,
                extractedFromPost: true,
              }
            });
          }
        }

      } catch (error: any) {
        logger.error(
          { error: error.message },
          "Error in getAllPosts processing"
        );
        throw error;
      }

      logger.info(
        { totalEvents: events.length },
        "Completed event extraction from Events API and Posts"
      );

      return {
        success: true,
        data: {
          events: events.sort((a, b) => {
            // Sort by start date (earliest first)
            const dateA = a.schedule.startDate ? new Date(a.schedule.startDate).getTime() : Infinity;
            const dateB = b.schedule.startDate ? new Date(b.schedule.startDate).getTime() : Infinity;
            return dateA - dateB;
          }),
          summary: {
            totalEvents: events.length,
            fromEventsApi: events.filter(e => e.source === 'facebook_events_api').length,
            fromPosts: events.filter(e => e.source === 'facebook_post_ai_extracted').length,
          }
        },
      };
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
        },
        "Error fetching all posts/events"
      );
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Filters Facebook posts that are suitable for Pinntag
   * Criteria:
   * - Has meaningful business content (promotions, events, products, services)
   * - Contains engagement (reactions, comments, or shares)
   * - Has media attachments with business context
   * - Excludes profile/cover photo updates and generic status updates
   * - Excludes non-business content (alerts, missing persons, political posts)
   */
  filterPinntagSuitablePosts(posts: any[]) {
    return posts.filter((post) => {
      // Exclude profile picture and cover photo updates (unless they have a message)
      const isProfileUpdate =
        post.story?.includes("updated their profile picture") ||
        post.story?.includes("updated their cover photo");
      if (isProfileUpdate && !post.message) {
        return false;
      }

      // Must have some form of content
      const hasMessage = post.message && post.message.trim().length > 0;
      const hasStory = post.story && post.story.trim().length > 0;
      const hasAttachments =
        post.attachments &&
        post.attachments.data &&
        post.attachments.data.length > 0;

      // Check if post has meaningful content
      if (!hasMessage && !hasStory && !hasAttachments) {
        return false;
      }

      // Exclude non-business content by keyword detection
      const message = (post.message || "").toLowerCase();
      const nonBusinessKeywords = [
        "missing child",
        "amber alert",
        "urgent alert",
        "please share",
        "missing person",
        "lost child",
        "kidnapped",
        "abducted",
        "call 911",
        "contact police",
        "breaking news",
        "tragedy",
        "condolences",
        "rest in peace",
        "rip ",
        "thoughts and prayers",
      ];

      const hasNonBusinessKeywords = nonBusinessKeywords.some((keyword) =>
        message.includes(keyword)
      );

      if (hasNonBusinessKeywords) {
        return false;
      }

      // Prioritize posts with engagement
      const reactionsCount = post.reactions?.summary?.total_count || 0;
      const commentsCount = post.comments?.summary?.total_count || 0;
      const sharesCount = post.shares?.count || 0;
      const totalEngagement = reactionsCount + commentsCount + sharesCount;

      // Filter criteria:
      // 1. Posts with meaningful text (more than 20 characters) - likely promotions/announcements
      // 2. Posts with media AND meaningful text OR good engagement (5+ interactions)
      // 3. Exclude posts that are just media without context (unless high engagement)
      const hasMedia =
        hasAttachments &&
        post.attachments.data.some(
          (att: any) =>
            att.type === "photo" || att.type === "video" || att.type === "album"
        );
      const hasMeaningfulText = hasMessage && post.message.length > 20;
      const hasGoodEngagement = totalEngagement >= 5;

      // Post is suitable if:
      // - Has meaningful text (likely business content) AND (has media OR has engagement)
      // - OR has media with good engagement (5+ reactions/comments/shares)
      return (
        (hasMeaningfulText && (hasMedia || totalEngagement > 0)) ||
        (hasMedia && hasGoodEngagement)
      );
    });
  }

  /**
   * Uses OpenAI to analyze if a post is suitable for Pinntag
   * Now supports multimodal analysis - analyzes both text AND images!
   * Returns: { suitable: boolean, reason: string, score: number, category?: string }
   */
  async analyzePostWithAI(post: FacebookPost): Promise<AIAnalysisResult> {
    try {
      // Prepare post data for AI analysis
      const attachmentsData = post.attachments?.data || [];
      const postData = {
        message: post.message || "",
        story: post.story || "",
        hasMedia: attachmentsData.length > 0,
        mediaTypes: attachmentsData.map((att) => att.type),
        reactionsCount: post.reactions?.summary?.total_count || 0,
        commentsCount: post.comments?.summary?.total_count || 0,
        sharesCount: post.shares?.count || 0,
        attachmentDescriptions: attachmentsData.map(
          (att) => att.description || att.title || ""
        ),
      };

      // Fetch images for multimodal analysis
      const imageUrls: string[] = [];
      if ((post as any).full_picture) {
        imageUrls.push((post as any).full_picture);
      }

      // Also check for media URLs in attachments
      attachmentsData.forEach((att: any) => {
        if (att.media?.image?.src) {
          imageUrls.push(att.media.image.src);
        } else if (att.url && (att.type === "photo" || att.type === "video")) {
          imageUrls.push(att.url);
        }
      });

      const prompt = `
        Analyze this Facebook post and extract structured event/promotion data for Pinntag, a local business discovery platform.

        PRIMARY USE CASE: Extract EVENTS and DEALS from business Facebook posts and transform them into a unified event format.
        Posts with event flyers, promotional images, or deal announcements (even without text messages) are highly valuable.

        ${imageUrls.length > 0 ? `
        ⚠️ CRITICAL: IMAGE ANALYSIS WITH OCR ⚠️
        This post has ${imageUrls.length} image(s) attached. You MUST analyze the images FIRST and READ ANY TEXT IN THE IMAGES.

        STEP 1 - READ AND ANALYZE THE IMAGE(S):
        - READ all text visible in the image (event flyers, promotional posters, menu boards, deal announcements)
        - Extract event details from image: date, time, location, event name, special offers, ticket URL
        - Extract promotion details: discounts, special offers, limited-time deals, promo codes
        - Identify image type: event flyer, promotional poster, food photo, product photo, award certificate, personal photo, missing person poster
        - Is it professional/promotional quality?
        - Is it a missing person/child alert poster? (NEVER suitable)

        STEP 2 - GENERATE A TITLE:
        - For EVENT FLYERS: Extract the event name from the image or post message
        - For PROMOTIONAL POSTS: Create a catchy title from the deal/offer (e.g., "50% Off All Appetizers", "Happy Hour Special")
        - For PRODUCT/SERVICE POSTS: Use the product/service name or create a descriptive title
        - Keep titles concise (5-10 words max)
        - If no clear title can be extracted, generate one based on the post content

        STEP 3 - EXTRACT SCHEDULE INFORMATION (if available):
        - Look for dates in format: MM/DD/YYYY, Month DD, YYYY, or relative dates
        - Look for times: specific times (e.g., "7:00 PM") or time ranges (e.g., "5-9 PM")
        - Check for recurring events: "Every Friday", "Weekly", "Monthly"
        - If schedule info exists in image but not in post message, extract it from the image
        - It's OK if schedule information is not available

        STEP 4 - EXTRACT TICKET/BOOKING URL:
        - Look for URLs in post message or image
        - Common patterns: eventbrite.com, ticketmaster.com, "register at", "book at", "RSVP"
        - Extract any URL that appears to be for tickets, bookings, or registration
        ` : `
        GENERATE A TITLE:
        - Create a descriptive title from the post message/caption (5-10 words max)
        - For offers/deals: Include the key value proposition
        - For announcements: Summarize the main point
        - Make it attention-grabbing but accurate
        `}

        Post Data:
        - Message: "${postData.message}"
        - Story: "${postData.story}"
        - Has Media: ${postData.hasMedia}
        - Media Types: ${postData.mediaTypes.join(", ")}
        - Number of Images: ${imageUrls.length}
        - Engagement: ${postData.reactionsCount} reactions, ${
        postData.commentsCount
      } comments, ${postData.sharesCount} shares
        - Attachment Descriptions: ${postData.attachmentDescriptions.join(
          " | "
        )}

        TYPE CLASSIFICATION (choose ONE):
        - "event": Time-bound happenings (concerts, workshops, grand openings, live performances, festivals, classes)
        - "offer": Discounts, deals, promotions, limited-time offers, happy hours, combo deals, seasonal sales
        - "spotlight": Business highlights, awards, achievements, new menu items, product launches, success stories
        - "flashlight": Urgent/time-sensitive announcements, flash sales, last-minute deals, breaking news about the business

        EXCLUDE (mark as NOT suitable):
        - Missing person/child alerts, Amber alerts, emergency notifications
        - Political content, controversial topics, or activism
        - Personal family updates, condolences, tragedy announcements
        - Posts where image and post message don't match
        - Generic "thoughts and prayers" posts
        - Pure entertainment or memes not related to business
        - Profile/cover photo updates WITHOUT event/promotional content

        Score Guidelines:
        - 90-100: EVENT FLYERS with clear details, PROMOTIONAL DEALS with discounts
        - 80-89: Events or promotions with supporting images, special announcements
        - 70-79: Business-related announcements (awards, achievements)
        - 50-69: Borderline business content (general updates with some promotional value)
        - 0-49: Not suitable for Pinntag

        You must respond with only a JSON object matching this schema:
        {
          "suitable": boolean,
          "reason": string,
          "score": number,
          "type": "event" | "offer" | "spotlight" | "flashlight",
          "title": string,
          "schedule": {
            "startDate": string | null,
            "endDate": string | null,
            "startTime": string | null,
            "endTime": string | null,
            "isRecurring": boolean
          },
          "ticketUrl": string | null
        }`;

      // Build OpenAI message content with images if available
      const messageContent: OpenAI.Chat.ChatCompletionContentPart[] = [
        { type: "text", text: prompt }
      ];

      // Fetch and add images for multimodal analysis
      if (imageUrls.length > 0) {
        logger.info(
          { postId: post.id, imageCount: imageUrls.length },
          "Fetching images for multimodal AI analysis"
        );

        for (const imageUrl of imageUrls.slice(0, 3)) {
          // Limit to 3 images max
          try {
            const imageResponse = await axios.get(imageUrl, {
              responseType: "arraybuffer",
              timeout: 5000, // 5 second timeout per image
            });

            const base64Image = Buffer.from(imageResponse.data).toString(
              "base64"
            );
            const mimeType =
              imageResponse.headers["content-type"] || "image/jpeg";

            messageContent.push({
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              }
            });

            logger.info(
              { postId: post.id, imageUrl, mimeType },
              "Successfully fetched image for analysis"
            );
          } catch (imageError: any) {
            logger.warn(
              { postId: post.id, imageUrl, error: imageError.message },
              "Failed to fetch image for analysis, continuing without it"
            );
          }
        }
      }

      // Call OpenAI with multimodal input (text + images)
      const completion = await openai.chat.completions.create({
        model: AI_MODEL_NAME,
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";

      logger.info(
        {
          postId: post.id,
          aiResponse: responseText,
          hadImages: imageUrls.length > 0,
          imagesAnalyzed: messageContent.length - 1,
        },
        "AI analysis for post (with image analysis)"
      );

      const analysis: AIAnalysisResult = JSON.parse(responseText);

      // Map new type to legacy category for backward compatibility
      const categoryMap: Record<string, "promotion" | "event" | "product" | "service" | "announcement" | "other"> = {
        event: "event",
        offer: "promotion",
        spotlight: "announcement",
        flashlight: "announcement",
      };
      const legacyCategory = analysis.type ? categoryMap[analysis.type] || "other" : undefined;

      return {
        suitable: analysis.suitable === true,
        reason: analysis.reason || "No reason provided",
        score: analysis.score || 0,
        type: analysis.type,
        title: analysis.title,
        schedule: analysis.schedule,
        ticketUrl: analysis.ticketUrl,
        category: legacyCategory,
      };
    } catch (error: any) {
      logger.error(
        { postId: post.id, error: error.message },
        "Error analyzing post with AI"
      );
      // Fallback to false if AI analysis fails
      return {
        suitable: false,
        reason: "AI analysis failed",
        score: 0,
      };
    }
  }

  /**
   * Filters posts using AI analysis in batches
   */
  async filterPostsWithAI(
    posts: any[],
    minScore: number = 60
  ): Promise<Array<{ post: FacebookPost; aiAnalysis: AIAnalysisResult }>> {
    const results: Array<{ post: FacebookPost; aiAnalysis: AIAnalysisResult }> =
      [];

    logger.info(
      { totalPosts: posts.length, minScore },
      "Starting AI filtering of posts"
    );

    // Process posts in parallel with concurrency limit
    const batchSize = 5;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (post) => {
          const analysis = await this.analyzePostWithAI(post);
          return {
            post,
            aiAnalysis: analysis,
          };
        })
      );

      results.push(...batchResults);
    }

    // Filter based on suitability and minimum score
    const filtered = results.filter(
      (result) =>
        result.aiAnalysis.suitable && result.aiAnalysis.score >= minScore
    );

    logger.info(
      {
        total: posts.length,
        analyzed: results.length,
        suitable: filtered.length,
      },
      "AI filtering completed"
    );

    return filtered;
  }

  /**
   * Fetches all Facebook posts and filters those suitable for Pinntag
   * @param token - Facebook access token
   * @param useAI - Use AI-based filtering (default: true for better accuracy)
   * @param minScore - Minimum AI confidence score (0-100, default: 60)
   */
  async getAllPostsForPinntag(
    token: string,
    useAI: boolean = true,
    minScore: number = 60
  ) {
    try {
      const config = {
        method: "get",
        maxBodyLength: Infinity,
        url: "https://graph.facebook.com/v20.0/me/posts?fields=id,message,created_time,full_picture,story,attachments{media,type,url,description,title},reactions.summary(total_count),comments.summary(total_count),shares&limit=100",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.request(config);

      if (response.data && response.data.data) {
        const allPosts = response.data.data;

        if (useAI) {
          logger.info("Using AI-based filtering for Facebook posts");
          const aiFilteredResults = await this.filterPostsWithAI(
            allPosts,
            minScore
          );

          return {
            success: true,
            data: {
              total: allPosts.length,
              filtered: aiFilteredResults.length,
              posts: aiFilteredResults.map((result) => ({
                ...result.post,
                aiAnalysis: result.aiAnalysis,
              })),
              filterMethod: "ai",
            },
          };
        } else {
          logger.info("Using rule-based filtering for Facebook posts");
          const filteredPosts = this.filterPinntagSuitablePosts(allPosts);

          return {
            success: true,
            data: {
              total: allPosts.length,
              filtered: filteredPosts.length,
              posts: filteredPosts,
              filterMethod: "rules",
            },
          };
        }
      }

      return {
        success: true,
        data: {
          total: 0,
          filtered: 0,
          posts: [],
          filterMethod: useAI ? "ai" : "rules",
        },
      };
    } catch (error: any) {
      logger.error({ error: error.message }, "Error fetching Facebook posts");
      return {
        success: false,
        error: error.message || "Failed to fetch Facebook posts",
      };
    }
  }
}
