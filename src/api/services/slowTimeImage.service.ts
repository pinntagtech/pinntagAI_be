import mongoose from "mongoose";
import { logger } from "../../utils/logger.js";
import { AI_TrainingModel } from "../../models/AI_Training.model.js";
import { BusinessAIAssistantModel } from "../../models/businessAIAssistant.model.js";
import { ImageGenerationService } from "./imageGeneration.service.js";
import { UsageTrackingService } from "./usageTracking.service.js";
import { UsageType } from "../../models/aiUsage.model.js";
import { checkImageGenerationAccess } from "../../utils/subscription.utils.js";
import { chatCompletion } from "../../utils/llm.js";
import type { SlowTimeTemplate } from "./slowTimeRecommendation.service.js";

/**
 * Slow-Time Template Imagery
 *
 * Generates the artwork that rides along with a slow-time deal template.
 *
 * The hard requirement here is that the picture must not tell the customer
 * anything untrue. A promotional image is a claim: whatever it depicts, the
 * customer expects to find. So the prompt is built only from things the
 * business has actually told us (training answers + its own category), and
 * anything the image could get wrong on its own — prices, percentages,
 * signage, logos, award badges — is banned outright rather than guessed at.
 *
 * Three layers of protection, strongest first:
 *   1. Grounding    — subject matter comes from the business's own answers;
 *                     with no usable answers we fall back to abstract
 *                     imagery that depicts no product at all.
 *   2. Constraints  — no text/numerals, no logos or signage, no menus or
 *                     price tags, no claims the business hasn't made.
 *   3. Verification — a vision pass re-reads the finished image and rejects
 *                     it if text crept in or the subject drifted off-theme.
 *
 * If all attempts fail verification we return nothing. No image is a better
 * outcome than a misleading one.
 */

/** Reuse a generated image for this long before regenerating for the same occasion. */
const IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_GENERATION_ATTEMPTS = 2;

const VERIFICATION_ENABLED =
  (process.env.SLOW_TIME_IMAGE_VERIFICATION ?? "true").toLowerCase() !== "false";
const VERIFICATION_MODEL =
  process.env.SLOW_TIME_IMAGE_VERIFICATION_MODEL || "gpt-4o-mini";

export interface SlowTimeImageResult {
  imageUrl: string;
  /** True when the image came from cache rather than a fresh generation. */
  cached: boolean;
  occasion: string;
}

interface Grounding {
  /** "a Japanese sushi restaurant", "a hair salon" — what kind of place this is. */
  venue?: string;
  /** Concrete things the business told us it actually sells. */
  subjects: string[];
  beverageProgram?: string;
  /** Things this business must never be depicted serving/selling. */
  prohibited: string[];
  /** Low confidence → depict no product at all. */
  confidence: "high" | "low";
}

// ── Grounding ────────────────────────────────────────────────────────────────

const toParts = (value: any): string[] =>
  (Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,;]/)
      : []
  )
    .map((part) => String(part).trim())
    .filter(Boolean);

const dedupe = (parts: string[], limit = 6): string[] => {
  const seen = new Set<string>();
  return parts
    .filter((part) => {
      const key = part.toLowerCase();
      if (!part || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
};

/** Answers that describe a *thing the business sells*, in preference order. */
const SUBJECT_QUESTION_IDS = [
  "menu_highlights",
  "bestsellers",
  "bakery_specialties",
  "salon_specialties",
  "spa_types",
  "services_offered",
  "product_categories",
  // Legacy ids kept for businesses trained on the older questionnaire.
  "signature_products",
  "products_sold",
];

/**
 * Build the factual basis for the image from the business's own answers.
 * Nothing in here is inferred or invented — if an answer is missing, the
 * corresponding claim simply never enters the prompt.
 */
async function buildGrounding(businessId: string): Promise<Grounding> {
  const grounding: Grounding = {
    subjects: [],
    prohibited: [],
    confidence: "low",
  };

  let responseMap = new Map<string, any>();
  let category: string | undefined;
  let subCategory: string | undefined;

  try {
    const [training, assistant] = await Promise.all([
      AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      })
        .select("responses")
        .lean(),
      BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      })
        .select("category subCategories")
        .lean(),
    ]);

    const responses = (training?.responses ?? []) as Array<{
      questionId: string;
      answer: any;
    }>;
    responseMap = new Map(responses.map((r) => [r.questionId, r.answer]));
    category = assistant?.category?.trim() || undefined;
    subCategory = assistant?.subCategories?.[0]?.trim() || undefined;
  } catch (err: any) {
    logger.warn(
      { businessId, err: err?.message },
      "Could not load grounding data for slow-time image",
    );
    return grounding;
  }

  // ── What kind of place is this ────────────────────────────────────────────
  const cuisine = toParts(responseMap.get("cuisine_type")).join(" ");
  const diningStyle = toParts(responseMap.get("dining_style")).join(" ");
  const barType = toParts(responseMap.get("bar_type")).join(" ");

  if (cuisine) {
    grounding.venue = subCategory
      ? `a ${cuisine} ${subCategory.toLowerCase()}`
      : `a ${cuisine} restaurant`;
  } else if (barType) {
    grounding.venue = `a ${barType.toLowerCase()}`;
  } else if (subCategory) {
    grounding.venue = `a ${subCategory.toLowerCase()}`;
  } else if (category) {
    grounding.venue = `a ${category.toLowerCase()} business`;
  }
  if (grounding.venue && diningStyle) {
    grounding.venue = `${grounding.venue} (${diningStyle.toLowerCase()})`;
  }

  // ── What it actually sells ────────────────────────────────────────────────
  grounding.subjects = dedupe(
    SUBJECT_QUESTION_IDS.flatMap((id) => toParts(responseMap.get(id))),
  );

  // ── Beverages ─────────────────────────────────────────────────────────────
  const drinkProgram = responseMap.get("drink_program");
  if (
    typeof drinkProgram === "string" &&
    drinkProgram.trim() &&
    !/^no\b|none|not applicable/i.test(drinkProgram.trim())
  ) {
    grounding.beverageProgram = drinkProgram.trim();
  } else {
    // No drink programme → showing cocktails would advertise something the
    // business does not serve.
    grounding.prohibited.push(
      "cocktails, wine glasses, beer or any alcoholic drinks",
    );
  }

  // ── Dietary / faith constraints the business declared ─────────────────────
  const dietary = toParts(responseMap.get("dietary_options"))
    .join(" ")
    .toLowerCase();
  if (/halal/.test(dietary)) {
    grounding.prohibited.push("pork, bacon, ham and alcoholic drinks");
  }
  if (/kosher/.test(dietary)) {
    grounding.prohibited.push("pork, shellfish, and meat served with dairy");
  }

  // A venue anchor OR a concrete subject list is enough to depict something
  // real. With neither, we deliberately stay abstract.
  grounding.confidence =
    grounding.venue || grounding.subjects.length > 0 ? "high" : "low";

  return grounding;
}

// ── Prompt ───────────────────────────────────────────────────────────────────

const OCCASION_MOOD: Record<string, string> = {
  low_views: "warm, inviting, come-on-in mood",
  low_conversion: "appetising, easy-to-say-yes-to mood",
  lapsed_likers: "fresh, re-energised mood",
  lapsed_followers: "welcoming, we-missed-you mood",
  nearby_passersby: "bright, street-level, walk-in-now mood",
  midweek_dip: "relaxed mid-week treat mood",
  cold_window: "cosy, comforting mood",
  weekend_boost: "lively, weekend social mood",
  evergreen_slow_period: "calm, unhurried, quiet-hours mood",
};

/**
 * Compose the generation prompt. Ordering matters: the text-free rule leads
 * and closes the prompt because those positions carry the most weight with
 * image models, and rendered text is the single most common way one of these
 * images ends up saying something false.
 */
function buildPrompt(
  template: SlowTimeTemplate,
  grounding: Grounding,
  strict: boolean,
): string {
  const parts: string[] = [];

  parts.push(
    "IMPORTANT: produce a purely visual, text-free image. Absolutely NO text, NO letters, NO numbers, NO digits, NO percentage signs, NO currency symbols, NO words, NO captions, NO logos, NO signage, NO menus, NO price tags, NO typography of any kind",
  );

  const mood = OCCASION_MOOD[template.occasion] || "warm, inviting mood";

  if (grounding.confidence === "high") {
    parts.push(
      `Create a professional promotional photograph with a ${mood}${
        grounding.venue ? ` for ${grounding.venue}` : ""
      }`,
    );

    if (grounding.subjects.length > 0) {
      // Rotate the hero subject by occasion so repeat refreshes don't all
      // look identical, while staying inside the declared list.
      const index =
        Math.abs(hashString(template.occasion)) % grounding.subjects.length;
      parts.push(
        `Feature ${grounding.subjects[index]} as the hero of the composition`,
      );
      parts.push(
        `Only depict items from this list — ${grounding.subjects.join(
          ", ",
        )} — or neutral table/counter setting. Do NOT invent or add any other product`,
      );
    } else if (grounding.venue) {
      parts.push(
        `Show the general atmosphere of ${grounding.venue} — interior details, textures and lighting rather than specific products`,
      );
    }

    if (
      grounding.beverageProgram &&
      /happy hour|bar|cocktail|wine|beer|craft/i.test(
        `${template.title} ${grounding.beverageProgram}`,
      )
    ) {
      parts.push(
        `Drinks shown must be consistent with: ${grounding.beverageProgram}`,
      );
    }
  } else {
    // Nothing reliable to depict — abstract imagery makes no claim at all.
    parts.push(
      `Create an abstract, product-free promotional background with a ${mood} — soft gradients, warm light, simple geometric shapes and texture only`,
    );
    parts.push(
      "Do NOT depict any food, drink, product, service, storefront, interior or person",
    );
  }

  if (grounding.prohibited.length > 0) {
    parts.push(`Never depict ${grounding.prohibited.join("; ")}`);
  }

  // Claims the picture must not make on the business's behalf.
  parts.push(
    "Do not depict discount badges, sale stickers, star ratings, award seals, queues of customers, brand names or any real-world company's branding",
  );
  parts.push(
    "Photographic, natural lighting, shallow depth of field, clean composition suitable for a social media promotion",
  );

  if (strict) {
    parts.push(
      "The previous attempt was rejected for containing text or off-theme subject matter. Be extremely literal: an empty, clean, text-free scene is preferable to adding anything not explicitly listed above",
    );
  }

  parts.push(
    "FINAL REMINDER: zero text, zero letters, zero numerals, zero typography, zero symbols, in any language",
  );

  return parts.join(". ");
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// ── Verification ─────────────────────────────────────────────────────────────

interface VerificationVerdict {
  ok: boolean;
  reason?: string;
  /** True when the check could not run — caller decides how to treat it. */
  skipped?: boolean;
}

/**
 * Re-read the finished image with a vision model and reject anything that
 * would mislead: rendered text (which could state a discount we never
 * promised), subject matter the business doesn't offer, or fake branding.
 */
async function verifyImage(
  imageUrl: string,
  grounding: Grounding,
): Promise<VerificationVerdict> {
  if (!VERIFICATION_ENABLED) return { ok: true, skipped: true };

  const allowed =
    grounding.confidence === "high"
      ? [
          grounding.venue ? `the venue type: ${grounding.venue}` : null,
          grounding.subjects.length
            ? `these items: ${grounding.subjects.join(", ")}`
            : null,
          "generic table settings, tableware, interior textures and lighting",
        ]
          .filter(Boolean)
          .join("; ")
      : "abstract shapes, gradients, textures and light only — no products";

  try {
    const completion = await chatCompletion({
      model: VERIFICATION_MODEL,
      temperature: 0,
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You audit marketing images for factual accuracy. You are strict: when unsure, you reject. Reply with JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Audit this promotional image against the rules below.",
                `Allowed subject matter: ${allowed}.`,
                grounding.prohibited.length
                  ? `Must never appear: ${grounding.prohibited.join("; ")}.`
                  : "",
                "Rules: (a) the image must contain NO readable text, letters, numerals or symbols anywhere, including on packaging, signage or menus; (b) everything depicted must fall within the allowed subject matter; (c) no logos, brand marks, award badges, discount stickers or star ratings.",
                'Respond as {"hasText": bool, "offTheme": bool, "hasBranding": bool, "prohibitedContent": bool, "reason": string}.',
              ]
                .filter(Boolean)
                .join("\n"),
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ] as any,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) return { ok: true, skipped: true };

    const verdict = JSON.parse(raw) as {
      hasText?: boolean;
      offTheme?: boolean;
      hasBranding?: boolean;
      prohibitedContent?: boolean;
      reason?: string;
    };

    const failed =
      verdict.hasText ||
      verdict.offTheme ||
      verdict.hasBranding ||
      verdict.prohibitedContent;

    return failed
      ? {
          ok: false,
          reason:
            verdict.reason ||
            [
              verdict.hasText ? "text" : null,
              verdict.offTheme ? "off-theme subject" : null,
              verdict.hasBranding ? "branding" : null,
              verdict.prohibitedContent ? "prohibited content" : null,
            ]
              .filter(Boolean)
              .join(", "),
        }
      : { ok: true };
  } catch (err: any) {
    // A broken verifier must not block the pipeline — but say so loudly.
    logger.warn(
      { err: err?.message, model: VERIFICATION_MODEL },
      "Slow-time image verification unavailable — accepting image on prompt constraints alone",
    );
    return { ok: true, skipped: true };
  }
}

// ── Service ──────────────────────────────────────────────────────────────────

export class SlowTimeImageService {
  /**
   * Cached image for this business/occasion, without generating anything.
   * Used by read paths (training state, trigger preview) that must stay fast
   * and must not run up an image bill on every poll.
   */
  static async getCachedImage(
    businessId: string,
    occasion: string,
  ): Promise<string | undefined> {
    try {
      const assistant = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      })
        .select(
          "lastSlowTimeImageUrl lastSlowTimeImageOccasion lastSlowTimeImageAt",
        )
        .lean();

      if (!assistant?.lastSlowTimeImageUrl) return undefined;
      if (assistant.lastSlowTimeImageOccasion !== occasion) return undefined;
      if (!this.isFresh(assistant.lastSlowTimeImageAt)) return undefined;

      return assistant.lastSlowTimeImageUrl;
    } catch (err: any) {
      logger.warn(
        { businessId, err: err?.message },
        "Could not read cached slow-time image",
      );
      return undefined;
    }
  }

  /**
   * Image for the given template — cached when one is still current,
   * generated (and verified) otherwise.
   *
   * Returns undefined rather than a questionable image when generation is
   * unavailable or every attempt failed verification.
   */
  static async getOrCreateImage(
    businessId: string,
    template: SlowTimeTemplate,
    options: { force?: boolean } = {},
  ): Promise<SlowTimeImageResult | undefined> {
    if (!options.force) {
      const cached = await this.getCachedImage(businessId, template.occasion);
      if (cached) {
        return { imageUrl: cached, cached: true, occasion: template.occasion };
      }
    }

    // Image generation is a paid feature — respect the business's plan.
    try {
      const access = await checkImageGenerationAccess(businessId);
      if (!access.hasAccess) {
        logger.info(
          { businessId, reason: access.reason },
          "Skipping slow-time image — plan does not include image generation",
        );
        return undefined;
      }
    } catch (err: any) {
      logger.warn(
        { businessId, err: err?.message },
        "Could not verify image generation access for slow-time image",
      );
      return undefined;
    }

    const grounding = await buildGrounding(businessId);

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
      const prompt = buildPrompt(template, grounding, attempt > 1);

      try {
        const image = await ImageGenerationService.generateImage({
          businessId,
          prompt,
          contentType: (template.contentType as any) || "offer",
          style: "professional",
          aspectRatio: "1:1",
        });

        const verdict = await verifyImage(image.imageUrl, grounding);

        void UsageTrackingService.trackUsage({
          businessId,
          type: UsageType.IMAGE_GENERATION,
          subType: "slow_time_template",
          imageCount: 1,
          success: verdict.ok,
          metadata: {
            occasion: template.occasion,
            attempt,
            grounding: grounding.confidence,
            verification: verdict.skipped
              ? "unavailable"
              : verdict.ok
                ? "passed"
                : "rejected",
          },
        }).catch(() => undefined);

        if (!verdict.ok) {
          logger.warn(
            {
              businessId,
              occasion: template.occasion,
              attempt,
              reason: verdict.reason,
            },
            "Slow-time image rejected by accuracy check",
          );
          continue;
        }

        await this.cacheImage(businessId, template.occasion, image.imageUrl);

        logger.info(
          {
            businessId,
            occasion: template.occasion,
            attempt,
            grounding: grounding.confidence,
            verified: !verdict.skipped,
          },
          "Generated slow-time template image",
        );

        return {
          imageUrl: image.imageUrl,
          cached: false,
          occasion: template.occasion,
        };
      } catch (err: any) {
        logger.error(
          { businessId, occasion: template.occasion, attempt, err: err?.message },
          "Slow-time image generation failed",
        );
      }
    }

    logger.warn(
      { businessId, occasion: template.occasion },
      "No slow-time image produced — template will be published without artwork",
    );
    return undefined;
  }

  private static isFresh(generatedAt?: Date | null): boolean {
    if (!generatedAt) return false;
    return Date.now() - new Date(generatedAt).getTime() < IMAGE_TTL_MS;
  }

  private static async cacheImage(
    businessId: string,
    occasion: string,
    imageUrl: string,
  ): Promise<void> {
    try {
      await BusinessAIAssistantModel.updateOne(
        { businessId: new mongoose.Types.ObjectId(businessId) },
        {
          $set: {
            lastSlowTimeImageUrl: imageUrl,
            lastSlowTimeImageOccasion: occasion,
            lastSlowTimeImageAt: new Date(),
          },
        },
      );
    } catch (err: any) {
      logger.warn(
        { businessId, err: err?.message },
        "Could not cache slow-time image URL",
      );
    }
  }
}
