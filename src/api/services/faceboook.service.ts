import axios from "axios";
import qs from "qs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../../utils/logger.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  attachments?: {
    data: {
      type: string;
      description?: string;
      title?: string;
    }[];
  };
  likes?: {
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
  async fetchLongLivedToken(token: string) {
    const client_id = process.env.FACEBOOK_CLIENT_ID;
    const client_secret = process.env.FACEBOOK_CLIENT_SECRET;
    const fb_exchange_token = token;
    const grant_type = "fb_exchange_token";

    const config = {
      method: "get",
      url: `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=${grant_type}&client_id=${client_id}&client_secret=${client_secret}&fb_exchange_token=${fb_exchange_token}`,
      headers: {},
    };

    const result = axios
      .request(config)
      .then((response) => {
        console.log(response.data);
        return {
          success: true,
          data: response.data,
        };
      })
      .catch((error) => {
        console.log(error);
        return {
          success: false,
          data: error.message,
        };
      });
    return result;
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
      url: "https://graph.facebook.com/me/feed",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      data: qs.stringify(data),
    };
    console.log("config for facebook:-----------", config);
    const result = axios
      .request(config)
      .then((response) => {
        console.log(response.data);
        return {
          success: true,
          data: response.data,
        };
      })
      .catch((error) => {
        console.log(error);
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
      url: "https://graph.facebook.com/me/photos",
      headers: {
        "Content-Type": "application/json",
      },
      data,
    };

    const result = axios.request(config).then(
      (response) => {
        console.log(response.data);
        return {
          success: true,
          data: response.data,
        };
      },
      (error) => {
        console.log(error);
        return {
          success: false,
          data: error.message,
        };
      }
    );
    return result;
  }

  async getAllPosts(token: string) {
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://graph.facebook.com/me/posts?fields=id,message,created_time,full_picture,story,attachments{media,type,url,description,title},likes.summary(true),comments.summary(true),shares",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const result = axios.request(config).then(
      (response) => {
        console.log(response.data);
        return {
          success: true,
          data: response.data,
        };
      },
      (error) => {
        console.log(error);
        return {
          success: false,
          data: error.message,
        };
      }
    );
    return result;
  }

  /**
   * Filters Facebook posts that are suitable for Pinntag
   * Criteria:
   * - Has meaningful content (message or story)
   * - Contains engagement (likes, comments, or shares)
   * - Has media attachments (images/videos) or descriptive text
   * - Not just status updates or check-ins without content
   */
  filterPinntagSuitablePosts(posts: any[]) {
    return posts.filter((post) => {
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

      // Prioritize posts with engagement
      const likesCount = post.likes?.summary?.total_count || 0;
      const commentsCount = post.comments?.summary?.total_count || 0;
      const sharesCount = post.shares?.count || 0;
      const totalEngagement = likesCount + commentsCount + sharesCount;

      // Filter criteria:
      // 1. Posts with media attachments (images/videos)
      // 2. Posts with meaningful text (more than 20 characters)
      // 3. Posts with engagement
      const hasMedia =
        hasAttachments &&
        post.attachments.data.some(
          (att: any) =>
            att.type === "photo" || att.type === "video" || att.type === "album"
        );
      const hasMeaningfulText = hasMessage && post.message.length > 20;
      const hasEngagement = totalEngagement > 0;

      // Post is suitable if it has media OR (meaningful text AND some engagement)
      return hasMedia || (hasMeaningfulText && hasEngagement);
    });
  }

  /**
   * Uses AI to analyze if a post is suitable for Pinntag
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
        likesCount: post.likes?.summary?.total_count || 0,
        commentsCount: post.comments?.summary?.total_count || 0,
        sharesCount: post.shares?.count || 0,
        attachmentDescriptions: attachmentsData.map(
          (att) => att.description || att.title || ""
        ),
      };

      const prompt = `
        Analyze if this Facebook post is suitable for Pinntag, a local business discovery and deals platform.

        Post Data:
        - Message: "${postData.message}"
        - Story: "${postData.story}"
        - Has Media: ${postData.hasMedia}
        - Media Types: ${postData.mediaTypes.join(", ")}
        - Engagement: ${postData.likesCount} likes, ${
        postData.commentsCount
      } comments, ${postData.sharesCount} shares
        - Attachment Descriptions: ${postData.attachmentDescriptions.join(
          " | "
        )}

        Pinntag Suitability Criteria:
        1. Business-related content (promotions, events, offers, products, services)
        2. Local/community focused content
        3. Has visual appeal or engaging media
        4. Professional or promotional in nature
        5. Could attract customers or drive foot traffic
        6. Not purely personal posts (family photos, personal updates)
        7. Not political, controversial, or inappropriate content

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

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      logger.info(
        { postId: post.id, aiResponse: response },
        "AI analysis for post"
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
   */
  async getAllPostsForPinntag(
    token: string,
    useAI: boolean = false,
    minScore: number = 60
  ) {
    try {
      const config = {
        method: "get",
        maxBodyLength: Infinity,
        url: "https://graph.facebook.com/me/posts?fields=id,message,created_time,full_picture,story,attachments{media,type,url,description,title},likes.summary(true),comments.summary(true),shares&limit=100",
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
