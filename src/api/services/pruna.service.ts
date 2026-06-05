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

const PRUNA_API_KEY = process.env.PRUNA_IMAGE_GEN_API_KEY!;
const PRUNA_API_BASE = "https://api.pruna.ai/v1";

// Backblaze B2 configuration constants
const S3_BUCKET = process.env.B2_BUCKET_NAME!;
const CDN_DOMAIN = process.env.CDN_DOMAIN!;
const S3_IMAGE_PREFIX = "ai-generated-images";

// Model names
const PRUNA_IMAGE_MODEL = "p-image";
const PRUNA_IMAGE_EDIT_MODEL = "p-image-edit";

// Feature flag to enable/disable image generation
const ENABLE_IMAGE_GENERATION = process.env.ENABLE_IMAGE_GENERATION === "true";

// ===========================
// Pruna API Types
// ===========================

interface PrunaPredictionResponse {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  generation_url?: string;
  error?: string;
  message?: string;
  /** Returned in async mode — URL to poll for status */
  get_url?: string;
}

interface PrunaFileUploadResponse {
  id: string;
  urls: {
    get: string;
  };
}

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
 * Map our aspect ratio format to Pruna's supported format
 */
function mapAspectRatio(
  aspectRatio: string | undefined
): string {
  // Pruna supports aspect ratios like "16:9", "1:1", etc.
  return aspectRatio || "1:1";
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

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        logger.info({ businessId, waitTime }, "Waiting before retry");
        await new Promise(resolve => setTimeout(resolve, waitTime));
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

/**
 * Call Pruna API to create a prediction (image generation)
 */
async function createPrunaPrediction(
  prompt: string,
  aspectRatio: string,
  model: string = PRUNA_IMAGE_MODEL
): Promise<PrunaPredictionResponse> {
  const response = await fetch(`${PRUNA_API_BASE}/predictions`, {
    method: "POST",
    headers: {
      "apikey": PRUNA_API_KEY,
      "Model": model,
      "Try-Sync": "true",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: aspectRatio,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Pruna API error (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<PrunaPredictionResponse>;
}

/**
 * Poll a Pruna prediction until it completes or fails
 */
async function pollPrunaPrediction(
  predictionUrl: string,
  maxWaitMs: number = 120000
): Promise<PrunaPredictionResponse> {
  const startTime = Date.now();
  const pollInterval = 2000;

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(predictionUrl, {
      headers: {
        "apikey": PRUNA_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Pruna poll error (${response.status}): ${await response.text()}`);
    }

    const result = await response.json() as PrunaPredictionResponse;

    if (result.status === "succeeded") {
      return result;
    }

    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(`Pruna prediction ${result.status}: ${result.error || "Unknown error"}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error("Pruna prediction timed out after " + maxWaitMs + "ms");
}

/**
 * Download image from Pruna generation URL
 */
async function downloadPrunaImage(
  generationUrl: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const response = await fetch(generationUrl, {
    headers: {
      "apikey": PRUNA_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download Pruna image (${response.status}): ${await response.text()}`);
  }

  const mimeType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return { buffer, mimeType };
}

/**
 * Upload a file to Pruna for image editing
 */
async function uploadFileToPruna(
  imageBuffer: Buffer,
  filename: string = "image.jpg"
): Promise<PrunaFileUploadResponse> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)]);
  formData.append("content", blob, filename);

  const response = await fetch(`${PRUNA_API_BASE}/files`, {
    method: "POST",
    headers: {
      "apikey": PRUNA_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Pruna file upload error (${response.status}): ${await response.text()}`);
  }

  return response.json() as Promise<PrunaFileUploadResponse>;
}

// ===========================
// Pruna Service Class
// ===========================

export class PrunaService {
  /**
   * Generate an image from a text prompt using Pruna P-Image model
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

      return {
        imageUrl: getPlaceholderImage(contentType),
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

      const prunaAspectRatio = mapAspectRatio(aspectRatio);

      logger.info(
        { businessId, contentType, style, promptLength: enhancedPrompt.length, model: PRUNA_IMAGE_MODEL },
        "Generating image with Pruna P-Image"
      );

      // Create prediction via Pruna API (sync mode)
      let prediction = await createPrunaPrediction(enhancedPrompt, prunaAspectRatio);

      // If not immediately completed, poll for result
      if (prediction.status !== "succeeded" && prediction.get_url) {
        logger.info(
          { businessId, predictionId: prediction.id, status: prediction.status },
          "Pruna prediction not immediately ready, polling..."
        );
        prediction = await pollPrunaPrediction(prediction.get_url);
      }

      if (!prediction.generation_url) {
        throw new Error("No generation URL in Pruna response");
      }

      // Download the generated image
      const { buffer: imageBuffer, mimeType } = await downloadPrunaImage(prediction.generation_url);

      // Upload to S3
      const { url, key } = await uploadImageToS3(imageBuffer, businessId, mimeType);

      // Record usage for subscription limits
      await recordFeatureUsage(businessId, "images", 1);

      // Track detailed usage
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_GENERATION,
        subType: contentType,
        imageCount: 1,
        model: PRUNA_IMAGE_MODEL,
        success: true,
        metadata: {
          style,
          aspectRatio,
          s3Key: key,
          promptLength: enhancedPrompt.length,
          provider: "pruna",
        },
      });

      logger.info(
        { businessId, s3Key: key },
        "Image generated with Pruna and uploaded successfully"
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
        model: PRUNA_IMAGE_MODEL,
        success: false,
        errorMessage,
      });

      logger.error(
        {
          businessId,
          error: errorMessage,
          errorStack: error.stack,
        },
        "Error generating image with Pruna"
      );
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  }

  /**
   * Edit an existing image using Pruna P-Image-Edit model
   */
  static async editImage(params: ImageEditParams): Promise<GeneratedImage> {
    const { businessId, imageUrl, editPrompt, preserveElements } = params;

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
      const imageBuffer = Buffer.from(imageArrayBuffer);

      // Upload to Pruna file storage
      const uploadResult = await uploadFileToPruna(imageBuffer, "source-image.jpg");

      // Build edit prompt
      let fullPrompt = editPrompt;
      if (preserveElements && preserveElements.length > 0) {
        fullPrompt += `. Preserve these elements: ${preserveElements.join(", ")}`;
      }

      logger.info(
        { businessId, editPrompt: fullPrompt.substring(0, 100), model: PRUNA_IMAGE_EDIT_MODEL },
        "Editing image with Pruna P-Image-Edit"
      );

      // Create prediction with the uploaded file reference
      // p-image-edit accepts an "images" array of file URLs
      const response = await fetch(`${PRUNA_API_BASE}/predictions`, {
        method: "POST",
        headers: {
          "apikey": PRUNA_API_KEY,
          "Model": PRUNA_IMAGE_EDIT_MODEL,
          "Try-Sync": "true",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt: fullPrompt,
            images: [uploadResult.urls.get],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Pruna edit API error (${response.status}): ${await response.text()}`);
      }

      let prediction = await response.json() as PrunaPredictionResponse;

      // If not immediately completed, poll
      if (prediction.status !== "succeeded" && prediction.get_url) {
        prediction = await pollPrunaPrediction(prediction.get_url);
      }

      if (!prediction.generation_url) {
        throw new Error("No generation URL in Pruna edit response");
      }

      // Download the edited image
      const { buffer: editedBuffer, mimeType } = await downloadPrunaImage(prediction.generation_url);

      // Upload to S3
      const { url, key } = await uploadImageToS3(editedBuffer, businessId, mimeType);

      await recordFeatureUsage(businessId, "images", 1);

      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.IMAGE_EDIT,
        imageCount: 1,
        model: PRUNA_IMAGE_EDIT_MODEL,
        success: true,
        metadata: {
          s3Key: key,
          promptLength: fullPrompt.length,
          sourceImageUrl: imageUrl,
          provider: "pruna",
        },
      });

      logger.info(
        { businessId, s3Key: key },
        "Image edited with Pruna and uploaded successfully"
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
        model: PRUNA_IMAGE_EDIT_MODEL,
        success: false,
        errorMessage,
      });

      logger.error(
        {
          businessId,
          error: errorMessage,
          errorStack: error.stack,
        },
        "Error editing image with Pruna"
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

    if (category) {
      promptParts.push(`Business category: ${category}`);
    }
    if (subcategory) {
      promptParts.push(`Subcategory: ${subcategory}`);
    }
    if (tags && tags.length > 0) {
      promptParts.push(`Related to: ${tags.slice(0, 5).join(", ")}`);
    }

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

    if (eventType) {
      promptParts.push(`Event type: ${eventType}`);
    }

    if (targetAudience) {
      promptParts.push(`Target audience vibe: ${targetAudience}`);
    }
    if (tone) {
      promptParts.push(`Visual tone should be: ${tone}`);
    }

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
   * Generate multiple image variations for A/B testing
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

      return [{
        imageUrl: getPlaceholderImage(params.contentType),
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
          "Failed to generate image variation with Pruna"
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
