import axios from "axios";
import qs from "qs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../../utils/logger.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

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
  category?:
    | "promotion"
    | "event"
    | "product"
    | "service"
    | "announcement"
    | "other";
}

const AI_MODEL_NAME = "gemini-1.5-flash";

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
      url: `https://graph.facebook.com/v24.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`,
    };

    try {
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
      logger.error({ error: error.message }, "Error exchanging code for token");
      return {
        success: false,
        data: error.message,
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
   * @param pageAccessToken - Short-lived page access token from frontend
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
  async generateLongLivedPageToken(pageAccessToken: string) {
    try {
      const client_id = process.env.FACEBOOK_CLIENT_ID;
      const client_secret = process.env.FACEBOOK_CLIENT_SECRET;

      // Exchange page token for long-lived version
      const config = {
        method: "get",
        url: `https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${client_id}&client_secret=${client_secret}&fb_exchange_token=${pageAccessToken}`,
        headers: {},
      };

      const response = await axios.request(config);

      logger.info(
        {
          hasAccessToken: !!response.data.access_token,
          expiresIn: response.data.expires_in
        },
        "Generated long-lived page access token"
      );

      return {
        success: true,
        data: {
          accessToken: response.data.access_token,
          tokenType: response.data.token_type,
          expiresIn: response.data.expires_in, // Usually 5183944 seconds (~60 days)
        },
      };
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
          response: error.response?.data
        },
        "Error generating long-lived page access token"
      );
      return {
        success: false,
        data: error.response?.data?.error?.message || error.message,
      };
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
          url: "https://graph.facebook.com/v20.0/me/events?fields=id,name,description,start_time,end_time,place,cover,is_canceled,is_online,is_draft",
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
            image: event.cover?.source || null,
            schedule: {
              startDate: eventStartTime.toISOString().split('T')[0],
              endDate: event.end_time ? new Date(event.end_time).toISOString().split('T')[0] : eventStartTime.toISOString().split('T')[0],
              startTime: eventStartTime.toTimeString().split(' ')[0],
              endTime: event.end_time ? new Date(event.end_time).toTimeString().split(' ')[0] : null,
            },
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

            // Only process posts categorized as events by AI
            if (post.aiAnalysis?.category !== 'event') continue;

            // Extract event data from AI analysis
            // AI reason typically contains extracted event details
            const aiReason = post.aiAnalysis.reason || "";

            // Try to extract date/time from AI reason or post message
            const dateMatch = aiReason.match(/(?:on|at)?\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2})/i);
            const timeMatch = aiReason.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i);

            // Parse date if found
            let eventDate = null;
            if (dateMatch) {
              try {
                eventDate = new Date(dateMatch[1]);
                if (isNaN(eventDate.getTime())) eventDate = null;
              } catch (e) {
                eventDate = null;
              }
            }

            // Skip if event is in the past
            if (eventDate && eventDate <= now) continue;

            // Extract title from AI reason or post message
            const titleMatch = aiReason.match(/(?:event|flyer|poster)\s+(?:with\s+)?(?:clear\s+)?(?:details:?\s+)?([^.!?,]+)/i);
            const title = titleMatch ? titleMatch[1].trim() : (post.message?.substring(0, 50) || "Event from Post");

            events.push({
              id: post.id,
              source: "facebook_post_ai_extracted",
              title: title,
              description: post.message || aiReason,
              image: post.full_picture || null,
              schedule: {
                startDate: eventDate ? eventDate.toISOString().split('T')[0] : null,
                endDate: eventDate ? eventDate.toISOString().split('T')[0] : null,
                startTime: timeMatch ? timeMatch[1] : null,
                endTime: null,
              },
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
                aiConfidenceScore: post.aiAnalysis.score,
                aiReason: aiReason,
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
   * Uses AI to analyze if a post is suitable for Pinntag
   * Now supports multimodal analysis - analyzes both text AND images!
   * Returns: { suitable: boolean, reason: string, score: number, category?: string }
   */
  async analyzePostWithAI(post: FacebookPost): Promise<AIAnalysisResult> {
    try {
      const model = genAI.getGenerativeModel({
        model: AI_MODEL_NAME,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

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
        Analyze if this Facebook post is suitable for Pinntag, a local business discovery and deals platform.

        PRIMARY USE CASE: This is used to extract EVENTS and DEALS from business Facebook posts.
        Posts with event flyers, promotional images, or deal announcements (even without text messages) are highly valuable.

        ${imageUrls.length > 0 ? `
        ⚠️ CRITICAL: IMAGE ANALYSIS WITH OCR ⚠️
        This post has ${imageUrls.length} image(s) attached. You MUST analyze the images FIRST and READ ANY TEXT IN THE IMAGES.

        STEP 1 - READ AND ANALYZE THE IMAGE(S):
        - READ all text visible in the image (event flyers, promotional posters, menu boards, deal announcements)
        - Identify what the image shows: event flyer, promotional poster, food photo, product photo, award certificate, personal photo, missing person poster
        - Check for event details: date, time, location, event name, special offers
        - Check for deal/promotion details: discounts, special offers, limited-time deals
        - Is it professional/promotional quality?
        - Is it a missing person/child alert poster? (NEVER suitable, even if text says otherwise)

        STEP 2 - IMAGE CONTENT OVERRIDES POST MESSAGE:
        - If image shows a missing person poster → Mark as NOT suitable (score 0-10), REGARDLESS of what the post message says
        - If image shows personal/family content → Mark as NOT suitable (score 0-20), REGARDLESS of post message
        - If image shows political content → Mark as NOT suitable (score 0-15), REGARDLESS of post message
        - If image shows EVENT FLYER with details (even if post message is empty) → Mark as suitable (score 80-95)
        - If image shows PROMOTIONAL POSTER/DEAL (even if post message is empty) → Mark as suitable (score 85-95)
        - If image shows food/products/awards → Mark as suitable ONLY if it makes sense for a business to post

        STEP 3 - POST MESSAGE IS SECONDARY:
        - Post message is only used to ADD CONTEXT to what you see in the image
        - If post message contradicts image, the IMAGE WINS
        - Empty post message is OK if image contains event/deal/promotional content
        - Text like "James Beard Award" with a missing child poster image = NOT SUITABLE (score 0)

        SPECIAL CASE - POSTS WITHOUT MESSAGES:
        - If post has NO message but image contains event flyer/promotional content → ACCEPT (score 80-95)
        - If post has NO message and image is just a profile/cover photo → REJECT (score 0-20)
        ` : ""}

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

        Pinntag Suitability Criteria:
        1. Business-related content ONLY (promotions, EVENTS, offers, deals, products, services, menu items, awards, business announcements)
        2. Professional or promotional in nature
        3. Could attract customers or drive foot traffic to the business
        4. ${imageUrls.length > 0 ? "Image content must match or support the business message (mismatched images = NOT suitable)" : ""}

        HIGHLY SUITABLE (PRIORITIZE THESE):
        - EVENT FLYERS in images (even without post message) - look for date, time, location, event name
        - PROMOTIONAL POSTERS with deals/discounts (even without post message)
        - Special offers, limited-time deals, happy hour announcements
        - New menu items with photos
        - Grand opening/reopening announcements
        - Live music, entertainment, special guest announcements

        EXCLUDE (mark as NOT suitable):
        - Missing person/child alerts, Amber alerts, emergency notifications (EVEN if posted by a business)
        - Posts where the IMAGE shows missing person content, REGARDLESS of post message
        - Political content, controversial topics, or activism
        - Personal family updates, condolences, tragedy announcements
        - Posts where image and post message don't match (e.g., award text + missing person image)
        - Generic "thoughts and prayers" posts
        - Pure entertainment or memes not related to business
        - Community service announcements (unless directly promoting the business)
        - News sharing (unless it's about the business itself, like awards or recognition)
        - Profile/cover photo updates WITHOUT event/promotional content in the image

        Score Guidelines:
        - 90-100: EVENT FLYERS with clear details, PROMOTIONAL DEALS with discounts, new menu items with attractive photos
        - 80-89: Events or promotions mentioned in text with supporting images, special announcements
        - 70-79: Business-related announcements (awards, achievements) where image matches text
        - 50-69: Borderline business content (general updates with some promotional value)
        - 0-49: Not suitable for Pinntag (non-business content, alerts, personal posts, missing person posters, image/text mismatch, or profile updates without promotional content)

        You must respond with only a JSON object matching this schema:
        {
          "type": "object",
          "properties": {
            "suitable": { "type": "boolean" },
            "reason": { "type": "string" },
            "score": { "type": "number" },
            "category": { "type": "string", "enum": ["promotion", "event", "product", "service", "announcement", "other"] }
          },
          "required": ["suitable", "reason", "score"]
        }`;

      // Build multimodal content with images if available
      const contentParts: any[] = [{ text: prompt }];

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

            contentParts.push({
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
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

      // Generate content with multimodal input (text + images)
      const result = await model.generateContent(contentParts);
      const response = result.response.text();

      logger.info(
        {
          postId: post.id,
          aiResponse: response,
          hadImages: imageUrls.length > 0,
          imagesAnalyzed: contentParts.length - 1,
        },
        "AI analysis for post (with image analysis)"
      );

      const analysis: AIAnalysisResult = JSON.parse(response);

      return {
        suitable: analysis.suitable === true,
        reason: analysis.reason || "No reason provided",
        score: analysis.score || 0,
        category: analysis.category,
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
