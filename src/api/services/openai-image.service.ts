import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { v4 as uuidv4 } from "uuid";
import { toFile } from "openai";
import { logger } from "../../utils/logger.js";
import { openai } from "../../utils/openai.js";
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

const S3_BUCKET = process.env.B2_BUCKET_NAME!;
const CDN_DOMAIN = process.env.CDN_DOMAIN!;
const S3_IMAGE_PREFIX = "ai-generated-images";

// gpt-image-1-mini: cheaper, faster sibling of gpt-image-1
const OPENAI_IMAGE_MODEL = "gpt-image-1-mini";

const ENABLE_IMAGE_GENERATION = process.env.ENABLE_IMAGE_GENERATION === "true";

type OpenAIImageSize = "1024x1024" | "1024x1536" | "1536x1024" | "auto";

// ===========================
// Helper Functions
// ===========================

function buildImagePrompt(params: {
  basePrompt: string;
  style?: ImageStyle;
  contentType?: ContentType;
  includeText?: string;
  colorScheme?: string;
  brandElements?: string;
}): string {
  const parts: string[] = [];

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

  if (params.contentType) {
    const contentContext: Record<ContentType, string> = {
      broadcast: "suitable for a business announcement or broadcast message",
      offer: "suitable for a promotional offer or discount campaign",
      reward: "suitable for a loyalty reward or customer appreciation",
      event: "suitable for an event promotion or invitation",
    };
    parts.push(contentContext[params.contentType]);
  }

  parts.push(params.basePrompt);

  if (params.includeText) {
    parts.push(
      `Include the following text prominently and legibly: "${params.includeText}"`
    );
  }

  if (params.colorScheme) {
    parts.push(`Use the following color scheme: ${params.colorScheme}`);
  }

  if (params.brandElements) {
    parts.push(`Incorporate these brand elements: ${params.brandElements}`);
  }

  parts.push(
    "High quality, professional, suitable for marketing and social media use"
  );

  return parts.join(". ") + ".";
}

/**
 * Map our aspect-ratio format to gpt-image-1-mini's supported sizes.
 * gpt-image-1-mini supports: 1024x1024 (square), 1024x1536 (portrait),
 * 1536x1024 (landscape), and "auto".
 */
function mapAspectRatioToSize(
  aspectRatio: string | undefined
): OpenAIImageSize {
  switch (aspectRatio) {
    case "1:1":
      return "1024x1024";
    case "16:9":
    case "4:3":
      return "1536x1024";
    case "9:16":
    case "3:4":
      return "1024x1536";
    default:
      return "1024x1024";
  }
}

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

  let lastError: any;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(
        { businessId, attempt, maxRetries },
        `Upload attempt ${attempt}/${maxRetries}`
      );

      setDefaultAutoSelectFamily(false);

      const s3Client = new S3Client({
        region: process.env.B2_REGION!,
        endpoint: process.env.B2_ENDPOINT!,
        credentials: {
          accessKeyId: process.env.B2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
        maxAttempts: 1,
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
        })
      );

      s3Client.destroy();

      const url = `https://${CDN_DOMAIN}/${key}`;

      logger.info(
        { businessId, url, key, attempt },
        "Image uploaded successfully to B2"
      );

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

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        logger.info({ businessId, waitTime }, "Waiting before retry");
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

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

/**
 * Extract a PNG buffer from an OpenAI images response. gpt-image-1-mini
 * always returns base64 in `b64_json`.
 */
function extractImageBuffer(
  response: { data?: Array<{ b64_json?: string | null; url?: string | null }> } | null
): Buffer {
  const first = response?.data?.[0];
  if (!first?.b64_json) {
    throw new Error("No image data in OpenAI response");
  }
  return Buffer.from(first.b64_json, "base64");
}

// ===========================
// OpenAI Image Service Class
// ===========================

export class OpenAIImageService {
  /**
   * Generate an image from a text prompt using gpt-image-1-mini.
   */
  static async generateImage(
    params: ImageGenerationParams
  ): Promise<GeneratedImage> {
    const {
      businessId,
      prompt,
      contentType,
      style,
      aspectRatio,
      includeText,
      colorScheme,
      brandElements,
    } = params;

    if (!ENABLE_IMAGE_GENERATION) {
      logger.info(
        { businessId, contentType },
        "Image generation disabled via feature flag, returning placeholder"
      );

      return {
        imageUrl: getPlaceholderImage(contentType),
        s3Key: "placeholder",
        mimeType: "image/jpeg",
        prompt,
        style,
      };
    }

    const access = await checkImageGenerationAccess(businessId);
    if (!access.hasAccess) {
      throw new Error(access.reason || "Image generation not available");
    }

    try {
      const enhancedPrompt = buildImagePrompt({
        basePrompt: prompt,
        style,
        contentType,
        includeText,
        colorScheme,
        brandElements,
      });

      const size = mapAspectRatioToSize(aspectRatio);

      logger.info(
        {
          businessId,
          contentType,
          style,
          size,
          promptLength: enhancedPrompt.length,
          model: OPENAI_IMAGE_MODEL,
        },
        "Generating image with OpenAI gpt-image-1-mini"
      );

      const response = await openai.images.generate({
        model: OPENAI_IMAGE_MODEL,
        prompt: enhancedPrompt,
        size,
        n: 1,
      });

      const imageBuffer = extractImageBuffer(response);
      const mimeType = "image/png";

      const { url, key } = await uploadImageToS3(
        imageBuffer,
        businessId,
        mimeType
      );

      await recordFeatureUsage(businessId, "images", 1);

      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_GENERATION,
        subType: contentType,
        imageCount: 1,
        model: OPENAI_IMAGE_MODEL,
        success: true,
        metadata: {
          style,
          aspectRatio,
          size,
          s3Key: key,
          promptLength: enhancedPrompt.length,
          provider: "openai",
        },
      });

      logger.info(
        { businessId, s3Key: key },
        "Image generated with OpenAI and uploaded successfully"
      );

      return {
        imageUrl: url,
        s3Key: key,
        mimeType,
        prompt: enhancedPrompt,
        style,
      };
    } catch (error: any) {
      const errorMessage = error.message || error.toString() || "Unknown error";
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_GENERATION,
        subType: contentType,
        imageCount: 0,
        model: OPENAI_IMAGE_MODEL,
        success: false,
        errorMessage,
      });

      logger.error(
        {
          businessId,
          error: errorMessage,
          errorStack: error.stack,
        },
        "Error generating image with OpenAI"
      );
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  }

  /**
   * Edit an existing image with a text prompt using gpt-image-1-mini.
   */
  static async editImage(params: ImageEditParams): Promise<GeneratedImage> {
    const { businessId, imageUrl, editPrompt, preserveElements } = params;

    if (!ENABLE_IMAGE_GENERATION) {
      logger.info(
        { businessId },
        "Image editing disabled via feature flag, returning original image"
      );

      return {
        imageUrl,
        s3Key: "placeholder",
        mimeType: "image/jpeg",
        prompt: editPrompt,
      };
    }

    const access = await checkImageGenerationAccess(businessId);
    if (!access.hasAccess) {
      throw new Error(access.reason || "Image editing not available");
    }

    try {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const sourceMime =
        imageResponse.headers.get("content-type") || "image/png";
      const sourceArrayBuffer = await imageResponse.arrayBuffer();
      const sourceBuffer = Buffer.from(sourceArrayBuffer);

      let fullPrompt = editPrompt;
      if (preserveElements && preserveElements.length > 0) {
        fullPrompt += `. Preserve these elements: ${preserveElements.join(", ")}`;
      }

      const sourceExt = sourceMime.split("/")[1] || "png";
      const sourceFile = await toFile(
        sourceBuffer,
        `source-image.${sourceExt}`,
        { type: sourceMime }
      );

      logger.info(
        {
          businessId,
          editPrompt: fullPrompt.substring(0, 100),
          model: OPENAI_IMAGE_MODEL,
        },
        "Editing image with OpenAI gpt-image-1-mini"
      );

      const response = await openai.images.edit({
        model: OPENAI_IMAGE_MODEL,
        image: sourceFile,
        prompt: fullPrompt,
        n: 1,
      });

      const editedBuffer = extractImageBuffer(response);
      const mimeType = "image/png";

      const { url, key } = await uploadImageToS3(
        editedBuffer,
        businessId,
        mimeType
      );

      await recordFeatureUsage(businessId, "images", 1);

      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_EDIT,
        imageCount: 1,
        model: OPENAI_IMAGE_MODEL,
        success: true,
        metadata: {
          s3Key: key,
          promptLength: fullPrompt.length,
          sourceImageUrl: imageUrl,
          provider: "openai",
        },
      });

      logger.info(
        { businessId, s3Key: key },
        "Image edited with OpenAI and uploaded successfully"
      );

      return {
        imageUrl: url,
        s3Key: key,
        mimeType,
        prompt: fullPrompt,
      };
    } catch (error: any) {
      const errorMessage = error.message || error.toString() || "Unknown error";
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_EDIT,
        imageCount: 0,
        model: OPENAI_IMAGE_MODEL,
        success: false,
        errorMessage,
      });

      logger.error(
        {
          businessId,
          error: errorMessage,
          errorStack: error.stack,
        },
        "Error editing image with OpenAI"
      );
      throw new Error(`Image editing failed: ${errorMessage}`);
    }
  }

  /**
   * Generate an image optimized for a specific content type, using
   * title, description, deal/event terms and other AI-assist context
   * to compose the prompt.
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
      termsAndConditions,
      validityPeriod,
      hashtags,
    } = params;

    const promptParts: string[] = [];

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

    if (category) promptParts.push(`Business category: ${category}`);
    if (subcategory) promptParts.push(`Subcategory: ${subcategory}`);
    if (tags && tags.length > 0) {
      promptParts.push(`Related to: ${tags.slice(0, 5).join(", ")}`);
    }

    if (dealType) promptParts.push(`Deal type: ${dealType}`);
    if (discountValue && discountType) {
      const discountText =
        discountType === "percentage"
          ? `${discountValue}% off`
          : discountType === "fixed"
          ? `$${discountValue} off`
          : "Buy One Get One";
      promptParts.push(`Visually represent: ${discountText}`);
    }

    if (eventType) promptParts.push(`Event type: ${eventType}`);
    if (targetAudience) {
      promptParts.push(`Target audience vibe: ${targetAudience}`);
    }
    if (tone) promptParts.push(`Visual tone should be: ${tone}`);

    if (callToAction) {
      promptParts.push(`Include call-to-action text: "${callToAction}"`);
    }
    if (promoCode) {
      promptParts.push(`Include promo code prominently: "${promoCode}"`);
    }

    if (validityPeriod) {
      promptParts.push(`Highlight validity: "${validityPeriod}"`);
    }
    if (termsAndConditions) {
      // Use a short summary so the model treats it as visual context, not literal small print.
      const tcSummary = termsAndConditions.substring(0, 200);
      promptParts.push(
        `The visual must remain consistent with these terms (do not contradict them, do not render small print): ${tcSummary}`
      );
    }
    if (hashtags && hashtags.length > 0) {
      promptParts.push(
        `Themes to evoke (do NOT render as text): ${hashtags.slice(0, 5).join(", ")}`
      );
    }

    if (brandColors && brandColors.length > 0) {
      promptParts.push(`Use brand colors: ${brandColors.join(", ")}`);
    }

    if (includeLogoSpace) {
      promptParts.push("Leave clear space in a corner for a logo overlay");
    }

    const prompt = promptParts.join(". ");

    return this.generateImage({
      businessId,
      prompt,
      contentType,
      style,
      aspectRatio,
    });
  }

  /**
   * Generate multiple style variations for A/B testing.
   * gpt-image-1-mini's `n` parameter is restricted to 1, so we issue
   * sequential calls with different styles instead.
   */
  static async generateImageVariations(
    params: ImageGenerationParams,
    count: number = 3
  ): Promise<GeneratedImage[]> {
    if (!ENABLE_IMAGE_GENERATION) {
      logger.info(
        { businessId: params.businessId },
        "Image variations disabled via feature flag, returning single placeholder"
      );

      return [
        {
          imageUrl: getPlaceholderImage(params.contentType),
          s3Key: "placeholder",
          mimeType: "image/jpeg",
          prompt: params.prompt,
          style: params.style,
        },
      ];
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
          {
            businessId: params.businessId,
            variation: i,
            error: error.message,
          },
          "Failed to generate image variation with OpenAI"
        );
      }
    }

    if (variations.length === 0) {
      throw new Error("Failed to generate any image variations");
    }

    return variations;
  }

  /**
   * Generate text-heavy images (posters, flyers, etc.).
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
