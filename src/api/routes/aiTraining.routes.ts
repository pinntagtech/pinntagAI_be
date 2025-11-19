import { Router } from "express";
import { internalApiKeyGuard } from "../../middleware/auth.js";
import { aiTrainingController } from "../controllers/aiTrainingController.js";

export const aiTrainingRouter = Router();

// Expose AI Training features to Pinntag backend only
aiTrainingRouter.use(internalApiKeyGuard);

/**
 * POST /ai/training/initialize
 * Body: { businessId: string, industry: BusinessIndustries, subCategory?: BusinessSubCategory }
 * Initializes training for a business
 */
aiTrainingRouter.post("/initialize", aiTrainingController.initializeTraining);

/**
 * POST /ai/training/submit
 * Body: { businessId: string, responses: Array<{ questionId: string, answer: any }> }
 * Submits training responses for a business
 */
aiTrainingRouter.post("/submit", aiTrainingController.submitResponses);

/**
 * POST /ai/training/complete
 * Body: { businessId: string }
 * Completes training and updates the AI assistant with enhanced instructions
 */
aiTrainingRouter.post("/complete", aiTrainingController.completeTraining);

/**
 * GET /ai/training/status/:businessId
 * Gets training status for a business
 */
aiTrainingRouter.get("/status/:businessId", aiTrainingController.getTrainingStatus);

/**
 * GET /ai/training/questions
 * Query: industry (required), subCategory (optional)
 * Gets training questions for an industry
 */
aiTrainingRouter.get("/questions", aiTrainingController.getTrainingQuestions);

/**
 * GET /ai/training/questions-with-defaults
 * Query: industry (required), subCategory (optional)
 * Gets training questions with smart defaults based on business category
 * Smart defaults pre-select relevant options for faster questionnaire completion
 */
aiTrainingRouter.get("/questions-with-defaults", aiTrainingController.getTrainingQuestionsWithDefaults);

/**
 * GET /ai/training/responses/:businessId
 * Gets submitted responses for a business
 */
aiTrainingRouter.get("/responses/:businessId", aiTrainingController.getTrainingResponses);

/**
 * POST /ai/training/reset
 * Body: { businessId: string }
 * Resets training for a business (allows re-training)
 */
aiTrainingRouter.post("/reset", aiTrainingController.resetTraining);

export { aiTrainingRouter as aiTrainingRoutes };
