import mongoose from "mongoose";
import {
  AI_TrainingModel,
  ITrainingResponse,
} from "../../models/AI_Training.model.js";
import { BusinessAIAssistantModel } from "../../models/businessAIAssistant.model.js";
import { logger } from "../../utils/logger.js";
import {
  BusinessIndustries,
  BusinessSubCategory,
  TrainingPhase,
  AI_Training_Questionnaire_Type,
  getAI_Training_Questionnaire_Types,
  getRequiredQuestions,
  validateTrainingData,
  getQuestionsWithSmartDefaults,
  getSmartDefaults,
  getQuestionsByPhase as getQuestionsByPhaseUtil,
  getPhaseSummary,
} from "../../utils/AI_Training_questionnaire.js";
import { response } from "express";
import { openai } from "../../utils/openai.js";

// ===========================
// Helper Functions
// ===========================

/**
 * Maps old category values to new BusinessIndustries enum values
 * This handles migration from old category names to new standardized names
 */
function mapCategoryToIndustry(category: string): BusinessIndustries {
  const categoryMapping: Record<string, BusinessIndustries> = {
    // Direct matches (new categories)
    "Entertainment": BusinessIndustries.ENTERTAINMENT,
    "Classes and Workshops": BusinessIndustries.CLASSES_WORKSHOPS,
    "Classes & Workshops": BusinessIndustries.CLASSES_WORKSHOPS,
    "Food & Drink": BusinessIndustries.FOOD_DRINK,
    "Sports & Outdoor": BusinessIndustries.SPORTS_OUTDOOR,
    "Local Attractions": BusinessIndustries.LOCAL_ATTRACTIONS,
    "Retail & Shopping": BusinessIndustries.RETAIL_SHOPPING,
    "Health & Wellness": BusinessIndustries.HEALTH_WELLNESS,
    "Home & Professional Services": BusinessIndustries.HOME_PROFESSIONAL_SERVICES,
    "Places to Stay": BusinessIndustries.PLACES_TO_STAY,
    "Mobile Businesses": BusinessIndustries.MOBILE_BUSINESSES,

    // Old category mappings
    "Beauty & Wellness": BusinessIndustries.HEALTH_WELLNESS,
    "Fitness & Wellness": BusinessIndustries.HEALTH_WELLNESS,
    "Health & Beauty": BusinessIndustries.HEALTH_WELLNESS,
    "Retail": BusinessIndustries.RETAIL_SHOPPING,
    "Shopping": BusinessIndustries.RETAIL_SHOPPING,
    "Food": BusinessIndustries.FOOD_DRINK,
    "Restaurants": BusinessIndustries.FOOD_DRINK,
    "Sports": BusinessIndustries.SPORTS_OUTDOOR,
    "Outdoor Activities": BusinessIndustries.SPORTS_OUTDOOR,
    "Attractions": BusinessIndustries.LOCAL_ATTRACTIONS,
    "Tourism": BusinessIndustries.LOCAL_ATTRACTIONS,
    "Hotels": BusinessIndustries.PLACES_TO_STAY,
    "Accommodation": BusinessIndustries.PLACES_TO_STAY,
    "Lodging": BusinessIndustries.PLACES_TO_STAY,
    "Professional Services": BusinessIndustries.HOME_PROFESSIONAL_SERVICES,
    "Home Services": BusinessIndustries.HOME_PROFESSIONAL_SERVICES,
    "Education": BusinessIndustries.CLASSES_WORKSHOPS,
    "Classes": BusinessIndustries.CLASSES_WORKSHOPS,
    "Workshops": BusinessIndustries.CLASSES_WORKSHOPS,
  };

  const mappedIndustry = categoryMapping[category];

  if (mappedIndustry) {
    return mappedIndustry;
  }

  // Log warning for unmapped categories and default to a sensible fallback
  logger.warn(
    { category },
    "Unknown category encountered, defaulting to ENTERTAINMENT"
  );
  return BusinessIndustries.ENTERTAINMENT;
}

/**
 * Generates enhanced AI instructions based on training responses
 */
function generateEnhancedInstructions(
  businessName: string,
  industry: string,
  responses: ITrainingResponse[],
  baseInstructions: string,
): string {
  const responseMap = new Map(responses.map((r) => [r.questionId, r.answer]));

  // Extract key training data
  const targetAudience = responseMap.get("target_audience") || [];
  const marketingGoals = responseMap.get("marketing_goals") || [];
  const brandVoice = responseMap.get("brand_voice") || [];
  const busiestDays = responseMap.get("busiest_days") || [];
  const busiestHours = responseMap.get("busiest_hours") || [];
  const slowPeriods = responseMap.get("slow_periods") || [];
  const discountRange = responseMap.get("typical_discount_range") || "";
  const seasonalRelevance = responseMap.get("seasonal_relevance") || false;
  const importantSeasons = responseMap.get("important_seasons") || [];
  const previousSuccessfulPromotions =
    responseMap.get("previous_successful_promotions") || "";
  const operatingHours = responseMap.get("operating_hours") || "";
  const businessDescription = responseMap.get("business_description") || "";

  const enhancedInstructions = `
${baseInstructions}

# Business Training Data

## Business Overview
- Business Name: ${businessName}
- Industry: ${industry}
- Description: ${businessDescription}
- Operating Hours: ${operatingHours}

## Target Audience & Customer Profile
${
  Array.isArray(targetAudience) && targetAudience.length > 0
    ? `- Primary Target Audience: ${(targetAudience as string[]).join(", ")}`
    : ""
}
- Customer Income Level: ${
    responseMap.get("customer_income_level") || "Not specified"
  }

## Brand Voice & Communication
${
  Array.isArray(brandVoice) && brandVoice.length > 0
    ? `Use a ${(brandVoice as string[]).join(
        ", ",
      )} tone in all communications and recommendations.`
    : ""
}

## Business Operations Insights
${
  Array.isArray(busiestDays) && busiestDays.length > 0
    ? `- Busiest Days: ${(busiestDays as string[]).join(", ")}`
    : ""
}
${
  Array.isArray(busiestHours) && busiestHours.length > 0
    ? `- Peak Hours: ${(busiestHours as string[]).join(", ")}`
    : ""
}
${
  Array.isArray(slowPeriods) && slowPeriods.length > 0
    ? `- Slow Periods: ${(slowPeriods as string[]).join(", ")}`
    : ""
}

## Marketing Strategy
${
  Array.isArray(marketingGoals) && marketingGoals.length > 0
    ? `- Primary Marketing Goals: ${(marketingGoals as string[]).join(", ")}`
    : ""
}
- Typical Discount Range: ${discountRange}
${
  previousSuccessfulPromotions
    ? `- Past Successful Promotions: ${previousSuccessfulPromotions}`
    : ""
}

## Seasonal Information
- Seasonal Business: ${seasonalRelevance ? "Yes" : "No"}
${
  Array.isArray(importantSeasons) && importantSeasons.length > 0
    ? `- Key Seasons/Holidays: ${(importantSeasons as string[]).join(", ")}`
    : ""
}

# Your Role as AI Marketing Assistant

You are the AI marketing assistant for ${businessName}. Your primary responsibilities are:

1. **Deal & Offer Recommendations**
   - Suggest optimal timing for deals based on slow periods and seasonal trends
   - Recommend discount amounts within the comfortable range: ${discountRange}
   - Create compelling deal descriptions that match the brand voice
   - Consider customer demographics and income level when suggesting offers

2. **Content & Post Suggestions**
   ${
     Array.isArray(importantSeasons) && importantSeasons.length > 0
       ? `- Proactively suggest posts for upcoming holidays/seasons: ${(
           importantSeasons as string[]
         ).join(", ")}`
       : ""
   }
   - Recommend posting times based on peak engagement hours
   - Create templates for deals/offers that resonate with target audience
   - Reference pop culture and trending topics relevant to the business

3. **Customer Engagement Strategy**
   ${
     Array.isArray(marketingGoals) && marketingGoals.length > 0
       ? `- Focus on goals: ${(marketingGoals as string[]).join(", ")}`
       : ""
   }
   ${
     Array.isArray(slowPeriods) && slowPeriods.length > 0
       ? `- Prioritize strategies to boost traffic during: ${(
           slowPeriods as string[]
         ).join(", ")}`
       : ""
   }
   - Suggest loyalty programs and retention strategies
   - Recommend social media engagement tactics

4. **Business Growth Insights**
   - Analyze trends and provide actionable insights
   - Suggest ways to maximize profitability
   - Help optimize pricing and promotional strategies
   ${
     previousSuccessfulPromotions
       ? `- Build on what worked before: ${previousSuccessfulPromotions}`
       : ""
   }

# Guidelines for Responses

- Always tailor recommendations to the specific business context
- Be proactive: suggest deals/offers even when not explicitly asked
- Provide specific, actionable advice rather than generic suggestions
- Consider both immediate wins and long-term strategy
- Use data-driven reasoning based on the training information provided
- Stay positive and encouraging while being realistic about market conditions
- Reference the business's unique value proposition in recommendations

# Deal/Offer Template Creation

When creating deal templates, consider:
- Target audience preferences and demographics
- Seasonal relevance and current trends
- Appropriate discount levels (${discountRange})
- Brand voice consistency
- Call-to-action that drives engagement
- Timing optimization for maximum impact

Remember: Your goal is to increase customer engagement and improve profitability for ${businessName}.
`;

  return enhancedInstructions;
}

/**
 * Generates enhanced AI instructions with Google Places data
 */
function generateEnhancedInstructionsWithGooglePlaces(
  businessName: string,
  industry: string,
  responses: ITrainingResponse[],
  baseInstructions: string,
  googlePlacesData: any,
): string {
  const responseMap = new Map(responses.map((r) => [r.questionId, r.answer]));

  // Extract key training data
  const targetAudience = responseMap.get("target_audience") || [];
  const marketingGoals = responseMap.get("marketing_goals") || [];
  const brandVoice = responseMap.get("brand_voice") || [];
  const busiestDays = responseMap.get("busiest_days") || [];
  const busiestHours = responseMap.get("busiest_hours") || [];
  const slowPeriods = responseMap.get("slow_periods") || [];
  const discountRange = responseMap.get("typical_discount_range") || "";
  const seasonalRelevance = responseMap.get("seasonal_relevance") || false;
  const importantSeasons = responseMap.get("important_seasons") || [];
  const previousSuccessfulPromotions =
    responseMap.get("previous_successful_promotions") || "";
  const businessDescription = responseMap.get("business_description") || "";

  // Format operating hours from Google Places
  const operatingHours = googlePlacesData?.regularOpeningHours
    ?.weekdayDescriptions
    ? googlePlacesData.regularOpeningHours.weekdayDescriptions.join("\n  ")
    : "Not available";

  // Format business location
  const location = googlePlacesData?.formattedAddress || "Not available";
  const googleMapsLink = googlePlacesData?.googleMapsUri || "";

  // Format rating information
  const rating = googlePlacesData?.rating
    ? `${googlePlacesData.rating}/5 (${googlePlacesData.userRatingCount || 0} reviews)`
    : "No rating available";

  // Format business types
  const businessTypes = googlePlacesData?.types
    ? googlePlacesData.types.slice(0, 5).join(", ")
    : "";

  const enhancedInstructions = `
${baseInstructions}

# Business Training Data

## Business Overview
- Business Name: ${businessName}
- Industry: ${industry}
- Description: ${businessDescription}
- Location: ${location}
${googleMapsLink ? `- Google Maps: ${googleMapsLink}` : ""}
- Customer Rating: ${rating}
${businessTypes ? `- Business Categories: ${businessTypes}` : ""}
${googlePlacesData?.websiteUri ? `- Website: ${googlePlacesData.websiteUri}` : ""}
${
  googlePlacesData?.nationalPhoneNumber
    ? `- Phone: ${googlePlacesData.nationalPhoneNumber}`
    : ""
}

## Operating Hours
${operatingHours}
${
  googlePlacesData?.regularOpeningHours?.openNow !== undefined
    ? `Currently: ${googlePlacesData.regularOpeningHours.openNow ? "OPEN" : "CLOSED"}`
    : ""
}

## Target Audience & Customer Profile
${
  Array.isArray(targetAudience) && targetAudience.length > 0
    ? `- Primary Target Audience: ${(targetAudience as string[]).join(", ")}`
    : ""
}
- Customer Income Level: ${
    responseMap.get("customer_income_level") || "Not specified"
  }

## Brand Voice & Communication
${
  Array.isArray(brandVoice) && brandVoice.length > 0
    ? `Use a ${(brandVoice as string[]).join(
        ", ",
      )} tone in all communications and recommendations.`
    : ""
}

## Business Operations Insights
${
  Array.isArray(busiestDays) && busiestDays.length > 0
    ? `- Busiest Days: ${(busiestDays as string[]).join(", ")}`
    : ""
}
${
  Array.isArray(busiestHours) && busiestHours.length > 0
    ? `- Peak Hours: ${(busiestHours as string[]).join(", ")}`
    : ""
}
${
  Array.isArray(slowPeriods) && slowPeriods.length > 0
    ? `- Slow Periods: ${(slowPeriods as string[]).join(", ")}`
    : ""
}

## Marketing Strategy
${
  Array.isArray(marketingGoals) && marketingGoals.length > 0
    ? `- Primary Marketing Goals: ${(marketingGoals as string[]).join(", ")}`
    : ""
}
- Typical Discount Range: ${discountRange}
${
  previousSuccessfulPromotions
    ? `- Past Successful Promotions: ${previousSuccessfulPromotions}`
    : ""
}

## Seasonal Information
- Seasonal Business: ${seasonalRelevance ? "Yes" : "No"}
${
  Array.isArray(importantSeasons) && importantSeasons.length > 0
    ? `- Key Seasons/Holidays: ${(importantSeasons as string[]).join(", ")}`
    : ""
}

# Your Role as AI Marketing Assistant

You are the AI marketing assistant for ${businessName}. Your primary responsibilities are:

1. **Deal & Offer Recommendations**
   - Suggest optimal timing for deals based on operating hours, slow periods, and seasonal trends
   - Recommend discount amounts within the comfortable range: ${discountRange}
   - Create compelling deal descriptions that match the brand voice
   - Consider customer demographics and income level when suggesting offers
   - Reference the business's operating hours when suggesting time-sensitive deals

2. **Content & Post Suggestions**
   ${
     Array.isArray(importantSeasons) && importantSeasons.length > 0
       ? `- Proactively suggest posts for upcoming holidays/seasons: ${(
           importantSeasons as string[]
         ).join(", ")}`
       : ""
   }
   - Recommend posting times based on peak engagement hours and operating hours
   - Create templates for deals/offers that resonate with target audience
   - Reference pop culture and trending topics relevant to the business
   - Leverage the business's location and customer reviews in content

3. **Customer Engagement Strategy**
   ${
     Array.isArray(marketingGoals) && marketingGoals.length > 0
       ? `- Focus on goals: ${(marketingGoals as string[]).join(", ")}`
       : ""
   }
   ${
     Array.isArray(slowPeriods) && slowPeriods.length > 0
       ? `- Prioritize strategies to boost traffic during: ${(
           slowPeriods as string[]
         ).join(", ")}`
       : ""
   }
   - Suggest loyalty programs and retention strategies
   - Recommend social media engagement tactics
   - Use the business's rating and reviews as social proof in marketing

4. **Business Growth Insights**
   - Analyze trends and provide actionable insights
   - Suggest ways to maximize profitability
   - Help optimize pricing and promotional strategies
   ${
     previousSuccessfulPromotions
       ? `- Build on what worked before: ${previousSuccessfulPromotions}`
       : ""
   }
   - Consider the business's location and accessibility when making recommendations

# Guidelines for Responses

- Always tailor recommendations to the specific business context
- Be proactive: suggest deals/offers even when not explicitly asked
- Provide specific, actionable advice rather than generic suggestions
- Consider both immediate wins and long-term strategy
- Use data-driven reasoning based on the training information provided
- Stay positive and encouraging while being realistic about market conditions
- Reference the business's unique value proposition in recommendations
- Leverage operating hours, location, and customer rating data in your suggestions

# Deal/Offer Template Creation

When creating deal templates, consider:
- Target audience preferences and demographics
- Seasonal relevance and current trends
- Appropriate discount levels (${discountRange})
- Brand voice consistency
- Call-to-action that drives engagement
- Timing optimization for maximum impact based on operating hours
- Location-based marketing opportunities
- Customer reviews and rating as trust indicators

Remember: Your goal is to increase customer engagement and improve profitability for ${businessName}. Use the verified Google Places data to provide accurate, location-aware recommendations.
`;

  return enhancedInstructions;
}

/**
 * Generates industry-specific recommendations for the AI assistant
 */
function generateIndustryInsights(
  industry: BusinessIndustries,
  responses: ITrainingResponse[],
): string {
  const responseMap = new Map(responses.map((r) => [r.questionId, r.answer]));
  let insights = "\n## Industry-Specific Insights\n";

  switch (industry) {
    case BusinessIndustries.ENTERTAINMENT:
      insights += `
- Typical booking lead time: ${
        responseMap.get("booking_lead_time") || "not specified"
      }
- Group sizes: ${responseMap.get("group_sizes") || "not specified"}
- Event types: ${responseMap.get("event_types") || "not specified"}
- Capacity utilization: ${
        responseMap.get("utilization_rate") || "not specified"
      }
- Venue atmosphere: ${responseMap.get("venue_atmosphere") || "not specified"}
${
  responseMap.get("last_minute_bookings")
    ? "- Can promote last-minute deals to fill slots"
    : ""
}
${
  responseMap.get("recurring_events")
    ? "- Highlight recurring events and regular programming"
    : ""
}
`;
      break;

    case BusinessIndustries.CLASSES_WORKSHOPS:
      insights += `
- Class formats offered: ${responseMap.get("class_formats") || "not specified"}
- Skill levels catered: ${responseMap.get("skill_levels") || "not specified"}
- Class duration: ${responseMap.get("class_duration") || "not specified"}
- Instructor credentials: ${responseMap.get("instructor_credentials") || "not specified"}
${
  responseMap.get("trial_classes")
    ? "- Emphasize trial classes for new student acquisition"
    : ""
}
${
  responseMap.get("package_deals")
    ? "- Highlight class packages and membership benefits"
    : ""
}
`;
      break;

    case BusinessIndustries.FOOD_DRINK:
      insights += `
- Consider meal period promotions (${
        responseMap.get("meal_periods") || "not specified"
      })
- Highlight dietary options: ${
        responseMap.get("dietary_options") || "not specified"
      }
- Promote signature items: ${
        responseMap.get("menu_highlights") || "not specified"
      }
- Average check size: ${
        responseMap.get("average_check_size") || "not specified"
      }
- Cuisine type: ${responseMap.get("cuisine_type") || "not specified"}
${
  responseMap.get("happy_hour_interest")
    ? "- Emphasize happy hour and off-peak specials"
    : ""
}
${
  responseMap.get("delivery_options")
    ? "- Promote delivery and takeout options"
    : ""
}
`;
      break;

    case BusinessIndustries.SPORTS_OUTDOOR:
      insights += `
- Activity types: ${responseMap.get("activity_types") || "not specified"}
- Experience levels: ${responseMap.get("experience_levels") || "not specified"}
- Equipment provided: ${responseMap.get("equipment_provided") || "not specified"}
- Seasonal availability: ${responseMap.get("seasonal_availability") || "not specified"}
- Group vs individual: ${responseMap.get("group_individual") || "not specified"}
${
  responseMap.get("weather_dependent")
    ? "- Weather-dependent activities - monitor conditions for promotions"
    : ""
}
${
  responseMap.get("beginner_friendly")
    ? "- Emphasize beginner-friendly options and lessons"
    : ""
}
`;
      break;

    case BusinessIndustries.LOCAL_ATTRACTIONS:
      insights += `
- Attraction type: ${responseMap.get("attraction_type") || "not specified"}
- Visit duration: ${responseMap.get("visit_duration") || "not specified"}
- Best time to visit: ${responseMap.get("best_visit_time") || "not specified"}
- Age appropriateness: ${responseMap.get("age_appropriate") || "not specified"}
- Guided tours available: ${responseMap.get("guided_tours") || "not specified"}
${
  responseMap.get("group_discounts")
    ? "- Promote group discounts and family packages"
    : ""
}
${
  responseMap.get("seasonal_events")
    ? "- Highlight seasonal events and special exhibitions"
    : ""
}
`;
      break;

    case BusinessIndustries.RETAIL_SHOPPING:
      insights += `
- Product categories: ${
        responseMap.get("product_categories") || "not specified"
      }
- Price range: ${responseMap.get("price_range") || "not specified"}
- Inventory turnover: ${
        responseMap.get("inventory_turnover") || "not specified"
      }
- Shopping experience: ${responseMap.get("shopping_experience") || "not specified"}
${
  responseMap.get("loyalty_program")
    ? "- Leverage loyalty program in promotions"
    : ""
}
${
  responseMap.get("seasonal_products")
    ? "- Focus on seasonal product promotions"
    : ""
}
${
  responseMap.get("online_shopping")
    ? "- Promote online shopping and local pickup options"
    : ""
}
`;
      break;

    case BusinessIndustries.HEALTH_WELLNESS:
      insights += `
- Services offered: ${responseMap.get("services_offered") || "not specified"}
- Typical service duration: ${
        responseMap.get("service_duration") || "not specified"
      }
- Booking fill rate: ${
        responseMap.get("appointment_fill_rate") || "not specified"
      }
- Specializations: ${responseMap.get("specializations") || "not specified"}
- Membership structure: ${responseMap.get("membership_structure") || "not specified"}
${
  responseMap.get("first_time_specials")
    ? "- Promote first-time client specials aggressively"
    : ""
}
${
  responseMap.get("membership_packages")
    ? "- Highlight membership and package benefits"
    : ""
}
${
  responseMap.get("wellness_programs")
    ? "- Emphasize wellness programs and holistic approaches"
    : ""
}
`;
      break;

    case BusinessIndustries.HOME_PROFESSIONAL_SERVICES:
      insights += `
- Service types: ${responseMap.get("service_types") || "not specified"}
- Service radius: ${responseMap.get("service_area") || "not specified"}
- Job sizes handled: ${responseMap.get("job_size") || "not specified"}
- Scheduling flexibility: ${
        responseMap.get("scheduling_flexibility") || "not specified"
      }
- Pricing model: ${responseMap.get("pricing_model") || "not specified"}
- Client types: ${responseMap.get("client_type") || "not specified"}
${
  responseMap.get("emergency_services")
    ? "- Can promote 24/7 emergency availability"
    : ""
}
${
  responseMap.get("free_estimates")
    ? "- Emphasize free estimates/consultations"
    : ""
}
${
  responseMap.get("licensed_insured")
    ? "- Highlight licensed and insured credentials"
    : ""
}
`;
      break;

    case BusinessIndustries.PLACES_TO_STAY:
      insights += `
- Accommodation type: ${responseMap.get("accommodation_type") || "not specified"}
- Room/unit count: ${responseMap.get("room_count") || "not specified"}
- Occupancy rate: ${responseMap.get("occupancy_rate") || "not specified"}
- Primary guest types: ${responseMap.get("guest_type") || "not specified"}
- Low season: ${responseMap.get("low_season") || "not specified"}
- Amenities: ${responseMap.get("amenities") || "not specified"}
- Check-in flexibility: ${responseMap.get("checkin_flexibility") || "not specified"}
${
  responseMap.get("special_packages")
    ? "- Promote special packages (romance, adventure, family, etc.)"
    : ""
}
${
  responseMap.get("pet_friendly")
    ? "- Highlight pet-friendly accommodations"
    : ""
}
${
  responseMap.get("local_partnerships")
    ? "- Leverage partnerships with local attractions and restaurants"
    : ""
}
`;
      break;

    case BusinessIndustries.MOBILE_BUSINESSES:
      insights += `
- Service area: ${responseMap.get("service_area") || "not specified"}
- Operating schedule: ${responseMap.get("operating_schedule") || "not specified"}
- Popular locations/events: ${responseMap.get("popular_locations") || "not specified"}
- Menu highlights: ${responseMap.get("menu_highlights") || "not specified"}
- Average serving capacity: ${responseMap.get("serving_capacity") || "not specified"}
${
  responseMap.get("event_catering")
    ? "- Promote event catering and private bookings"
    : ""
}
${
  responseMap.get("social_media_presence")
    ? "- Leverage social media to announce locations and daily specials"
    : ""
}
${
  responseMap.get("seasonal_menu")
    ? "- Highlight seasonal and rotating menu items"
    : ""
}
`;
      break;

    default:
      insights += "- Use general best practices for the industry\n";
  }

  return insights;
}

// ===========================
// Core Service Functions
// ===========================

export class AITrainingService {
  /**
   * Initializes training for a business
   * Fetches industry and subCategory from business_AI_assistant
   */
  static async initializeTraining(businessId: string) {
    try {
      logger.info({ businessId }, "Starting training initialization");

      // Check if business exists and get its industry/subcategory
      const businessAgent = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      logger.info(
        { businessId, foundAgent: !!businessAgent },
        "Business agent lookup result",
      );

      if (!businessAgent) {
        throw new Error(
          `not found: No AI agent found for business ID: ${businessId}`,
        );
      }

      // Get industry and subCategory from business agent
      // Use mapping function to handle old category names
      const industry = mapCategoryToIndustry(businessAgent.category);
      const subCategory = businessAgent.subCategories?.[0] as
        | BusinessSubCategory
        | undefined;

      // Check if training already exists
      const existingTraining = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      logger.info(
        { businessId, existingTraining: !!existingTraining },
        "Existing training check",
      );

      if (existingTraining) {
        const phaseSummary = getPhaseSummary(
          existingTraining.industry as BusinessIndustries,
          existingTraining.subCategory as BusinessSubCategory,
        );

        return {
          message: "Training already initialized",
          training: existingTraining,
          questions: existingTraining.questions || [],
          phaseSummary,
        };
      }

      // Get questions for this industry - start with basic phase only
      logger.info({ industry, subCategory }, "Fetching questions");
      const basicQuestions = getQuestionsByPhaseUtil(
        industry,
        TrainingPhase.BASIC,
        subCategory,
      );
      logger.info(
        { questionCount: basicQuestions.length },
        "Basic questions fetched",
      );

      const phaseSummary = getPhaseSummary(industry, subCategory);

      // automatically answer the questionnaire based on business data (if available)
      const responseMap = new Map<string, any>();

      if (businessAgent.businessName) {
        responseMap.set("business_name", businessAgent.businessName);
      }

      if (businessAgent.description) {
        responseMap.set("business_description", businessAgent.description);
      }

      console.log("RESPONSE MAP===========================>", responseMap);

      const prefilledResponses: ITrainingResponse[] = [];
      for (const [questionId, answer] of responseMap.entries()) {
        prefilledResponses.push({
          questionId,
          answer,
          answeredAt: new Date(),
        });
      }

      // remove prefilled questions from questions array
      const filteredQuestions = basicQuestions.filter(
        (q) => !responseMap.has(q.id),
      );

      // Calculate phase progress
      const basicPhaseInfo = phaseSummary.find(
        (p) => p.phase === TrainingPhase.BASIC,
      );
      const standardPhaseInfo = phaseSummary.find(
        (p) => p.phase === TrainingPhase.STANDARD,
      );
      const advancedPhaseInfo = phaseSummary.find(
        (p) => p.phase === TrainingPhase.ADVANCED,
      );

      // Create new training record
      const training = await AI_TrainingModel.create({
        businessId: new mongoose.Types.ObjectId(businessId),
        assistantId: businessAgent.assistantId,
        industry,
        subCategory,
        responses: prefilledResponses,
        trainingStatus: "not_started",
        currentPhase: TrainingPhase.BASIC,
        completedPhases: [],
        metadata: {
          totalQuestions: basicQuestions.length, // Use total questions including prefilled
          answeredQuestions: prefilledResponses.length,
          requiredQuestions: basicQuestions.filter((q) => q.required).length,
          completionPercentage: Math.min(
            Math.round(
              (prefilledResponses.length / basicQuestions.length) * 100,
            ),
            100,
          ),
          phaseProgress: {
            basic: {
              total: basicPhaseInfo?.totalQuestions || 0,
              answered: prefilledResponses.length,
              completed: false,
            },
            standard: {
              total: standardPhaseInfo?.totalQuestions || 0,
              answered: 0,
              completed: false,
            },
            advanced: {
              total: advancedPhaseInfo?.totalQuestions || 0,
              answered: 0,
              completed: false,
            },
          },
        },
        questions: filteredQuestions,
      });

      logger.info(
        {
          businessId,
          industry,
          trainingId: training._id,
          questionCount: filteredQuestions.length,
          currentPhase: TrainingPhase.BASIC,
        },
        "Training initialized successfully",
      );
      return { training, questions: filteredQuestions, phaseSummary };
    } catch (error: any) {
      logger.error(
        {
          error: {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
          },
          businessId,
        },
        "Error initializing training",
      );
      throw error;
    }
  }

  /**
   * Validates a response against its question definition
   */
  private static validateResponse(
    response: { questionId: string; answer: any },
    question: AI_Training_Questionnaire_Type,
  ): { valid: boolean; error?: string } {
    const { answer } = response;
    const { type, options, required } = question;

    // Check for empty/null answers on required questions
    if (required) {
      if (answer === null || answer === undefined) {
        return {
          valid: false,
          error: `Answer is required for question: ${question.id}`,
        };
      }

      if (
        type === "text" &&
        typeof answer === "string" &&
        answer.trim() === ""
      ) {
        return {
          valid: false,
          error: `Answer cannot be empty for question: ${question.id}`,
        };
      }

      if (
        type === "multi_select" &&
        Array.isArray(answer) &&
        answer.length === 0
      ) {
        return {
          valid: false,
          error: `At least one option must be selected for question: ${question.id}`,
        };
      }
    }

    // Type validation based on question type
    switch (type) {
      case "text":
        if (typeof answer !== "string") {
          return {
            valid: false,
            error: `Answer must be a string for question: ${question.id}`,
          };
        }
        break;

      case "multiple_choice":
        if (typeof answer !== "string") {
          return {
            valid: false,
            error: `Answer must be a single string for multiple_choice question: ${question.id}`,
          };
        }
        // Validate against options
        if (options && !options.includes(answer)) {
          return {
            valid: false,
            error: `Answer "${answer}" is not a valid option for question: ${question.id}. Valid options: ${options.join(", ")}`,
          };
        }
        break;

      case "multi_select":
        if (!Array.isArray(answer)) {
          return {
            valid: false,
            error: `Answer must be an array for multi_select question: ${question.id}`,
          };
        }
        // Validate each selection against options
        if (options) {
          for (const selection of answer) {
            if (typeof selection !== "string") {
              return {
                valid: false,
                error: `All selections must be strings for question: ${question.id}`,
              };
            }
            if (!options.includes(selection)) {
              return {
                valid: false,
                error: `Selection "${selection}" is not a valid option for question: ${question.id}. Valid options: ${options.join(", ")}`,
              };
            }
          }
        }
        break;

      case "number":
        if (typeof answer !== "number") {
          return {
            valid: false,
            error: `Answer must be a number for question: ${question.id}`,
          };
        }
        if (isNaN(answer)) {
          return {
            valid: false,
            error: `Answer must be a valid number for question: ${question.id}`,
          };
        }
        break;

      case "boolean":
        if (typeof answer !== "boolean") {
          return {
            valid: false,
            error: `Answer must be a boolean for question: ${question.id}`,
          };
        }
        break;

      case "time":
        if (typeof answer !== "string") {
          return {
            valid: false,
            error: `Answer must be a string for time question: ${question.id}`,
          };
        }
        // Basic time format validation (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(answer)) {
          return {
            valid: false,
            error: `Answer must be in HH:MM format for time question: ${question.id}`,
          };
        }
        break;

      default:
        return {
          valid: false,
          error: `Unknown question type: ${type} for question: ${question.id}`,
        };
    }

    return { valid: true };
  }

  /**
   * Submits training responses for a business
   */
  static async submitTrainingResponses(
    businessId: string,
    responses: {
      questionId: string;
      answer: string | string[] | number | boolean;
    }[],
  ) {
    try {
      const training = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!training) {
        throw new Error(`No training found for business ID: ${businessId}`);
      }

      // Get all questions for validation
      const allQuestions = getAI_Training_Questionnaire_Types(
        training.industry as BusinessIndustries,
        training.subCategory as BusinessSubCategory,
      );

      // Create a map for quick question lookup
      const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

      // Validate all responses before saving
      const validationErrors: string[] = [];

      for (const response of responses) {
        // Check if question exists
        const question = questionMap.get(response.questionId);
        if (!question) {
          validationErrors.push(
            `Question ID "${response.questionId}" does not exist for this business`,
          );
          continue;
        }

        // Validate response against question definition
        const validation = this.validateResponse(response, question);
        if (!validation.valid) {
          validationErrors.push(validation.error!);
        }
      }

      // If there are validation errors, throw them
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join("; ")}`);
      }

      // All validations passed, now save the responses
      for (const response of responses) {
        const existingIndex = training.responses.findIndex(
          (r) => r.questionId === response.questionId,
        );

        if (existingIndex >= 0) {
          // Update existing response
          training.responses[existingIndex].answer = response.answer;
          training.responses[existingIndex].answeredAt = new Date();
        } else {
          // Add new response
          training.responses.push({
            questionId: response.questionId,
            answer: response.answer,
            answeredAt: new Date(),
          });
        }
      }

      // Update metadata
      if (training.metadata) {
        training.metadata.answeredQuestions = training.responses.length;

        // Calculate completion percentage and cap at 100% to handle edge cases
        const rawPercentage =
          (training.responses.length /
            (training.metadata.totalQuestions || 1)) *
          100;
        training.metadata.completionPercentage = Math.min(
          Math.round(rawPercentage),
          100,
        );

        // Update phase progress
        if (training.metadata.phaseProgress) {
          const responseIds = new Set(
            training.responses.map((r) => r.questionId),
          );

          // Get questions by phase
          const basicQuestions = getQuestionsByPhaseUtil(
            training.industry as BusinessIndustries,
            TrainingPhase.BASIC,
            training.subCategory as BusinessSubCategory,
          );
          const standardQuestions = getQuestionsByPhaseUtil(
            training.industry as BusinessIndustries,
            TrainingPhase.STANDARD,
            training.subCategory as BusinessSubCategory,
          );
          const advancedQuestions = getQuestionsByPhaseUtil(
            training.industry as BusinessIndustries,
            TrainingPhase.ADVANCED,
            training.subCategory as BusinessSubCategory,
          );

          // Count answered questions per phase
          const basicAnswered = basicQuestions.filter((q) =>
            responseIds.has(q.id),
          ).length;
          const standardAnswered = standardQuestions.filter((q) =>
            responseIds.has(q.id),
          ).length;
          const advancedAnswered = advancedQuestions.filter((q) =>
            responseIds.has(q.id),
          ).length;

          training.metadata.phaseProgress.basic.answered = basicAnswered;
          training.metadata.phaseProgress.basic.completed =
            basicAnswered === training.metadata.phaseProgress.basic.total;

          training.metadata.phaseProgress.standard.answered = standardAnswered;
          training.metadata.phaseProgress.standard.completed =
            standardAnswered === training.metadata.phaseProgress.standard.total;

          training.metadata.phaseProgress.advanced.answered = advancedAnswered;
          training.metadata.phaseProgress.advanced.completed =
            advancedAnswered === training.metadata.phaseProgress.advanced.total;
        }
      }

      // Update training status
      if (training.trainingStatus === "not_started") {
        training.trainingStatus = "in_progress";
      }

      await training.save();

      logger.info(
        { businessId, responseCount: responses.length },
        "Training responses submitted successfully",
      );

      return training;
    } catch (error: any) {
      logger.error(
        { error, businessId },
        "Error submitting training responses",
      );
      throw error;
    }
  }

  /**
   * Completes training and updates the AI assistant with enhanced instructions
   */
  static async completeTraining(businessId: string) {
    try {
      const training = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!training) {
        throw new Error(`No training found for business ID: ${businessId}`);
      }

      // Only validate BASIC phase required questions for completion
      // Standard and Advanced phases are optional
      const basicQuestions = getQuestionsByPhaseUtil(
        training.industry as BusinessIndustries,
        TrainingPhase.BASIC,
        training.subCategory as BusinessSubCategory,
      );

      const requiredBasicQuestions = basicQuestions.filter((q) => q.required);
      const responsesMap = Object.fromEntries(
        training.responses.map((r) => [r.questionId, r.answer]),
      );

      const missingBasicRequired = requiredBasicQuestions
        .filter((q) => !responsesMap.hasOwnProperty(q.id))
        .map((q) => q.id);

      if (missingBasicRequired.length > 0) {
        throw new Error(
          `Training incomplete. Missing required BASIC phase questions: ${missingBasicRequired.join(
            ", ",
          )}. Please complete at least the Basic phase before finishing training.`,
        );
      }

      // Get business agent
      const businessAgent = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!businessAgent) {
        throw new Error(
          `not found: No AI agent found for business ID: ${businessId}`,
        );
      }

      // Generate enhanced instructions
      const baseInstructions = `You are the AI agent for ${businessAgent.businessName}.`;
      const enhancedInstructions = generateEnhancedInstructions(
        businessAgent.businessName,
        training.industry,
        training.responses,
        baseInstructions,
      );

      const industryInsights = generateIndustryInsights(
        training.industry as BusinessIndustries,
        training.responses,
      );

      const finalInstructions = enhancedInstructions + industryInsights;

      // Update OpenAI assistant with enhanced instructions
      try {
        await openai.beta.assistants.update(businessAgent.assistantId, {
          instructions: finalInstructions,
        });
        logger.info(
          { businessId, assistantId: businessAgent.assistantId },
          "Assistant updated successfully",
        );
      } catch (assistantError: any) {
        // Log the assistant update error
        logger.error(
          {
            error: assistantError,
            businessId,
            assistantId: businessAgent.assistantId,
          },
          "Failed to update OpenAI assistant",
        );

        // Check if it's a 404 error (assistant doesn't exist)
        if (
          assistantError.status === 404 ||
          assistantError.message?.includes("404")
        ) {
          logger.warn(
            { businessId, assistantId: businessAgent.assistantId },
            "Assistant not found in OpenAI. Attempting to create new assistant with training data...",
          );

          try {
            // Create a new assistant with the training data
            const newAssistant = await openai.beta.assistants.create({
              name: businessAgent.businessName,
              model: "gpt-4o",
              instructions: finalInstructions,
              tools: [{ type: "file_search" }],
            });

            // Update the business agent with new assistant ID
            businessAgent.assistantId = newAssistant.id;
            await businessAgent.save();

            logger.info(
              {
                businessId,
                oldAssistantId: assistantError.message,
                newAssistantId: newAssistant.id,
              },
              "Successfully created new assistant with training data",
            );
          } catch (createError: any) {
            logger.error(
              { error: createError, businessId },
              "Failed to create new assistant. Training will be marked as completed without assistant.",
            );
          }
        }

        // Continue to mark training as completed even if assistant operations fail
      }

      // Mark training as completed
      training.trainingStatus = "completed";
      training.completedAt = new Date();
      await training.save();

      logger.info({ businessId }, "Training completed");

      return {
        message: "Training completed successfully",
        training,
        assistantId: businessAgent.assistantId,
        warning:
          training.trainingStatus === "completed" && !finalInstructions
            ? undefined
            : "Assistant update may have failed, but training is marked as completed",
      };
    } catch (error: any) {
      logger.error({ error, businessId }, "Error completing training");
      throw error;
    }
  }

  /**
   * Gets training status for a business
   */
  static async getTrainingStatus(businessId: string) {
    try {
      const training = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!training) {
        return {
          exists: false,
          message: "No training found for this business",
        };
      }

      // Get questions for this industry
      const questions = getAI_Training_Questionnaire_Types(
        training.industry as BusinessIndustries,
        training.subCategory as BusinessSubCategory,
      );

      return {
        exists: true,
        status: training.trainingStatus,
        metadata: training.metadata,
        completedAt: training.completedAt,
        totalQuestions: questions.length,
        answeredQuestions: training.responses.length,
      };
    } catch (error: any) {
      logger.error({ error, businessId }, "Error getting training status");
      throw error;
    }
  }

  /**
   * Gets training questions for a business
   */
  static async getTrainingQuestions(
    industry: BusinessIndustries,
    subCategory?: BusinessSubCategory,
  ) {
    try {
      const questions = getAI_Training_Questionnaire_Types(
        industry,
        subCategory,
      );
      const requiredQuestions = getRequiredQuestions(industry, subCategory);

      return {
        allQuestions: questions,
        requiredQuestions,
        totalCount: questions.length,
        requiredCount: requiredQuestions.length,
      };
    } catch (error: any) {
      logger.error({ error, industry }, "Error getting training questions");
      throw error;
    }
  }

  /**
   * Gets training questions with smart defaults based on business category
   * This enriches questions with suggested answers for faster completion
   */
  static async getTrainingQuestionsWithDefaults(
    industry: BusinessIndustries,
    subCategory?: BusinessSubCategory,
  ) {
    try {
      const questionsWithDefaults = getQuestionsWithSmartDefaults(
        industry,
        subCategory,
      );
      const requiredQuestions = getRequiredQuestions(industry, subCategory);
      const smartDefaults = getSmartDefaults(industry, subCategory);

      return {
        allQuestions: questionsWithDefaults,
        requiredQuestions,
        smartDefaults,
        totalCount: questionsWithDefaults.length,
        requiredCount: requiredQuestions.length,
        hasDefaults: Object.keys(smartDefaults).length > 0,
        defaultsInfo: {
          subcategory: subCategory || "N/A",
          defaultsApplied: Object.keys(smartDefaults).length,
          message:
            Object.keys(smartDefaults).length > 0
              ? "Smart defaults have been pre-selected based on your business type. You can modify any selections."
              : "No smart defaults available for this business type.",
        },
      };
    } catch (error: any) {
      logger.error(
        { error, industry },
        "Error getting training questions with defaults",
      );
      throw error;
    }
  }

  /**
   * Gets submitted responses for a business
   */
  static async getTrainingResponses(businessId: string) {
    try {
      const training = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!training) {
        throw new Error(`No training found for business ID: ${businessId}`);
      }

      return {
        responses: training.responses,
        metadata: training.metadata,
        status: training.trainingStatus,
      };
    } catch (error: any) {
      logger.error({ error, businessId }, "Error getting training responses");
      throw error;
    }
  }

  /**
   * Resets training for a business (allows re-training)
   */
  static async resetTraining(businessId: string) {
    try {
      const training = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!training) {
        throw new Error(`No training found for business ID: ${businessId}`);
      }

      training.responses = [];
      training.trainingStatus = "not_started";
      training.currentPhase = TrainingPhase.BASIC;
      training.completedPhases = [];
      training.completedAt = undefined;

      if (training.metadata) {
        training.metadata.answeredQuestions = 0;
        training.metadata.completionPercentage = 0;
        if (training.metadata.phaseProgress) {
          training.metadata.phaseProgress.basic.answered = 0;
          training.metadata.phaseProgress.basic.completed = false;
          training.metadata.phaseProgress.standard.answered = 0;
          training.metadata.phaseProgress.standard.completed = false;
          training.metadata.phaseProgress.advanced.answered = 0;
          training.metadata.phaseProgress.advanced.completed = false;
        }
      }

      await training.save();

      logger.info({ businessId }, "Training reset");
      return training;
    } catch (error: any) {
      logger.error({ error, businessId }, "Error resetting training");
      throw error;
    }
  }

  /**
   * Gets questions by phase for a business
   */
  static async getQuestionsByPhase(businessId: string, phase: TrainingPhase) {
    try {
      const training = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!training) {
        throw new Error(`No training found for business ID: ${businessId}`);
      }

      const questions = getQuestionsByPhaseUtil(
        training.industry as BusinessIndustries,
        phase,
        training.subCategory as BusinessSubCategory,
      );

      const phaseSummary = getPhaseSummary(
        training.industry as BusinessIndustries,
        training.subCategory as BusinessSubCategory,
      );

      return {
        phase,
        questions,
        currentPhase: training.currentPhase,
        completedPhases: training.completedPhases,
        phaseSummary,
        metadata: training.metadata,
      };
    } catch (error: any) {
      logger.error(
        { error, businessId, phase },
        "Error getting questions by phase",
      );
      throw error;
    }
  }

  /**
   * Gets comprehensive training state for a business
   * This unified API provides all training information in one call:
   * - Total phases and current phase
   * - Questions for current phase (answered and remaining)
   * - Progress tracking across all phases
   * - Phase summary information
   * @param businessId - The business ID
   * @param queryPhase - Optional phase to query. If provided, returns questions from this phase instead of current phase
   */
  static async getTrainingState(
    businessId: string,
    queryPhase?: TrainingPhase,
  ) {
    try {
      logger.info({ businessId, queryPhase }, "Starting getTrainingState");

      // Check if business exists
      const businessAgent = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      logger.info(
        {
          businessId,
          foundAgent: !!businessAgent,
          agentCategory: businessAgent?.category,
          agentSubCategories: businessAgent?.subCategories,
        },
        "Business agent lookup result",
      );

      if (!businessAgent) {
        throw new Error(`No AI agent found for business ID: ${businessId}`);
      }

      // Check if training exists
      let training = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      // If no training exists, initialize it
      if (!training) {
        logger.info({ businessId }, "No training found, initializing");
        // Use mapping function to handle old category names
        const industry = mapCategoryToIndustry(businessAgent.category);
        const subCategory = businessAgent.subCategories?.[0] as
          | BusinessSubCategory
          | undefined;

        logger.info({ industry, subCategory }, "Getting basic phase questions");

        // Get questions for basic phase
        const basicQuestions = getQuestionsByPhaseUtil(
          industry,
          TrainingPhase.BASIC,
          subCategory,
        );

        logger.info(
          { basicQuestionsCount: basicQuestions.length },
          "Basic questions retrieved",
        );

        const phaseSummary = getPhaseSummary(industry, subCategory);
        logger.info(
          { phaseSummaryLength: phaseSummary.length },
          "Phase summary retrieved",
        );

        // Pre-fill business_name and business_description
        const prefilledResponses: ITrainingResponse[] = [];
        const responseMap = new Map<string, any>();

        if (businessAgent.businessName) {
          responseMap.set("business_name", businessAgent.businessName);
        }

        if (businessAgent.description) {
          responseMap.set("business_description", businessAgent.description);
        }

        for (const [questionId, answer] of responseMap.entries()) {
          prefilledResponses.push({
            questionId,
            answer,
            answeredAt: new Date(),
          });
        }

        // Remove prefilled questions from questions array
        const filteredQuestions = basicQuestions.filter(
          (q) => !responseMap.has(q.id),
        );

        // Calculate phase progress
        const basicPhaseInfo = phaseSummary.find(
          (p) => p.phase === TrainingPhase.BASIC,
        );
        const standardPhaseInfo = phaseSummary.find(
          (p) => p.phase === TrainingPhase.STANDARD,
        );
        const advancedPhaseInfo = phaseSummary.find(
          (p) => p.phase === TrainingPhase.ADVANCED,
        );

        // Create new training record
        training = await AI_TrainingModel.create({
          businessId: new mongoose.Types.ObjectId(businessId),
          assistantId: businessAgent.assistantId,
          industry,
          subCategory,
          responses: prefilledResponses,
          trainingStatus: "not_started",
          currentPhase: TrainingPhase.BASIC,
          completedPhases: [],
          metadata: {
            totalQuestions: basicQuestions.length, // Use total questions including prefilled
            answeredQuestions: prefilledResponses.length,
            requiredQuestions: basicQuestions.filter((q) => q.required).length,
            completionPercentage: Math.min(
              Math.round(
                (prefilledResponses.length / basicQuestions.length) * 100,
              ),
              100,
            ),
            phaseProgress: {
              basic: {
                total: basicPhaseInfo?.totalQuestions || 0,
                answered: prefilledResponses.length,
                completed: false,
              },
              standard: {
                total: standardPhaseInfo?.totalQuestions || 0,
                answered: 0,
                completed: false,
              },
              advanced: {
                total: advancedPhaseInfo?.totalQuestions || 0,
                answered: 0,
                completed: false,
              },
            },
          },
          questions: filteredQuestions,
        });
      }

      // Get phase summary
      const phaseSummary = getPhaseSummary(
        training.industry as BusinessIndustries,
        training.subCategory as BusinessSubCategory,
      );

      // Create response map for quick lookup
      const responseMap = new Map(
        training.responses.map((r) => [r.questionId, r]),
      );

      // Check if current phase is completed and advance to next phase if needed
      let phaseChanged = false;
      const currentPhaseQuestions = getQuestionsByPhaseUtil(
        training.industry as BusinessIndustries,
        training.currentPhase as TrainingPhase,
        training.subCategory as BusinessSubCategory,
      );

      // Count answered questions in current phase
      const currentPhaseAnswered = currentPhaseQuestions.filter((q) =>
        responseMap.has(q.id),
      ).length;

      // If all questions in current phase are answered, advance to next phase
      if (currentPhaseAnswered === currentPhaseQuestions.length) {
        let nextPhase: TrainingPhase | null = null;

        if (training.currentPhase === TrainingPhase.BASIC) {
          nextPhase = TrainingPhase.STANDARD;
        } else if (training.currentPhase === TrainingPhase.STANDARD) {
          nextPhase = TrainingPhase.ADVANCED;
        }

        // Advance to next phase if available and not already completed
        if (
          nextPhase &&
          !training.completedPhases.includes(training.currentPhase as any)
        ) {
          training.completedPhases.push(training.currentPhase as any);
          training.currentPhase = nextPhase;
          phaseChanged = true;
          await training.save();

          logger.info(
            {
              businessId,
              oldPhase:
                training.completedPhases[training.completedPhases.length - 1],
              newPhase: nextPhase,
            },
            "Advanced to next phase",
          );
        }
      }

      // Check if advanced phase is complete (separate check since it has no next phase)
      if (
        training.currentPhase === TrainingPhase.ADVANCED &&
        !training.completedPhases.includes(TrainingPhase.ADVANCED as any)
      ) {
        const advancedPhaseQuestions = getQuestionsByPhaseUtil(
          training.industry as BusinessIndustries,
          TrainingPhase.ADVANCED,
          training.subCategory as BusinessSubCategory,
        );
        const advancedPhaseAnswered = advancedPhaseQuestions.filter((q) =>
          responseMap.has(q.id),
        ).length;

        if (advancedPhaseAnswered === advancedPhaseQuestions.length) {
          training.completedPhases.push(TrainingPhase.ADVANCED as any);
          await training.save();

          logger.info({ businessId }, "Advanced phase marked as completed");
        }
      }

      // Determine which phase to return questions for
      // If queryPhase is provided, use that; otherwise use current phase
      const phaseToReturn =
        queryPhase || (training.currentPhase as TrainingPhase);

      // Get questions for the queried/current phase
      const activePhaseQuestions = getQuestionsByPhaseUtil(
        training.industry as BusinessIndustries,
        phaseToReturn,
        training.subCategory as BusinessSubCategory,
      );

      // Add isAnswered status and answer to each question
      const questionsWithStatus = activePhaseQuestions.map((q) => {
        const response = responseMap.get(q.id);
        const isAnswered = !!response;

        return {
          ...q,
          isAnswered,
          answer: isAnswered ? response.answer : undefined,
          answeredAt: isAnswered ? response.answeredAt : undefined,
        };
      });

      // Count answered and remaining
      const answeredCount = questionsWithStatus.filter(
        (q) => q.isAnswered,
      ).length;
      const remainingCount = questionsWithStatus.filter(
        (q) => !q.isAnswered,
      ).length;

      // Calculate correct metadata with proper percentages (capped at 100%)
      const totalQuestionsAllPhases = phaseSummary.reduce(
        (sum, p) => sum + p.totalQuestions,
        0,
      );
      const totalAnsweredAllPhases = training.responses.length;
      const totalRequiredAllPhases = phaseSummary.reduce(
        (sum, p) => sum + p.requiredQuestions,
        0,
      );

      // Calculate per-phase progress with percentages
      const phaseProgressWithPercentage = {
        basic: {
          total: training.metadata?.phaseProgress?.basic?.total || 0,
          answered: training.metadata?.phaseProgress?.basic?.answered || 0,
          completed:
            training.metadata?.phaseProgress?.basic?.completed || false,
          percentage: Math.min(
            Math.round(
              ((training.metadata?.phaseProgress?.basic?.answered || 0) /
                (training.metadata?.phaseProgress?.basic?.total || 1)) *
                100,
            ),
            100,
          ),
        },
        standard: {
          total: training.metadata?.phaseProgress?.standard?.total || 0,
          answered: training.metadata?.phaseProgress?.standard?.answered || 0,
          completed:
            training.metadata?.phaseProgress?.standard?.completed || false,
          percentage: Math.min(
            Math.round(
              ((training.metadata?.phaseProgress?.standard?.answered || 0) /
                (training.metadata?.phaseProgress?.standard?.total || 1)) *
                100,
            ),
            100,
          ),
        },
        advanced: {
          total: training.metadata?.phaseProgress?.advanced?.total || 0,
          answered: training.metadata?.phaseProgress?.advanced?.answered || 0,
          completed:
            training.metadata?.phaseProgress?.advanced?.completed || false,
          percentage: Math.min(
            Math.round(
              ((training.metadata?.phaseProgress?.advanced?.answered || 0) /
                (training.metadata?.phaseProgress?.advanced?.total || 1)) *
                100,
            ),
            100,
          ),
        },
      };

      // Build corrected metadata
      const correctedMetadata = {
        totalQuestions: totalQuestionsAllPhases,
        answeredQuestions: Math.min(
          totalAnsweredAllPhases,
          totalQuestionsAllPhases,
        ),
        requiredQuestions: totalRequiredAllPhases,
        completionPercentage: Math.min(
          Math.round((totalAnsweredAllPhases / totalQuestionsAllPhases) * 100),
          100,
        ),
        phaseProgress: phaseProgressWithPercentage,
      };

      // Recalculate completedPhases based on actual answered questions
      const correctedCompletedPhases: TrainingPhase[] = [];

      // Check each phase independently
      const basicQuestions = getQuestionsByPhaseUtil(
        training.industry as BusinessIndustries,
        TrainingPhase.BASIC,
        training.subCategory as BusinessSubCategory,
      );
      const basicAnswered = basicQuestions.filter((q) =>
        responseMap.has(q.id),
      ).length;
      if (basicAnswered === basicQuestions.length) {
        correctedCompletedPhases.push(TrainingPhase.BASIC);
      }

      const standardQuestions = getQuestionsByPhaseUtil(
        training.industry as BusinessIndustries,
        TrainingPhase.STANDARD,
        training.subCategory as BusinessSubCategory,
      );
      const standardAnswered = standardQuestions.filter((q) =>
        responseMap.has(q.id),
      ).length;
      if (standardAnswered === standardQuestions.length) {
        correctedCompletedPhases.push(TrainingPhase.STANDARD);
      }

      const advancedQuestions = getQuestionsByPhaseUtil(
        training.industry as BusinessIndustries,
        TrainingPhase.ADVANCED,
        training.subCategory as BusinessSubCategory,
      );
      const advancedAnswered = advancedQuestions.filter((q) =>
        responseMap.has(q.id),
      ).length;
      if (advancedAnswered === advancedQuestions.length) {
        correctedCompletedPhases.push(TrainingPhase.ADVANCED);
      }

      // Determine correct training status
      // "completed" only if all phases are done, "in_progress" if at least one response exists, "not_started" otherwise
      let correctedTrainingStatus: string;
      if (correctedCompletedPhases.length === 3) {
        correctedTrainingStatus = "completed";
      } else if (training.responses.length > 0) {
        correctedTrainingStatus = "in_progress";
      } else {
        correctedTrainingStatus = "not_started";
      }

      return {
        trainingStatus: correctedTrainingStatus,
        currentPhase: training.currentPhase,
        completedPhases: correctedCompletedPhases,
        totalPhases: 3,
        phaseSummary,
        phaseAdvanced: phaseChanged,
        queriedPhase: queryPhase || null, // Indicate if a specific phase was queried
        currentPhaseData: {
          phase: phaseToReturn,
          totalQuestions: activePhaseQuestions.length,
          answeredCount,
          remainingCount,
          questions: questionsWithStatus,
        },
        metadata: correctedMetadata,
        completedAt:
          correctedTrainingStatus === "completed"
            ? training.completedAt
            : undefined,
      };
    } catch (error: any) {
      logger.error({ error, businessId }, "Error getting training state");
      throw error;
    }
  }

  /**
   * Update Google Places data for a business
   * Called by Pinntag backend with data from Google Places API
   */
  static async updateGooglePlacesData(
    businessId: string,
    googlePlacesData: any,
  ): Promise<any> {
    try {
      logger.info({ businessId }, "Updating Google Places data");

      // Validate businessId
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        throw new Error("Invalid businessId format");
      }

      // Find existing training record
      const training = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!training) {
        throw new Error("Training record not found for this business");
      }

      // Extract and structure the relevant data from Google Places API
      const structuredData = {
        regularOpeningHours: googlePlacesData.regularOpeningHours
          ? {
              openNow: googlePlacesData.regularOpeningHours.openNow,
              periods: googlePlacesData.regularOpeningHours.periods,
              weekdayDescriptions:
                googlePlacesData.regularOpeningHours.weekdayDescriptions,
            }
          : undefined,
        photos: googlePlacesData.photos?.map((photo: any) => ({
          name: photo.name,
          widthPx: photo.widthPx,
          heightPx: photo.heightPx,
          authorAttributions: photo.authorAttributions,
        })),
        rating: googlePlacesData.rating,
        userRatingCount: googlePlacesData.userRatingCount,
        googleMapsUri: googlePlacesData.googleMapsUri,
        websiteUri: googlePlacesData.websiteUri,
        nationalPhoneNumber: googlePlacesData.nationalPhoneNumber,
        internationalPhoneNumber: googlePlacesData.internationalPhoneNumber,
        formattedAddress: googlePlacesData.formattedAddress,
        location: googlePlacesData.location
          ? {
              latitude: googlePlacesData.location.latitude,
              longitude: googlePlacesData.location.longitude,
            }
          : undefined,
        types: googlePlacesData.types,
        displayName: googlePlacesData.displayName,
        primaryTypeDisplayName: googlePlacesData.primaryTypeDisplayName,
        lastUpdated: new Date(),
      };

      // Update the training record with Google Places data
      training.googlePlacesData = structuredData;
      training.lastUpdated = new Date();
      await training.save();

      logger.info(
        { businessId, hasOpeningHours: !!structuredData.regularOpeningHours },
        "Google Places data updated successfully",
      );

      // If training is completed, update the AI assistant with new information
      if (training.trainingStatus === "completed") {
        try {
          const businessAgent = await BusinessAIAssistantModel.findOne({
            businessId: new mongoose.Types.ObjectId(businessId),
          });

          if (businessAgent && businessAgent.assistantId) {
            // Generate enhanced instructions with Google Places data
            const enhancedInstructions =
              generateEnhancedInstructionsWithGooglePlaces(
                businessAgent.businessName,
                training.industry,
                training.responses,
                businessAgent.instructions || "",
                structuredData,
              );

            // Update assistant
            await openai.beta.assistants.update(businessAgent.assistantId, {
              instructions: enhancedInstructions,
            });

            logger.info(
              { businessId, assistantId: businessAgent.assistantId },
              "Assistant updated with Google Places data",
            );
          }
        } catch (assistantError: any) {
          logger.error(
            { error: assistantError, businessId },
            "Failed to update assistant with Google Places data, but data was saved",
          );
          // Don't throw - data is saved even if assistant update fails
        }
      }

      return {
        message: "Google Places data updated successfully",
        training: {
          businessId: training.businessId,
          googlePlacesData: training.googlePlacesData,
          lastUpdated: training.lastUpdated,
        },
      };
    } catch (error: any) {
      logger.error({ error, businessId }, "Error updating Google Places data");
      throw error;
    }
  }
}
