import { GeminiService } from "./gemini.service.js";
import { PrunaService } from "./pruna.service.js";
import { logger } from "../../utils/logger.js";
import {
  ImageGenerationParams,
  ImageEditParams,
  ContentImageParams,
  GeneratedImage,
  ImageStyle,
} from "../../utils/types/aiAssist.types.js";

// ===========================
// Image Generation Provider Facade
// ===========================

/**
 * Supported image generation providers.
 * - "pruna"  → Pruna P-Image (cost-efficient)
 * - "gemini" → Google Gemini 2.5 Flash Image
 */
type ImageProvider = "pruna" | "gemini";

const IMAGE_PROVIDER: ImageProvider =
  (process.env.IMAGE_GENERATION_PROVIDER as ImageProvider) || "pruna";

logger.info({ provider: IMAGE_PROVIDER }, "Image generation provider configured");

/**
 * Facade that delegates to the configured image generation provider.
 * All methods mirror the GeminiService / PrunaService interface so
 * callers don't need to know which backend is active.
 */
export class ImageGenerationService {
  private static get provider() {
    return IMAGE_PROVIDER === "pruna" ? PrunaService : GeminiService;
  }

  static async generateImage(
    params: ImageGenerationParams
  ): Promise<GeneratedImage> {
    return this.provider.generateImage(params);
  }

  static async editImage(params: ImageEditParams): Promise<GeneratedImage> {
    return this.provider.editImage(params);
  }

  static async generateContentImage(
    params: ContentImageParams
  ): Promise<GeneratedImage> {
    return this.provider.generateContentImage(params);
  }

  static async generateImageVariations(
    params: ImageGenerationParams,
    count: number = 3
  ): Promise<GeneratedImage[]> {
    return this.provider.generateImageVariations(params, count);
  }

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
    return this.provider.generateTextImage(params);
  }
}
