import { Router } from "express";
import { internalApiKeyGuard } from "../../middleware/auth.js";
import { aiTrainingController } from "../controllers/aiTrainingController.js";

export const aiTrainingRouter = Router();

// Expose AI Training features to Pinntag backend only
aiTrainingRouter.use(internalApiKeyGuard);

/**
 * GET /ai/training/state/:businessId?phase=basic|standard|advanced&allQuestions=true
 * Params: businessId
 * Query: phase (optional) - Returns questions from specific phase instead of current phase
 *        allQuestions (optional) - If "true", returns all questions from all phases in a flat array
 * Gets comprehensive training state (current phase, answered/remaining questions, progress)
 * This is the primary API for getting all training information
 */
aiTrainingRouter.get("/state/:businessId", aiTrainingController.getTrainingState);

/**
 * GET /ai/training/initialize/:businessId
 * Params: businessId
 * Initializes training for a business (fetches industry/subCategory from business_AI_assistant)
 */
aiTrainingRouter.get("/initialize/:businessId", aiTrainingController.initializeTraining);

/**
 * POST /ai/training/submit
 * Body: { businessId: string, responses: Array<{ questionId: string, answer: any }> }
 * Submits training responses for a business
 */
aiTrainingRouter.post("/submit", aiTrainingController.submitResponses);

/**
 * GET /ai/training/complete/:businessId
 * Params: businessId
 * Completes training and updates the AI assistant with enhanced instructions
 */
aiTrainingRouter.get("/complete/:businessId", aiTrainingController.completeTraining);

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
 * GET /ai/training/questions-by-phase/:businessId
 * Params: businessId
 * Query: phase (required - basic, standard, advanced)
 * Gets training questions by phase for a business
 */
aiTrainingRouter.get("/questions-by-phase/:businessId", aiTrainingController.getQuestionsByPhase);

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

/**
 * PUT /ai/training/update/:businessId
 * Params: businessId
 * Body: { industry?, subCategory?, businessName?, description?, tone?, tags? }
 * Updates AI training configuration. If industry changes, resets training with new questions.
 */
aiTrainingRouter.put("/update/:businessId", aiTrainingController.updateTraining);

/**
 * POST /ai/training/google-places/:businessId
 * Params: businessId
 * Body: Google Places API response data
 * Updates Google Places data for a business (operating hours, photos, rating, etc.)
 */
aiTrainingRouter.post("/google-places/:businessId", aiTrainingController.updateGooglePlacesData);

export { aiTrainingRouter as aiTrainingRoutes };
