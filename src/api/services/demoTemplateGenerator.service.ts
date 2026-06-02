import { BusinessAIAssistantModel } from "../../models/businessAIAssistant.model.js";
import { logger } from "../../utils/logger.js";
import mongoose from "mongoose";
import {
  getDealTemplateModel,
  IDealTemplate,
  TemplateCreatorType,
  TemplateType,
  TemplateScope,
  DiscountType,
  upsertTemplate,
} from "../../models/pinntagBackend/dealTemplate.model.js";
import { llm } from "../../utils/llm.js";
import { GeminiService } from "./gemini.service.js";

/**
 * Category-based tag mappings for generating relevant tags
 * based on the business category/industry
 */
const CATEGORY_TAGS: Record<string, string[]> = {
  // Food & Drink
  bar: [
    "beer",
    "whiskey",
    "cocktails",
    "karaoke",
    "happy hour",
    "nightlife",
    "drinks",
    "pub",
    "live music",
    "shots",
  ],
  restaurant: [
    "dining",
    "food",
    "cuisine",
    "lunch",
    "dinner",
    "brunch",
    "takeout",
    "reservation",
    "chef",
    "menu",
  ],
  cafe: [
    "coffee",
    "latte",
    "espresso",
    "pastries",
    "breakfast",
    "tea",
    "brunch",
    "cozy",
    "wifi",
    "snacks",
  ],
  bakery: [
    "bread",
    "pastries",
    "cakes",
    "cookies",
    "fresh baked",
    "dessert",
    "donuts",
    "muffins",
    "artisan",
    "treats",
  ],
  pizza: [
    "pizza",
    "pepperoni",
    "delivery",
    "slices",
    "toppings",
    "cheesy",
    "Italian",
    "takeout",
    "crust",
    "oven",
  ],
  "fast food": [
    "burgers",
    "fries",
    "quick bites",
    "combo meals",
    "drive-thru",
    "takeout",
    "value meal",
    "snacks",
    "chicken",
    "shakes",
  ],
  "food truck": [
    "street food",
    "mobile eats",
    "tacos",
    "gourmet",
    "local flavors",
    "quick bites",
    "outdoor dining",
    "chef special",
    "fusion",
    "fresh",
  ],
  "ice cream": [
    "ice cream",
    "gelato",
    "sundae",
    "milkshake",
    "frozen treats",
    "scoops",
    "toppings",
    "waffle cone",
    "dessert",
    "summer",
  ],
  brewery: [
    "craft beer",
    "IPA",
    "lager",
    "ale",
    "taproom",
    "brewery tour",
    "hops",
    "pint",
    "growler",
    "tasting",
  ],
  winery: [
    "wine",
    "tasting",
    "vineyard",
    "cabernet",
    "chardonnay",
    "merlot",
    "sommelier",
    "cellar",
    "vintage",
    "pairing",
  ],

  // Health & Beauty
  salon: [
    "haircut",
    "styling",
    "color",
    "blowout",
    "treatment",
    "beauty",
    "makeover",
    "trim",
    "highlights",
    "spa",
  ],
  spa: [
    "relaxation",
    "massage",
    "facial",
    "wellness",
    "pampering",
    "skincare",
    "aromatherapy",
    "detox",
    "rejuvenation",
    "tranquil",
  ],
  "nail salon": [
    "manicure",
    "pedicure",
    "nail art",
    "gel nails",
    "polish",
    "acrylics",
    "nail care",
    "beauty",
    "pamper",
    "glam",
  ],
  barbershop: [
    "haircut",
    "shave",
    "beard trim",
    "grooming",
    "fade",
    "lineup",
    "hot towel",
    "classic cut",
    "men's grooming",
    "style",
  ],
  gym: [
    "fitness",
    "workout",
    "training",
    "strength",
    "cardio",
    "weights",
    "health",
    "exercise",
    "membership",
    "gains",
  ],
  yoga: [
    "yoga",
    "meditation",
    "mindfulness",
    "flexibility",
    "zen",
    "wellness",
    "stretch",
    "balance",
    "breathwork",
    "peace",
  ],
  dental: [
    "dental",
    "teeth",
    "whitening",
    "checkup",
    "smile",
    "oral health",
    "cleaning",
    "dentist",
    "braces",
    "hygiene",
  ],

  // Retail
  clothing: [
    "fashion",
    "style",
    "trending",
    "outfit",
    "wardrobe",
    "collection",
    "seasonal",
    "designer",
    "wear",
    "apparel",
  ],
  jewelry: [
    "jewelry",
    "diamonds",
    "gold",
    "silver",
    "rings",
    "necklace",
    "bracelet",
    "luxury",
    "gift",
    "sparkle",
  ],
  electronics: [
    "tech",
    "gadgets",
    "devices",
    "smart",
    "digital",
    "innovation",
    "accessories",
    "gaming",
    "audio",
    "deals",
  ],
  bookstore: [
    "books",
    "reading",
    "bestseller",
    "fiction",
    "nonfiction",
    "literature",
    "author",
    "novel",
    "library",
    "knowledge",
  ],
  "pet store": [
    "pets",
    "dogs",
    "cats",
    "pet food",
    "grooming",
    "toys",
    "treats",
    "pet care",
    "puppy",
    "furry friends",
  ],
  florist: [
    "flowers",
    "bouquets",
    "roses",
    "arrangements",
    "floral",
    "gift",
    "fresh flowers",
    "wedding",
    "occasion",
    "bloom",
  ],

  // Services
  "auto repair": [
    "car repair",
    "mechanic",
    "oil change",
    "brakes",
    "tires",
    "tune-up",
    "auto care",
    "maintenance",
    "engine",
    "service",
  ],
  "car wash": [
    "car wash",
    "detailing",
    "clean",
    "wax",
    "polish",
    "shine",
    "auto care",
    "interior",
    "exterior",
    "fresh",
  ],
  laundry: [
    "laundry",
    "dry cleaning",
    "wash",
    "fold",
    "pressing",
    "garment care",
    "stain removal",
    "fresh",
    "clean",
    "pickup",
  ],
  photography: [
    "photos",
    "portraits",
    "events",
    "wedding",
    "studio",
    "professional",
    "memories",
    "capture",
    "creative",
    "shots",
  ],
  "real estate": [
    "homes",
    "property",
    "listing",
    "buying",
    "selling",
    "rental",
    "investment",
    "open house",
    "mortgage",
    "moving",
  ],

  // Entertainment
  "movie theater": [
    "movies",
    "cinema",
    "popcorn",
    "premiere",
    "showtime",
    "film",
    "blockbuster",
    "tickets",
    "matinee",
    "screen",
  ],
  "bowling alley": [
    "bowling",
    "lanes",
    "strikes",
    "arcade",
    "fun",
    "group",
    "party",
    "family",
    "league",
    "games",
  ],
  "escape room": [
    "escape room",
    "puzzles",
    "adventure",
    "mystery",
    "team building",
    "clues",
    "challenge",
    "fun",
    "group",
    "brain teaser",
  ],
  "amusement park": [
    "rides",
    "fun",
    "family",
    "adventure",
    "thrills",
    "games",
    "attractions",
    "tickets",
    "summer",
    "entertainment",
  ],
};

/**
 * The 20 diverse occasion templates to generate
 */
const DEMO_OCCASIONS = [
  { occasion: "general", label: "Everyday Value" },
  { occasion: "general", label: "Welcome Offer" },
  { occasion: "general", label: "Loyalty Reward" },
  { occasion: "trending", label: "Trending Now" },
  { occasion: "trending", label: "Viral Special" },
  { occasion: "seasonal", label: "Seasonal Highlight" },
  { occasion: "seasonal", label: "Season's Best" },
  {
    occasion: "holiday",
    label: "Holiday Celebration",
    specificHoliday: "Holiday Season",
  },
  {
    occasion: "holiday",
    label: "Festive Special",
    specificHoliday: "Weekend Festivities",
  },
  { occasion: "slow_period", label: "Off-Peak Steal" },
  { occasion: "monday_motivation", label: "Monday Motivation" },
  { occasion: "tuesday_twofer", label: "Two-for-Tuesday" },
  { occasion: "wednesday_midweek", label: "Midweek Madness" },
  { occasion: "thursday_throwback", label: "Throwback Thursday" },
  { occasion: "friday_deals", label: "Friday Frenzy" },
  { occasion: "saturday_special", label: "Saturday Special" },
  { occasion: "sunday_selfcare", label: "Self-Care Sunday" },
  { occasion: "general", label: "Flash Deal" },
  { occasion: "general", label: "Member Exclusive" },
  { occasion: "trending", label: "Community Favorite" },
] as const;

type DemoOccasion = (typeof DEMO_OCCASIONS)[number]["occasion"];

interface DemoTemplate {
  title: string;
  discountType: DiscountType;
  contentType: string;
  percentOffValue?: number;
  dollarOffValue?: number;
  bogoOrFreeItem?: string;
  tags: string[];
  image: string;
  callToAction: string;
  termsAndConditions: string;
}

/**
 * Demo Template Generator Service
 *
 * Generates 20 showcase templates for a business with:
 * - AI-generated titles (no discount value in title)
 * - AI-generated images via Gemini
 * - Category-based tags
 * - Minimum 20% discount (bypasses agent training)
 * - Diverse occasions and discount types
 *
 * This is a separate service that does NOT modify existing template generation APIs.
 */
export class DemoTemplateGeneratorService {
  /**
   * Generate and save 20 demo templates for a business
   */
  static async generateDemoTemplates(
    businessId: string,
  ): Promise<IDealTemplate[]> {
    logger.info(
      { businessId },
      "Starting demo template generation (20 templates)",
    );

    // Get business agent info (no training required)
    const businessAgent = await BusinessAIAssistantModel.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!businessAgent) {
      throw new Error(`No AI agent found for business ID: ${businessId}`);
    }

    const category = (businessAgent.category || "").toLowerCase();
    const businessName = businessAgent.businessName;
    const subCategories = businessAgent.subCategories || [];
    const agentTags = businessAgent.tags || [];

    // Build tags from category
    const categoryTags = this.getTagsForCategory(
      category,
      subCategories,
      agentTags,
    );

    logger.info(
      { businessId, businessName, category, tagCount: categoryTags.length },
      "Business info loaded for demo generation",
    );

    // Generate all 20 templates
    const savedTemplates: IDealTemplate[] = [];
    const errors: string[] = [];

    for (let i = 0; i < DEMO_OCCASIONS.length; i++) {
      const occasionConfig = DEMO_OCCASIONS[i];
      try {
        logger.info(
          {
            businessId,
            index: i + 1,
            label: occasionConfig.label,
            occasion: occasionConfig.occasion,
          },
          `Generating demo template ${i + 1}/20`,
        );

        const template = await this.generateSingleDemoTemplate({
          businessId,
          businessName,
          category,
          categoryTags,
          occasion: occasionConfig.occasion,
          label: occasionConfig.label,
          specificHoliday:
            "specificHoliday" in occasionConfig
              ? occasionConfig.specificHoliday
              : undefined,
          index: i,
        });

        const saved = await this.saveDemoTemplate(
          template,
          businessAgent,
          businessId,
        );
        savedTemplates.push(saved);

        logger.info(
          {
            businessId,
            index: i + 1,
            templateId: saved._id,
            title: template.title,
          },
          `Demo template ${i + 1}/20 saved`,
        );
      } catch (error: any) {
        const msg = `Template ${i + 1} (${occasionConfig.label}): ${error.message}`;
        errors.push(msg);
        logger.error(
          { businessId, error: error.message, index: i + 1 },
          `Failed to generate demo template ${i + 1}/20`,
        );
      }
    }

    logger.info(
      {
        businessId,
        total: 20,
        succeeded: savedTemplates.length,
        failed: errors.length,
      },
      "Demo template generation complete",
    );

    if (savedTemplates.length === 0) {
      throw new Error(
        `All 20 demo templates failed to generate. Errors: ${errors.join("; ")}`,
      );
    }

    return savedTemplates;
  }

  /**
   * Generate a single demo template with AI content and image
   */
  private static async generateSingleDemoTemplate(params: {
    businessId: string;
    businessName: string;
    category: string;
    categoryTags: string[];
    occasion: string;
    label: string;
    specificHoliday?: string;
    index: number;
  }): Promise<DemoTemplate> {
    const {
      businessId,
      businessName,
      category,
      categoryTags,
      occasion,
      label,
      specificHoliday,
      index,
    } = params;

    // Determine discount type and value (min 20%)
    const {
      discountType,
      percentOffValue,
      dollarOffValue,
      bogoOrFreeItem,
      contentType,
    } = this.determineDiscount(occasion, index);

    // Generate AI title (without discount value in title)
    const title = await this.generateDemoTitle({
      businessName,
      category,
      occasion,
      label,
      specificHoliday,
      discountType,
    });

    // Generate AI image
    const imageUrl = await this.generateDemoImage({
      businessId,
      category,
      occasion,
      label,
      contentType,
      tags: categoryTags.slice(0, 5),
    });

    // Select relevant tags for this specific template
    const templateTags = this.selectTemplateTags(categoryTags, occasion, label);

    // Generate call to action
    const callToAction = this.generateCallToAction(discountType, occasion);

    return {
      title,
      discountType,
      contentType,
      percentOffValue,
      dollarOffValue,
      bogoOrFreeItem,
      tags: templateTags,
      image: imageUrl,
      callToAction,
      termsAndConditions:
        "Valid while supplies last. Cannot be combined with other offers. See store for details.",
    };
  }

  /**
   * Determine discount type and value based on occasion.
   * Enforces minimum 20% for percentage-based discounts.
   */
  private static determineDiscount(
    occasion: string,
    index: number,
  ): {
    discountType: DiscountType;
    contentType: string;
    percentOffValue?: number;
    dollarOffValue?: number;
    bogoOrFreeItem?: string;
  } {
    // Spread discount types across the 20 templates for variety
    const discountRotation: Array<{
      discountType: DiscountType;
      contentType: string;
      percentOffValue?: number;
      dollarOffValue?: number;
      bogoOrFreeItem?: string;
    }> = [
      // General occasions - percentage based (min 20%)
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 25,
      },
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 20,
      },
      {
        discountType: DiscountType.Flat,
        contentType: "reward",
        dollarOffValue: 10,
      },
      // Trending
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 30,
      },
      {
        discountType: DiscountType.BUNDLE,
        contentType: "offer",
        bogoOrFreeItem: "Special combo at exclusive price",
      },
      // Seasonal
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 25,
      },
      {
        discountType: DiscountType.HAPPY_HOUR,
        contentType: "offer",
        percentOffValue: 30,
      },
      // Holiday
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 35,
      },
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 25,
      },
      // Slow period
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 40,
      },
      // Day-specific
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 20,
      }, // Monday
      {
        discountType: DiscountType.BOGO,
        contentType: "offer",
        bogoOrFreeItem: "Buy one, get one free",
      }, // Tuesday
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 25,
      }, // Wednesday
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 20,
      }, // Thursday
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 30,
      }, // Friday
      {
        discountType: DiscountType.FAMILY_FUN,
        contentType: "event",
        percentOffValue: 25,
      }, // Saturday
      {
        discountType: DiscountType.FREE_ITEM,
        contentType: "offer",
        bogoOrFreeItem: "Free add-on with any purchase",
      }, // Sunday
      // Extra
      {
        discountType: DiscountType.Percentage,
        contentType: "offer",
        percentOffValue: 35,
      }, // Flash Deal
      {
        discountType: DiscountType.Flat,
        contentType: "reward",
        dollarOffValue: 15,
      }, // Member Exclusive
      {
        discountType: DiscountType.CUSTOM,
        contentType: "offer",
        percentOffValue: 20,
      }, // Community Favorite
    ];

    return discountRotation[index] || discountRotation[0];
  }

  /**
   * Generate an AI title that does NOT include discount values.
   * The title should be catchy and relevant to the occasion + category.
   */
  private static async generateDemoTitle(params: {
    businessName: string;
    category: string;
    occasion: string;
    label: string;
    specificHoliday?: string;
    discountType: DiscountType;
  }): Promise<string> {
    const {
      businessName,
      category,
      occasion,
      label,
      specificHoliday,
      discountType,
    } = params;

    try {
      const prompt = `Write a short promotional title for a ${category || "local"} business called "${businessName}".

Context:
- Occasion: ${label}${specificHoliday ? ` (${specificHoliday})` : ""}
- Deal type: ${discountType}

Rules:
- Maximum 50 characters
- Do NOT include any specific discount numbers, percentages, or dollar amounts in the title
- Do NOT use "20% Off", "$10 Off", "Save 30%" or any numeric discount references
- Make it catchy, occasion-appropriate, and relevant to a ${category || "local"} business
- Focus on the vibe, emotion, or benefit — not the numbers
- Examples of GOOD titles: "Treat Yourself Tuesday", "Weekend Vibes Await", "Your Monday Pick-Me-Up", "Fresh Flavors, Fresh Deals"
- Examples of BAD titles: "Save 25% This Monday", "$10 Off Your Order", "30% Weekend Special"

Respond with ONLY a JSON object:
{ "title": "..." }`;

      const response = await llm.chatCompletion({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a marketing copywriter. Respond only with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 80,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty response from OpenAI");

      const { title } = JSON.parse(content);
      if (!title) throw new Error("No title in response");

      // Safety check: strip any discount numbers that may have slipped through
      const sanitized = title
        .replace(/\d+%\s*(off|discount)?/gi, "")
        .replace(/\$\d+\s*(off|discount)?/gi, "")
        .trim();
      return sanitized || title;
    } catch (error: any) {
      logger.warn(
        { error: error.message, label: params.label },
        "AI title generation failed, using fallback",
      );
      return this.getFallbackTitle(occasion, label, category);
    }
  }

  /**
   * Fallback titles when AI generation fails
   */
  private static getFallbackTitle(
    occasion: string,
    label: string,
    category: string,
  ): string {
    const fallbacks: Record<string, string> = {
      monday_motivation: "Start Your Week Right",
      tuesday_twofer: "Double the Fun Tuesday",
      wednesday_midweek: "Midweek Treat Awaits",
      thursday_throwback: "Throwback Thursday Vibes",
      friday_deals: "Kickstart Your Weekend",
      saturday_special: "Saturday Fun for Everyone",
      sunday_selfcare: "Sunday Self-Care Session",
      holiday: "Celebrate the Season",
      seasonal: "Seasonal Favorites Are Here",
      slow_period: "Perfect Time to Visit",
      trending: "What Everyone's Talking About",
      general: "Something Special Awaits",
    };

    return fallbacks[occasion] || label;
  }

  /**
   * Generate an AI image for the template using Gemini
   */
  private static async generateDemoImage(params: {
    businessId: string;
    category: string;
    occasion: string;
    label: string;
    contentType: string;
    tags: string[];
  }): Promise<string> {
    const { businessId, category, occasion, label, contentType, tags } = params;

    try {
      const occasionContext: Record<string, string> = {
        monday_motivation: "energetic and motivational Monday morning",
        tuesday_twofer: "fun social sharing and togetherness",
        wednesday_midweek: "refreshing midweek break",
        thursday_throwback: "nostalgic and classic vibes",
        friday_deals: "exciting weekend kickoff celebration",
        saturday_special: "vibrant family-friendly weekend fun",
        sunday_selfcare: "calm, relaxing self-care and wellness",
        holiday: "festive holiday celebration",
        seasonal: "seasonal beauty and timeliness",
        slow_period: "cozy and inviting atmosphere",
        trending: "trendy, modern, and buzzworthy",
        general: "welcoming and professional",
      };

      const contextStr =
        occasionContext[occasion] || "professional and appealing";

      const prompt = `Create a visually stunning, high-quality marketing image for a ${category || "local"} business.
Theme: ${label} - ${contextStr}.
Related to: ${tags.join(", ")}.
Style: Modern, clean, eye-catching. No text or words in the image.
The image should feel inviting and professional, suitable for a promotional campaign.
Do NOT include any text, numbers, percentages, or discount values in the image.`;

      const result = await GeminiService.generateContentImage({
        businessId,
        contentType: contentType as any,
        title: label,
        description: `${category} business - ${contextStr}`,
        style: "vibrant",
        aspectRatio: "1:1",
        category,
        tags,
        tone: contextStr,
      });

      return result.imageUrl;
    } catch (error: any) {
      logger.warn(
        { businessId, error: error.message, label },
        "Demo image generation failed, using placeholder",
      );
      return "https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Special_Offer.jpg";
    }
  }

  /**
   * Get tags for a business category
   */
  private static getTagsForCategory(
    category: string,
    subCategories: string[],
    agentTags: string[],
  ): string[] {
    const tags = new Set<string>();

    // Look up category tags (try exact match, then partial match)
    const categoryLower = category.toLowerCase();
    const directTags = CATEGORY_TAGS[categoryLower];

    if (directTags) {
      directTags.forEach((t) => tags.add(t));
    } else {
      // Try partial match
      for (const [key, keyTags] of Object.entries(CATEGORY_TAGS)) {
        if (categoryLower.includes(key) || key.includes(categoryLower)) {
          keyTags.forEach((t) => tags.add(t));
          break;
        }
      }
    }

    // Add subcategory names as tags
    subCategories.forEach((sub) => {
      tags.add(sub.toLowerCase());
    });

    // Add existing agent tags
    agentTags.forEach((t) => {
      tags.add(t.toLowerCase());
    });

    // If still no tags, add the category name itself + generic searchable terms
    if (tags.size === 0) {
      if (category) tags.add(category);
      [
        "near me",
        "local",
        "open now",
        "best deals",
        "top rated",
        "popular",
        "recommended",
        "nearby",
      ].forEach((t) => tags.add(t));
    }

    return Array.from(tags).slice(0, 15);
  }

  /**
   * Select relevant tags for a specific template occasion.
   * Tags are searchable nouns/items (e.g. "burger", "beer", "haircut")
   * — NOT abstract concepts like "motivation" or "energize".
   */
  private static selectTemplateTags(
    categoryTags: string[],
    _occasion: string,
    _label: string,
  ): string[] {
    const tags = new Set<string>();

    // Rotate through category tags so each template gets a slightly different set
    // but all tags remain concrete, searchable items from the category
    const startIdx = Math.floor(
      Math.random() * Math.max(1, categoryTags.length - 6),
    );
    categoryTags.slice(startIdx, startIdx + 6).forEach((t) => tags.add(t));

    // Always include the first few core category tags for consistency
    categoryTags.slice(0, 4).forEach((t) => tags.add(t));

    return Array.from(tags).slice(0, 10);
  }

  /**
   * Generate a call to action based on discount type and occasion
   */
  private static generateCallToAction(
    discountType: DiscountType,
    occasion: string,
  ): string {
    const ctas: Record<string, string[]> = {
      [DiscountType.Percentage]: [
        "Claim Your Deal",
        "Grab This Offer",
        "Shop Now & Save",
      ],
      [DiscountType.Flat]: ["Redeem Now", "Get Your Discount", "Save Today"],
      [DiscountType.BOGO]: [
        "Bring a Friend",
        "Share the Deal",
        "Buy One, Get One",
      ],
      [DiscountType.FREE_ITEM]: [
        "Treat Yourself",
        "Claim Your Freebie",
        "Get Yours Free",
      ],
      [DiscountType.BUNDLE]: [
        "Get the Bundle",
        "Grab the Combo",
        "Bundle & Save",
      ],
      [DiscountType.HAPPY_HOUR]: [
        "Join Happy Hour",
        "Cheers to Savings",
        "Don't Miss Out",
      ],
      [DiscountType.FAMILY_FUN]: [
        "Bring the Family",
        "Fun for All Ages",
        "Plan Your Visit",
      ],
      [DiscountType.CUSTOM]: [
        "Check It Out",
        "Learn More",
        "Discover the Deal",
      ],
    };

    const options = ctas[discountType] || ctas[DiscountType.Percentage];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Save a demo template to the database
   */
  private static async saveDemoTemplate(
    template: DemoTemplate,
    businessAgent: any,
    businessId: string,
  ): Promise<IDealTemplate> {
    const toObjectId = (value: any): mongoose.Types.ObjectId => {
      if (value instanceof mongoose.Types.ObjectId) return value;
      return new mongoose.Types.ObjectId(value);
    };

    // Build discount value string
    let discountValue: string | undefined;
    if (template.percentOffValue) {
      discountValue = `${template.percentOffValue}%`;
    } else if (template.dollarOffValue) {
      discountValue = `$${template.dollarOffValue}`;
    } else if (template.bogoOrFreeItem) {
      discountValue = template.bogoOrFreeItem;
    }

    const keywords = template.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const promotionCode = `DEMO${template.title
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 6)
      .toUpperCase()}`;

    const dbTemplate: Partial<IDealTemplate> = {
      creatorType: TemplateCreatorType.SYSTEM,
      type: TemplateType.OFFER,
      scope: TemplateScope.BUSINESS_SPECIFIC,
      businessId: toObjectId(businessId) as any,
      businessProfile: toObjectId(businessId) as any,
      discountValue,
      discountType: template.discountType,
      contentType: template.contentType,
      percentOffValue: template.percentOffValue,
      dollarOffValue: template.dollarOffValue,
      bogoOrFreeItem: template.bogoOrFreeItem,
      categories: [],
      title: template.title,
      keywords: Array.from(new Set(keywords)).slice(0, 8),
      minTargetAge: 18,
      maxTargetAge: 65,
      targetGenders: ["male", "female", "others"],
      promotionCode,
      isFree: false,
      termsApplied: true,
      termsAndConditions: template.termsAndConditions,
      thumbnail: template.image,
      tags: template.tags,
      generatedByAI: true,
      aiGenerationData: {
        callToAction: template.callToAction,
        promotionalGoal: "demo_showcase",
      },
      isActive: true,
      lastUpdated: new Date(),
    };

    const nextUpdate = new Date();
    nextUpdate.setHours(nextUpdate.getHours() + 168); // 7 days for demo templates

    const saved = await upsertTemplate(
      {
        title: dbTemplate.title,
        businessId: dbTemplate.businessId as any,
        scope: TemplateScope.BUSINESS_SPECIFIC,
      },
      { ...dbTemplate, nextScheduledUpdate: nextUpdate },
    );

    return saved;
  }
}
