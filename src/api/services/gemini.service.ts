import { GoogleGenerativeAI } from "@google/generative-ai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../utils/logger.js";
import { setDefaultAutoSelectFamily } from "node:net";
import {
  ImageGenerationParams,
  ImageEditParams,
  ContentImageParams,
  GeneratedImage,
  ImageStyle,
  ContentType,
} from "../../utils/types/aiAssist.types.js";
import {
  checkImageGenerationAccess,
  recordFeatureUsage,
} from "../../utils/subscription.utils.js";
import { UsageTrackingService } from "./usageTracking.service.js";
import { UsageType } from "../../models/aiUsage.model.js";

// ===========================
// Configuration
// ===========================

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Backblaze B2 configuration constants
const S3_BUCKET = process.env.B2_BUCKET_NAME!;
const CDN_DOMAIN = process.env.CDN_DOMAIN!;
const S3_IMAGE_PREFIX = "ai-generated-images";

// Model for image generation
// Using Gemini 2.5 Flash Image (aka "Nano Banana") for fast image generation
const IMAGE_MODEL = "gemini-2.5-flash-image";

// Feature flag to enable/disable image generation
const ENABLE_IMAGE_GENERATION = process.env.ENABLE_IMAGE_GENERATION === "true";

// ===========================
// Helper Functions
// ===========================

/**
 * Build a detailed prompt based on content type and style
 */
function buildImagePrompt(params: {
  basePrompt: string;
  style?: ImageStyle;
  contentType?: ContentType;
  includeText?: string;
  colorScheme?: string;
  brandElements?: string;
}): string {
  const parts: string[] = [];

  // Add style instructions
  if (params.style) {
    const styleInstructions: Record<ImageStyle, string> = {
      photorealistic: "Create a photorealistic, high-quality photograph",
      illustration: "Create a modern, clean illustration style image",
      minimal: "Create a minimalist design with clean lines and simple shapes",
      vibrant: "Create a vibrant, colorful image with bold colors",
      professional: "Create a professional, corporate-style image",
      artistic: "Create an artistic, creative interpretation",
    };
    parts.push(styleInstructions[params.style]);
  }

  // Add content type context
  if (params.contentType) {
    const contentContext: Record<ContentType, string> = {
      broadcast: "suitable for a business announcement or broadcast message",
      offer: "suitable for a promotional offer or discount campaign",
      reward: "suitable for a loyalty reward or customer appreciation",
      event: "suitable for an event promotion or invitation",
    };
    parts.push(contentContext[params.contentType]);
  }

  // Add the main prompt
  parts.push(params.basePrompt);

  // Add text to include
  if (params.includeText) {
    parts.push(
      `Include the following text prominently and legibly: "${params.includeText}"`
    );
  }

  // Add color scheme
  if (params.colorScheme) {
    parts.push(`Use the following color scheme: ${params.colorScheme}`);
  }

  // Add brand elements
  if (params.brandElements) {
    parts.push(`Incorporate these brand elements: ${params.brandElements}`);
  }

  // Add quality instructions
  parts.push(
    "High quality, professional, suitable for marketing and social media use"
  );

  return parts.join(". ") + ".";
}

/**
 * Upload image buffer to Backblaze B2 and return the CDN URL
 */
async function uploadImageToS3(
  imageBuffer: Buffer,
  businessId: string,
  mimeType: string = "image/png"
): Promise<{ url: string; key: string }> {
  const extension = mimeType.split("/")[1] || "png";
  const key = `${S3_IMAGE_PREFIX}/${businessId}/${uuidv4()}.${extension}`;

  logger.info(
    {
      businessId,
      bucket: S3_BUCKET,
      key,
      imageSize: imageBuffer.length,
      mimeType,
    },
    "Uploading image to Backblaze B2"
  );

  // Retry logic for network issues
  let lastError: any;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(
        { businessId, attempt, maxRetries },
        `Upload attempt ${attempt}/${maxRetries}`
      );

      // Create a fresh S3 client for each upload to avoid connection pooling issues
      // Force IPv4 to avoid IPv6 timeout issues
      setDefaultAutoSelectFamily(false);

      const s3Client = new S3Client({
        region: process.env.B2_REGION!,
        endpoint: process.env.B2_ENDPOINT!,
        credentials: {
          accessKeyId: process.env.B2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
        maxAttempts: 1, // Disable SDK's internal retry to use our own
        requestHandler: new NodeHttpHandler({
          connectionTimeout: 60000,
          requestTimeout: 120000,
          socketTimeout: 60000,
        }),
      });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: imageBuffer,
          ContentType: mimeType,
          // Make publicly accessible for easy sharing
          // ACL: "public-read",
        })
      );

      // Destroy the client after use
      s3Client.destroy();

      // Use CDN domain for public access
      const url = `https://${CDN_DOMAIN}/${key}`;

      logger.info({ businessId, url, key, attempt }, "Image uploaded successfully to B2");

      return { url, key };
    } catch (error: any) {
      lastError = error;
      logger.warn(
        {
          businessId,
          attempt,
          error: error.message,
          errorCode: error.code,
        },
        `Upload attempt ${attempt} failed`
      );

      // If not last attempt, wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        logger.info({ businessId, waitTime }, "Waiting before retry");
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  logger.error(
    {
      businessId,
      error: lastError.message,
      errorCode: lastError.code,
      bucket: S3_BUCKET,
      endpoint: process.env.B2_ENDPOINT,
    },
    "Failed to upload image to Backblaze B2 after all retries"
  );
  throw lastError;
}

/**
 * Generate aspect ratio instructions for the prompt
 */
function getAspectRatioInstructions(
  aspectRatio: string | undefined
): string {
  if (!aspectRatio) return "";

  const instructions: Record<string, string> = {
    "1:1": "Create a square image (1:1 aspect ratio)",
    "16:9": "Create a wide landscape image (16:9 aspect ratio, like a banner)",
    "9:16": "Create a tall portrait image (9:16 aspect ratio, like a story)",
    "4:3": "Create a standard landscape image (4:3 aspect ratio)",
    "3:4": "Create a standard portrait image (3:4 aspect ratio)",
  };

  return instructions[aspectRatio] || "";
}

/**
 * Get default placeholder image based on content type when image generation is disabled
 */
function getPlaceholderImage(contentType?: ContentType): string {
  const baseUrl = "https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/";

  const placeholders: Record<string, string> = {
    offer: `${baseUrl}Special_Offer.jpg`,
    broadcast: `${baseUrl}Announcement.jpg`,
    reward: `${baseUrl}Reward_Special.jpg`,
    event: `${baseUrl}Event_Promotion.jpg`,
  };

  return placeholders[contentType || "offer"] || placeholders.offer;
}

// ===========================
// Gemini Service Class
// ===========================

export class GeminiService {
  /**
   * Generate an image from a text prompt
   */
  static async generateImage(
    params: ImageGenerationParams
  ): Promise<GeneratedImage> {
    const { businessId, prompt, contentType, style, aspectRatio, includeText, colorScheme, brandElements } = params;

    // Check if image generation is disabled via feature flag
    if (!ENABLE_IMAGE_GENERATION) {
      logger.info(
        { businessId, contentType },
        "Image generation disabled via feature flag, returning placeholder"
      );

      const placeholderUrl = getPlaceholderImage(contentType);

      return {
        imageUrl: placeholderUrl,
        s3Key: "placeholder",
        mimeType: "image/jpeg",
        prompt,
        style,
      };
    }

    // Check subscription access
    const access = await checkImageGenerationAccess(businessId);
    if (!access.hasAccess) {
      throw new Error(access.reason || "Image generation not available");
    }

    try {
      // Build enhanced prompt
      const enhancedPrompt = buildImagePrompt({
        basePrompt: prompt,
        style,
        contentType,
        includeText,
        colorScheme,
        brandElements,
      });

      // Add aspect ratio instructions
      const aspectInstructions = getAspectRatioInstructions(aspectRatio);
      const finalPrompt = aspectInstructions
        ? `${aspectInstructions}. ${enhancedPrompt}`
        : enhancedPrompt;

      logger.info(
        { businessId, contentType, style, promptLength: finalPrompt.length },
        "Generating image with Gemini"
      );

      // Generate image using Gemini
      const model = genAI.getGenerativeModel({ model: IMAGE_MODEL });
      const result = await model.generateContent(finalPrompt);
      const response = result.response;

      // Extract image from response
      let imageData: string | null = null;
      let mimeType = "image/png";

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            imageData = part.inlineData.data;
            mimeType = part.inlineData.mimeType || "image/png";
            break;
          }
        }
      }

      if (!imageData) {
        throw new Error("No image data in Gemini response");
      }

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageData, "base64");

      // Upload to S3
      const { url, key } = await uploadImageToS3(
        imageBuffer,
        businessId,
        mimeType
      );

      // Record usage for subscription limits
      await recordFeatureUsage(businessId, "images", 1);

      // Track detailed usage
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_GENERATION,
        subType: contentType,
        imageCount: 1,
        model: IMAGE_MODEL,
        success: true,
        metadata: {
          style,
          aspectRatio,
          s3Key: key,
          promptLength: finalPrompt.length,
        },
      });

      logger.info(
        { businessId, s3Key: key },
        "Image generated and uploaded successfully"
      );

      return {
        imageUrl: url,
        s3Key: key,
        mimeType,
        prompt: finalPrompt,
        style,
      };
    } catch (error: any) {
      // Track failed usage
      const errorMessage = error.message || error.toString() || "Unknown error";
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_GENERATION,
        subType: contentType,
        imageCount: 0,
        model: IMAGE_MODEL,
        success: false,
        errorMessage,
      });

      logger.error(
        {
          businessId,
          error: errorMessage,
          errorStack: error.stack,
          errorDetails: JSON.stringify(error, null, 2)
        },
        "Error generating image with Gemini"
      );
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  }

  /**
   * Edit an existing image with a text prompt
   */
  static async editImage(params: ImageEditParams): Promise<GeneratedImage> {
    const { businessId, imageUrl, editPrompt, preserveElements } = params;

    // Check if image generation is disabled via feature flag
    if (!ENABLE_IMAGE_GENERATION) {
      logger.info(
        { businessId },
        "Image editing disabled via feature flag, returning original image"
      );

      return {
        imageUrl: imageUrl,
        s3Key: "placeholder",
        mimeType: "image/jpeg",
        prompt: editPrompt,
      };
    }

    // Check subscription access
    const access = await checkImageGenerationAccess(businessId);
    if (!access.hasAccess) {
      throw new Error(access.reason || "Image editing not available");
    }

    try {
      // Fetch the existing image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageArrayBuffer).toString("base64");
      const imageMimeType =
        imageResponse.headers.get("content-type") || "image/png";

      // Build edit prompt
      let fullPrompt = editPrompt;
      if (preserveElements && preserveElements.length > 0) {
        fullPrompt += `. Preserve these elements: ${preserveElements.join(", ")}`;
      }

      logger.info(
        { businessId, editPrompt: fullPrompt.substring(0, 100) },
        "Editing image with Gemini"
      );

      // Send image + prompt to Gemini
      const model = genAI.getGenerativeModel({ model: IMAGE_MODEL });
      const result = await model.generateContent([
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageMimeType,
          },
        },
        { text: fullPrompt },
      ]);
      const response = result.response;

      // Extract edited image from response
      let imageData: string | null = null;
      let mimeType = "image/png";

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            imageData = part.inlineData.data;
            mimeType = part.inlineData.mimeType || "image/png";
            break;
          }
        }
      }

      if (!imageData) {
        throw new Error("No image data in Gemini edit response");
      }

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageData, "base64");

      // Upload to S3
      const { url, key } = await uploadImageToS3(
        imageBuffer,
        businessId,
        mimeType
      );

      // Record usage for subscription limits
      await recordFeatureUsage(businessId, "images", 1);

      // Track detailed usage
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_EDIT,
        imageCount: 1,
        model: IMAGE_MODEL,
        success: true,
        metadata: {
          s3Key: key,
          promptLength: fullPrompt.length,
          sourceImageUrl: imageUrl,
        },
      });

      logger.info(
        { businessId, s3Key: key },
        "Image edited and uploaded successfully"
      );

      return {
        imageUrl: url,
        s3Key: key,
        mimeType,
        prompt: fullPrompt,
      };
    } catch (error: any) {
      // Track failed usage
      const errorMessage = error.message || error.toString() || "Unknown error";
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_EDIT,
        imageCount: 0,
        model: IMAGE_MODEL,
        success: false,
        errorMessage,
      });

      logger.error(
        {
          businessId,
          error: errorMessage,
          errorStack: error.stack,
          errorDetails: JSON.stringify(error, null, 2)
        },
        "Error editing image with Gemini"
      );
      throw new Error(`Image editing failed: ${errorMessage}`);
    }
  }

  /**
   * Generate an image optimized for specific content types
   */
  static async generateContentImage(
    params: ContentImageParams
  ): Promise<GeneratedImage> {
    const {
      businessId,
      contentType,
      title,
      description,
      style = "professional",
      aspectRatio = "1:1",
      brandColors,
      includeLogoSpace,
      category,
      subcategory,
      tags,
      dealType,
      discountValue,
      discountType,
      eventType,
      targetAudience,
      tone,
      callToAction,
      promoCode,
    } = params;

    // Build a comprehensive content-specific prompt
    const promptParts: string[] = [];

    // Content type specific visuals
    const contentVisuals: Record<ContentType, string> = {
      broadcast:
        "Create an attention-grabbing announcement visual with dynamic elements",
      offer:
        "Create an exciting promotional image with visual cues for savings and deals",
      reward:
        "Create a celebratory reward image with elements suggesting value and appreciation",
      event:
        "Create an inviting event image that conveys excitement and anticipation",
    };

    promptParts.push(contentVisuals[contentType]);
    promptParts.push(`Theme: ${title}`);

    if (description) {
      promptParts.push(`Context: ${description.substring(0, 300)}`);
    }

    // Add business context
    if (category) {
      promptParts.push(`Business category: ${category}`);
    }
    if (subcategory) {
      promptParts.push(`Subcategory: ${subcategory}`);
    }
    if (tags && tags.length > 0) {
      promptParts.push(`Related to: ${tags.slice(0, 5).join(", ")}`);
    }

    // Add deal/offer specific elements
    if (dealType) {
      promptParts.push(`Deal type: ${dealType}`);
    }
    if (discountValue && discountType) {
      const discountText = discountType === "percentage"
        ? `${discountValue}% off`
        : discountType === "fixed"
        ? `$${discountValue} off`
        : "Buy One Get One";
      promptParts.push(`Visually represent: ${discountText}`);
    }

    // Add event specific elements
    if (eventType) {
      promptParts.push(`Event type: ${eventType}`);
    }

    // Add audience and tone
    if (targetAudience) {
      promptParts.push(`Target audience vibe: ${targetAudience}`);
    }
    if (tone) {
      promptParts.push(`Visual tone should be: ${tone}`);
    }

    // Add text elements to include
    if (callToAction) {
      promptParts.push(`Include call-to-action text: "${callToAction}"`);
    }
    if (promoCode) {
      promptParts.push(`Include promo code prominently: "${promoCode}"`);
    }

    // Add brand colors
    if (brandColors && brandColors.length > 0) {
      promptParts.push(`Use brand colors: ${brandColors.join(", ")}`);
    }

    if (includeLogoSpace) {
      promptParts.push("Leave clear space in a corner for a logo overlay");
    }

    const prompt = promptParts.join(". ");

    // Use the main generateImage method
    return this.generateImage({
      businessId,
      prompt,
      contentType,
      style,
      aspectRatio,
    });
  }

  /**
   * Generate multiple image variations for A/B testing
   */
  static async generateImageVariations(
    params: ImageGenerationParams,
    count: number = 3
  ): Promise<GeneratedImage[]> {
    // Check if image generation is disabled via feature flag
    if (!ENABLE_IMAGE_GENERATION) {
      logger.info(
        { businessId: params.businessId },
        "Image variations disabled via feature flag, returning single placeholder"
      );

      const placeholderUrl = getPlaceholderImage(params.contentType);

      return [{
        imageUrl: placeholderUrl,
        s3Key: "placeholder",
        mimeType: "image/jpeg",
        prompt: params.prompt,
        style: params.style,
      }];
    }

    const variations: GeneratedImage[] = [];
    const styles: ImageStyle[] = [
      "professional",
      "vibrant",
      "minimal",
      "artistic",
    ];

    for (let i = 0; i < Math.min(count, 4); i++) {
      try {
        const variation = await this.generateImage({
          ...params,
          style: styles[i] || params.style,
        });
        variations.push(variation);
      } catch (error: any) {
        logger.warn(
          { businessId: params.businessId, variation: i, error: error.message },
          "Failed to generate image variation"
        );
      }
    }

    if (variations.length === 0) {
      throw new Error("Failed to generate any image variations");
    }

    return variations;
  }

  /**
   * Generate text-heavy images (posters, flyers, etc.)
   */
  static async generateTextImage(params: {
    businessId: string;
    headline: string;
    subheadline?: string;
    details?: string[];
    callToAction?: string;
    style?: ImageStyle;
    aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
    colorScheme?: string;
  }): Promise<GeneratedImage> {
    const {
      businessId,
      headline,
      subheadline,
      details,
      callToAction,
      style = "professional",
      aspectRatio = "1:1",
      colorScheme,
    } = params;

    // Build a prompt for text-heavy image
    const promptParts = [
      "Create a marketing poster or flyer design",
      `Main headline text: "${headline}"`,
    ];

    if (subheadline) {
      promptParts.push(`Subheadline: "${subheadline}"`);
    }

    if (details && details.length > 0) {
      promptParts.push(`Additional details: ${details.join(", ")}`);
    }

    if (callToAction) {
      promptParts.push(
        `Include a call-to-action button or text: "${callToAction}"`
      );
    }

    promptParts.push(
      "Ensure all text is clearly legible and well-positioned",
      "Use professional typography and layout"
    );

    const prompt = promptParts.join(". ");

    return this.generateImage({
      businessId,
      prompt,
      contentType: "broadcast",
      style,
      aspectRatio,
      colorScheme,
    });
  }
}
