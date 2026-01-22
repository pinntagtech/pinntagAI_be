import { Request, Response } from "express";
import mongoose from "mongoose";
import { AITrainingService } from "../services/aiTraining.service.js";
import { logger } from "../../utils/logger.js";
import {
  BusinessIndustries,
  BusinessSubCategory,
  TrainingPhase,
} from "../../utils/AI_Training_questionnaire.js";

export class AITrainingController {
  /**
   * GET /ai/training/initialize/:businessId
   * Initializes training for a business
   * Params: businessId
   * Fetches industry and subCategory from business_AI_assistant
   */
  async initializeTraining(req: Request, res: Response) {
    try {
      const { businessId } = req.params;

      // Validate businessId
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format",
        });
      }

      const result = await AITrainingService.initializeTraining(businessId);

      return res.status(201).json({
        success: true,
        data: result.training,
        questions: result.questions,
        phaseSummary: result.phaseSummary,
        message: "Training initialized successfully",
      });
    } catch (error: any) {
      logger.error(
        {
          error: {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
            ...error,
          },
          businessId: req.params?.businessId,
        },
        "Error initializing training",
      );

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to initialize training",
      });
    }
  }

  /**
   * POST /ai/training/submit
   * Submits training responses
   * Body: { businessId: string, responses: Array<{ questionId: string, answer: any }> }
   */
  async submitResponses(req: Request, res: Response) {
    try {
      const { businessId, responses } = req.body;

      // Validate businessId
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format",
        });
      }

      // Validate responses
      if (!responses || !Array.isArray(responses) || responses.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Responses must be a non-empty array",
        });
      }

      // Validate each response
      for (const response of responses) {
        if (!response.questionId || response.answer === undefined) {
          return res.status(400).json({
            success: false,
            error: "Each response must have questionId and answer",
          });
        }
      }

      const result = await AITrainingService.submitTrainingResponses(
        businessId,
        responses,
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: "Responses submitted successfully",
      });
    } catch (error: any) {
      logger.error({ error }, "Error submitting responses");

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to submit responses",
      });
    }
  }

  /**
   * GET /ai/training/complete/:businessId
   * Completes training and updates AI assistant
   * Params: businessId
   */
  async completeTraining(req: Request, res: Response) {
    try {
      const { businessId } = req.params;

      // Validate businessId
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format",
        });
      }

      const result = await AITrainingService.completeTraining(businessId);

      return res.status(200).json({
        success: true,
        data: result,
        message: "Training completed successfully",
      });
    } catch (error: any) {
      logger.error({ error }, "Error completing training");

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      if (
        error.message?.includes("incomplete") ||
        error.message?.includes("Missing")
      ) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to complete training",
      });
    }
  }

  /**
   * GET /ai/training/status/:businessId
   * Gets training status for a business
   */
  async getTrainingStatus(req: Request, res: Response) {
    try {
      const { businessId } = req.params;

      // Validate businessId
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format",
        });
      }

      const result = await AITrainingService.getTrainingStatus(businessId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: "Training status not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error({ error }, "Error getting training status");

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get training status",
      });
    }
  }

  /**
   * GET /ai/training/questions
   * Gets training questions for an industry
   * Query: industry, subCategory (optional)
   */
  async getTrainingQuestions(req: Request, res: Response) {
    try {
      const { industry, subCategory } = req.query;

      // Validate industry
      if (!industry) {
        return res.status(400).json({
          success: false,
          error: "Industry query parameter is required",
        });
      }

      if (
        !Object.values(BusinessIndustries).includes(
          industry as BusinessIndustries,
        )
      ) {
        return res.status(400).json({
          success: false,
          error: `Invalid industry. Must be one of: ${Object.values(
            BusinessIndustries,
          ).join(", ")}`,
        });
      }

      // Validate subCategory if provided
      if (
        subCategory &&
        !Object.values(BusinessSubCategory).includes(
          subCategory as BusinessSubCategory,
        )
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid sub-category",
        });
      }

      const result = await AITrainingService.getTrainingQuestions(
        industry as BusinessIndustries,
        subCategory as BusinessSubCategory,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error({ error }, "Error getting training questions");

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get training questions",
      });
    }
  }

  /**
   * GET /ai/training/questions-by-phase/:businessId
   * Gets training questions by phase for a business
   * Params: businessId
   * Query: phase (basic, standard, advanced)
   */
  async getQuestionsByPhase(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { phase } = req.query;

      // Validate businessId
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format",
        });
      }

      // Validate phase
      if (!phase) {
        return res.status(400).json({
          success: false,
          error: "Phase query parameter is required",
        });
      }

      if (!Object.values(TrainingPhase).includes(phase as TrainingPhase)) {
        return res.status(400).json({
          success: false,
          error: `Invalid phase. Must be one of: ${Object.values(
            TrainingPhase,
          ).join(", ")}`,
        });
      }

      const result = await AITrainingService.getQuestionsByPhase(
        businessId,
        phase as TrainingPhase,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(
        { error, businessId: req.params?.businessId },
        "Error getting questions by phase",
      );

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get questions by phase",
      });
    }
  }

  /**
   * GET /ai/training/questions-with-defaults
   * Gets training questions with smart defaults based on business category
   * Query: industry, subCategory (optional)
   */
  async getTrainingQuestionsWithDefaults(req: Request, res: Response) {
    try {
      const { industry, subCategory } = req.query;

      // Validate industry
      if (!industry) {
        return res.status(400).json({
          success: false,
          error: "Industry query parameter is required",
        });
      }

      if (
        !Object.values(BusinessIndustries).includes(
          industry as BusinessIndustries,
        )
      ) {
        return res.status(400).json({
          success: false,
          error: `Invalid industry. Must be one of: ${Object.values(
            BusinessIndustries,
          ).join(", ")}`,
        });
      }

      // Validate subCategory if provided
      if (
        subCategory &&
        !Object.values(BusinessSubCategory).includes(
          subCategory as BusinessSubCategory,
        )
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid sub-category",
        });
      }

      const result = await AITrainingService.getTrainingQuestionsWithDefaults(
        industry as BusinessIndustries,
        subCategory as BusinessSubCategory,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error({ error }, "Error getting training questions with defaults");

      return res.status(500).json({
        success: false,
        error:
          error.message || "Failed to get training questions with defaults",
      });
    }
  }

  /**
   * GET /ai/training/responses/:businessId
   * Gets submitted responses for a business
   */
  async getTrainingResponses(req: Request, res: Response) {
    try {
      const { businessId } = req.params;

      // Validate businessId
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format",
        });
      }

      const result = await AITrainingService.getTrainingResponses(businessId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error({ error }, "Error getting training responses");

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get training responses",
      });
    }
  }

  /**
   * POST /ai/training/reset
   * Resets training for a business
   * Body: { businessId: string }
   */
  async resetTraining(req: Request, res: Response) {
    try {
      const { businessId } = req.body;

      // Validate businessId
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format",
        });
      }

      const result = await AITrainingService.resetTraining(businessId);

      return res.status(200).json({
        success: true,
        data: result,
        message: "Training reset successfully",
      });
    } catch (error: any) {
      logger.error({ error }, "Error resetting training");

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to reset training",
      });
    }
  }

  /**
   * GET /ai/training/state/:businessId?phase=basic|standard|advanced
   * Gets comprehensive training state for a business
   * Query: phase (optional) - If provided, returns questions from this specific phase
   * Returns: current phase, answered/remaining questions, progress across all phases
   */
  async getTrainingState(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { phase } = req.query;

      // Validate businessId
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format",
        });
      }

      // Validate phase if provided
      if (
        phase &&
        !["basic", "standard", "advanced"].includes(phase as string)
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid phase. Must be one of: basic, standard, advanced",
        });
      }

      const result = await AITrainingService.getTrainingState(
        businessId,
        phase as TrainingPhase | undefined,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(
        {
          error: {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
          },
          businessId: req.params?.businessId,
        },
        "Error getting training state",
      );

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get training state",
      });
    }
  }

  /**
   * POST /ai/training/google-places/:businessId
   * Updates Google Places data for a business
   * Params: businessId
   * Body: Google Places API response data
   */
  async updateGooglePlacesData(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const googlePlacesData = req.body;

      // Validate businessId
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format",
        });
      }

      // Validate request body
      if (!googlePlacesData || Object.keys(googlePlacesData).length === 0) {
        return res.status(400).json({
          success: false,
          error: "Google Places data is required in request body",
        });
      }

      const result = await AITrainingService.updateGooglePlacesData(
        businessId,
        googlePlacesData,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(
        {
          error: {
            message: error?.message,
            stack: error?.stack,
          },
          businessId: req.params.businessId,
        },
        "Error updating Google Places data",
      );

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to update Google Places data",
      });
    }
  }
}

const controller = new AITrainingController();
export const aiTrainingController = {
  initializeTraining: controller.initializeTraining.bind(controller),
  submitResponses: controller.submitResponses.bind(controller),
  completeTraining: controller.completeTraining.bind(controller),
  getTrainingStatus: controller.getTrainingStatus.bind(controller),
  getTrainingQuestions: controller.getTrainingQuestions.bind(controller),
  getQuestionsByPhase: controller.getQuestionsByPhase.bind(controller),
  getTrainingQuestionsWithDefaults:
    controller.getTrainingQuestionsWithDefaults.bind(controller),
  getTrainingResponses: controller.getTrainingResponses.bind(controller),
  resetTraining: controller.resetTraining.bind(controller),
  getTrainingState: controller.getTrainingState.bind(controller),
  updateGooglePlacesData: controller.updateGooglePlacesData.bind(controller),
};
