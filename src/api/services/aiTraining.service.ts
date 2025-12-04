import OpenAI from "openai";
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===========================
// Helper Functions
// ===========================

/**
 * Generates enhanced AI instructions based on training responses
 */
function generateEnhancedInstructions(
  businessName: string,
  industry: string,
  responses: ITrainingResponse[],
  baseInstructions: string
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
        ", "
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
 * Generates industry-specific recommendations for the AI assistant
 */
function generateIndustryInsights(
  industry: BusinessIndustries,
  responses: ITrainingResponse[]
): string {
  const responseMap = new Map(responses.map((r) => [r.questionId, r.answer]));
  let insights = "\n## Industry-Specific Insights\n";

  switch (industry) {
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
${
  responseMap.get("happy_hour_interest")
    ? "- Emphasize happy hour and off-peak specials"
    : ""
}
`;
      break;

    case BusinessIndustries.RETAIL:
      insights += `
- Product categories: ${
        responseMap.get("product_categories") || "not specified"
      }
- Price range: ${responseMap.get("price_range") || "not specified"}
- Inventory turnover: ${
        responseMap.get("inventory_turnover") || "not specified"
      }
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
`;
      break;

    case BusinessIndustries.HEALTH_BEAUTY:
      insights += `
- Services offered: ${responseMap.get("services_offered") || "not specified"}
- Typical service duration: ${
        responseMap.get("service_duration") || "not specified"
      }
- Booking fill rate: ${
        responseMap.get("appointment_fill_rate") || "not specified"
      }
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
`;
      break;

    case BusinessIndustries.FITNESS_WELLNESS:
      insights += `
- Membership structure: ${
        responseMap.get("membership_structure") || "not specified"
      }
- Experience levels catered: ${
        responseMap.get("experience_levels") || "not specified"
      }
- Primary challenge: ${
        responseMap.get("member_retention_goal") || "not specified"
      }
- Under-booked slots: ${
        responseMap.get("under_utilized_slots") || "not specified"
      }
${
  responseMap.get("trial_classes")
    ? "- Emphasize trial classes for new member acquisition"
    : ""
}
`;
      break;

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
${
  responseMap.get("last_minute_bookings")
    ? "- Can promote last-minute deals to fill slots"
    : ""
}
`;
      break;

    case BusinessIndustries.AUTOMOTIVE_SERVICES:
      insights += `
- Service types: ${responseMap.get("service_types") || "not specified"}
- Vehicle types serviced: ${responseMap.get("vehicle_types") || "not specified"}
- Typical service duration: ${
        responseMap.get("service_duration") || "not specified"
      }
${
  responseMap.get("seasonal_services")
    ? "- Promote seasonal services proactively"
    : ""
}
${
  responseMap.get("package_deals")
    ? "- Highlight service packages for better value"
    : ""
}
`;
      break;

    case BusinessIndustries.HOME_SERVICES:
      insights += `
- Service radius: ${responseMap.get("service_area") || "not specified"}
- Job sizes handled: ${responseMap.get("job_size") || "not specified"}
- Scheduling flexibility: ${
        responseMap.get("scheduling_flexibility") || "not specified"
      }
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
`;
      break;

    case BusinessIndustries.PET_SERVICES:
      insights += `
- Pet types serviced: ${responseMap.get("pet_types") || "not specified"}
- Service model: ${responseMap.get("appointment_based") || "not specified"}
${responseMap.get("multi_pet_discount") ? "- Promote multi-pet discounts" : ""}
${
  responseMap.get("package_deals_pets")
    ? "- Highlight package deals and memberships"
    : ""
}
`;
      break;

    case BusinessIndustries.HOSPITALITY:
      insights += `
- Room count: ${responseMap.get("room_count") || "not specified"}
- Occupancy rate: ${responseMap.get("occupancy_rate") || "not specified"}
- Primary guest types: ${responseMap.get("guest_type") || "not specified"}
- Low season: ${responseMap.get("low_season") || "not specified"}
- Amenities: ${responseMap.get("amenities_hospitality") || "not specified"}
${
  responseMap.get("special_packages")
    ? "- Promote special packages (romance, adventure, etc.)"
    : ""
}
`;
      break;

    case BusinessIndustries.PROFESSIONAL_SERVICES:
      insights += `
- Service delivery: ${responseMap.get("service_delivery") || "not specified"}
- Client types: ${responseMap.get("client_type") || "not specified"}
- Pricing model: ${responseMap.get("pricing_model") || "not specified"}
- Current capacity: ${
        responseMap.get("capacity_constraints") || "not specified"
      }
- Specializations: ${responseMap.get("specializations") || "not specified"}
${
  responseMap.get("consultation_process")
    ? "- Emphasize free consultations"
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
        "Business agent lookup result"
      );

      if (!businessAgent) {
        throw new Error(`No AI agent found for business ID: ${businessId}`);
      }

      // Get industry and subCategory from business agent
      const industry = businessAgent.category as BusinessIndustries;
      const subCategory = businessAgent.subCategories?.[0] as BusinessSubCategory | undefined;

      // Check if training already exists
      const existingTraining = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      logger.info(
        { businessId, existingTraining: !!existingTraining },
        "Existing training check"
      );

      if (existingTraining) {
        const phaseSummary = getPhaseSummary(
          existingTraining.industry as BusinessIndustries,
          existingTraining.subCategory as BusinessSubCategory
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
        subCategory
      );
      logger.info({ questionCount: basicQuestions.length }, "Basic questions fetched");

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
      const filteredQuestions = basicQuestions.filter((q) => !responseMap.has(q.id));

      // Calculate phase progress
      const basicPhaseInfo = phaseSummary.find((p) => p.phase === TrainingPhase.BASIC);
      const standardPhaseInfo = phaseSummary.find((p) => p.phase === TrainingPhase.STANDARD);
      const advancedPhaseInfo = phaseSummary.find((p) => p.phase === TrainingPhase.ADVANCED);

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
          totalQuestions: filteredQuestions.length,
          answeredQuestions: prefilledResponses.length,
          requiredQuestions: filteredQuestions.filter((q) => q.required).length,
          completionPercentage: Math.round(
            (prefilledResponses.length / filteredQuestions.length) * 100
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
        "Training initialized successfully"
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
        "Error initializing training"
      );
      throw error;
    }
  }

  /**
   * Validates a response against its question definition
   */
  private static validateResponse(
    response: { questionId: string; answer: any },
    question: AI_Training_Questionnaire_Type
  ): { valid: boolean; error?: string } {
    const { answer } = response;
    const { type, options, required } = question;

    // Check for empty/null answers on required questions
    if (required) {
      if (answer === null || answer === undefined) {
        return { valid: false, error: `Answer is required for question: ${question.id}` };
      }

      if (type === "text" && typeof answer === "string" && answer.trim() === "") {
        return { valid: false, error: `Answer cannot be empty for question: ${question.id}` };
      }

      if (type === "multi_select" && Array.isArray(answer) && answer.length === 0) {
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
    }[]
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
        training.subCategory as BusinessSubCategory
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
            `Question ID "${response.questionId}" does not exist for this business`
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
          (r) => r.questionId === response.questionId
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
        training.metadata.completionPercentage = Math.round(
          (training.responses.length / (training.metadata.totalQuestions || 1)) * 100
        );

        // Update phase progress
        if (training.metadata.phaseProgress) {
          const responseIds = new Set(training.responses.map((r) => r.questionId));

          // Get questions by phase
          const basicQuestions = getQuestionsByPhaseUtil(
            training.industry as BusinessIndustries,
            TrainingPhase.BASIC,
            training.subCategory as BusinessSubCategory
          );
          const standardQuestions = getQuestionsByPhaseUtil(
            training.industry as BusinessIndustries,
            TrainingPhase.STANDARD,
            training.subCategory as BusinessSubCategory
          );
          const advancedQuestions = getQuestionsByPhaseUtil(
            training.industry as BusinessIndustries,
            TrainingPhase.ADVANCED,
            training.subCategory as BusinessSubCategory
          );

          // Count answered questions per phase
          const basicAnswered = basicQuestions.filter((q) => responseIds.has(q.id)).length;
          const standardAnswered = standardQuestions.filter((q) => responseIds.has(q.id)).length;
          const advancedAnswered = advancedQuestions.filter((q) => responseIds.has(q.id)).length;

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
        "Training responses submitted successfully"
      );

      return training;
    } catch (error: any) {
      logger.error(
        { error, businessId },
        "Error submitting training responses"
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

      // Validate training data
      const responsesMap = Object.fromEntries(
        training.responses.map((r) => [r.questionId, r.answer])
      );

      const validation = validateTrainingData(
        responsesMap,
        training.industry as BusinessIndustries,
        training.subCategory as BusinessSubCategory
      );

      if (!validation.isValid) {
        throw new Error(
          `Training incomplete. Missing required questions: ${validation.missingRequired.join(
            ", "
          )}`
        );
      }

      // Get business agent
      const businessAgent = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!businessAgent) {
        throw new Error(`No AI agent found for business ID: ${businessId}`);
      }

      // Generate enhanced instructions
      const baseInstructions = `You are the AI agent for ${businessAgent.businessName}.`;
      const enhancedInstructions = generateEnhancedInstructions(
        businessAgent.businessName,
        training.industry,
        training.responses,
        baseInstructions
      );

      const industryInsights = generateIndustryInsights(
        training.industry as BusinessIndustries,
        training.responses
      );

      const finalInstructions = enhancedInstructions + industryInsights;

      // Update OpenAI assistant with enhanced instructions
      await openai.beta.assistants.update(businessAgent.assistantId, {
        instructions: finalInstructions,
      });

      // Mark training as completed
      training.trainingStatus = "completed";
      training.completedAt = new Date();
      await training.save();

      logger.info({ businessId }, "Training completed and assistant updated");

      return {
        message: "Training completed successfully",
        training,
        assistantId: businessAgent.assistantId,
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
        training.subCategory as BusinessSubCategory
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
    subCategory?: BusinessSubCategory
  ) {
    try {
      const questions = getAI_Training_Questionnaire_Types(
        industry,
        subCategory
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
    subCategory?: BusinessSubCategory
  ) {
    try {
      const questionsWithDefaults = getQuestionsWithSmartDefaults(
        industry,
        subCategory
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
        "Error getting training questions with defaults"
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
        training.subCategory as BusinessSubCategory
      );

      const phaseSummary = getPhaseSummary(
        training.industry as BusinessIndustries,
        training.subCategory as BusinessSubCategory
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
      logger.error({ error, businessId, phase }, "Error getting questions by phase");
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
   */
  static async getTrainingState(businessId: string) {
    try {
      // Check if business exists
      const businessAgent = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!businessAgent) {
        throw new Error(`No AI agent found for business ID: ${businessId}`);
      }

      // Check if training exists
      let training = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      // If no training exists, initialize it
      if (!training) {
        const industry = businessAgent.category as BusinessIndustries;
        const subCategory = businessAgent.subCategories?.[0] as BusinessSubCategory | undefined;

        // Get questions for basic phase
        const basicQuestions = getQuestionsByPhaseUtil(
          industry,
          TrainingPhase.BASIC,
          subCategory
        );

        const phaseSummary = getPhaseSummary(industry, subCategory);

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
        const filteredQuestions = basicQuestions.filter((q) => !responseMap.has(q.id));

        // Calculate phase progress
        const basicPhaseInfo = phaseSummary.find((p) => p.phase === TrainingPhase.BASIC);
        const standardPhaseInfo = phaseSummary.find((p) => p.phase === TrainingPhase.STANDARD);
        const advancedPhaseInfo = phaseSummary.find((p) => p.phase === TrainingPhase.ADVANCED);

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
            totalQuestions: filteredQuestions.length,
            answeredQuestions: prefilledResponses.length,
            requiredQuestions: filteredQuestions.filter((q) => q.required).length,
            completionPercentage: Math.round(
              (prefilledResponses.length / filteredQuestions.length) * 100
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
        training.subCategory as BusinessSubCategory
      );

      // Create response map for quick lookup
      const responseMap = new Map(
        training.responses.map((r) => [r.questionId, r])
      );

      // Check if current phase is completed and advance to next phase if needed
      let phaseChanged = false;
      const currentPhaseQuestions = getQuestionsByPhaseUtil(
        training.industry as BusinessIndustries,
        training.currentPhase as TrainingPhase,
        training.subCategory as BusinessSubCategory
      );

      // Count answered questions in current phase
      const currentPhaseAnswered = currentPhaseQuestions.filter((q) =>
        responseMap.has(q.id)
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
        if (nextPhase && !training.completedPhases.includes(training.currentPhase as any)) {
          training.completedPhases.push(training.currentPhase as any);
          training.currentPhase = nextPhase;
          phaseChanged = true;
          await training.save();

          logger.info(
            { businessId, oldPhase: training.completedPhases[training.completedPhases.length - 1], newPhase: nextPhase },
            "Advanced to next phase"
          );
        }
      }

      // Get questions for the (potentially updated) current phase
      const activePhaseQuestions = getQuestionsByPhaseUtil(
        training.industry as BusinessIndustries,
        training.currentPhase as TrainingPhase,
        training.subCategory as BusinessSubCategory
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
      const answeredCount = questionsWithStatus.filter((q) => q.isAnswered).length;
      const remainingCount = questionsWithStatus.filter((q) => !q.isAnswered).length;

      return {
        trainingStatus: training.trainingStatus,
        currentPhase: training.currentPhase,
        completedPhases: training.completedPhases,
        totalPhases: 3,
        phaseSummary,
        phaseAdvanced: phaseChanged,
        currentPhaseData: {
          phase: training.currentPhase,
          totalQuestions: activePhaseQuestions.length,
          answeredCount,
          remainingCount,
          questions: questionsWithStatus,
        },
        metadata: training.metadata,
        completedAt: training.completedAt,
      };
    } catch (error: any) {
      logger.error({ error, businessId }, "Error getting training state");
      throw error;
    }
  }
}
