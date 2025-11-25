import { GoogleGenAI } from "@google/genai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../utils/logger.js";
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

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
});

const s3 = new S3Client({ region: process.env.AWS_REGION });
const S3_BUCKET = process.env.AWS_S3_BUCKET!;
const S3_IMAGE_PREFIX = "ai-generated-images";

// Model for image generation
const IMAGE_MODEL = "gemini-2.0-flash-exp-image-generation";

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
 * Upload image buffer to S3 and return the URL
 */
async function uploadImageToS3(
  imageBuffer: Buffer,
  businessId: string,
  mimeType: string = "image/png"
): Promise<{ url: string; key: string }> {
  const extension = mimeType.split("/")[1] || "png";
  const key = `${S3_IMAGE_PREFIX}/${businessId}/${uuidv4()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: imageBuffer,
      ContentType: mimeType,
      // Make publicly accessible for easy sharing
      // ACL: "public-read",
    })
  );

  const url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { url, key };
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
      const response = await genAI.models.generateContent({
        model: IMAGE_MODEL,
        contents: finalPrompt,
        config: {
          responseModalities: ["Text", "Image"],
        },
      });

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
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_GENERATION,
        subType: contentType,
        imageCount: 0,
        model: IMAGE_MODEL,
        success: false,
        errorMessage: error.message,
      });

      logger.error(
        { businessId, error: error.message },
        "Error generating image with Gemini"
      );
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * Edit an existing image with a text prompt
   */
  static async editImage(params: ImageEditParams): Promise<GeneratedImage> {
    const { businessId, imageUrl, editPrompt, preserveElements } = params;

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
      const response = await genAI.models.generateContent({
        model: IMAGE_MODEL,
        contents: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: imageMimeType,
            },
          },
          fullPrompt,
        ],
        config: {
          responseModalities: ["Text", "Image"],
        },
      });

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
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_EDIT,
        imageCount: 0,
        model: IMAGE_MODEL,
        success: false,
        errorMessage: error.message,
      });

      logger.error(
        { businessId, error: error.message },
        "Error editing image with Gemini"
      );
      throw new Error(`Image editing failed: ${error.message}`);
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
