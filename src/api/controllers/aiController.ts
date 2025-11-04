import { Request, Response } from "express";
import mongoose from "mongoose";
import { AIService } from "../services/ai.service";
import { logger } from "../../utils/logger";

export class AIController {
  /**
   * POST /ai/create-agent
   * Creates a new AI agent for a business
   */
  async createAgent(req: Request, res: Response) {
    try {
      const business = req.body;
      console.log("Received createAgent request with body:", business);
      console.log("Received createAgent request with body:", business.id);

      // Validate required fields
      if (!business || !business.name) {
        return res.status(400).json({
          success: false,
          error: "Business name is required",
        });
      }
      if (business.website && !/^https?:\/\/.+\..+/.test(business.website)) {
        return res.status(400).json({
          success: false,
          error: "Invalid website URL format",
        });
      }
      if (
        business.tone &&
        !["professional", "casual", "friendly"].includes(business.tone)
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid tone. Allowed values are: professional, casual, friendly.",
        });
      }
      if (business.category && typeof business.category !== "string") {
        return res.status(400).json({
          success: false,
          error: "Category must be a string",
        });
      }
      if (!business.id) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      // Validate business ID format
      if (!mongoose.Types.ObjectId.isValid(business.id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format. Must be a valid MongoDB ObjectId",
        });
      }
      // if (business.id) {
      //   const existingAgent = await AIService.getAgentByBusinessId(business.id);
      //   if (existingAgent) {
      //     return res.status(400).json({
      //       success: false,
      //       error: "An agent for this business already exists",
      //     });
      //   }
      // } else {
      const result = await AIService.createAgentForBusiness(business);
      logger.info({ result }, "Created business agent");

      return res.status(201).json({ success: true, data: result });
      // }
    } catch (error: any) {
      logger.error({ error }, "Error creating AI agent");

      // Handle validation errors
      if (
        error.message?.includes("invalid") ||
        error.message?.includes("required")
      ) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to create AI agent",
      });
    }
  }

  /**
   * PUT /ai/update-agent/:agentId
   * Updates an existing AI agent's configuration
   */
  async updateAgent(req: Request, res: Response) {
    try {
      const { agentId } = req.params;
      const updates = req.body;

      // Validate agentId
      if (!agentId) {
        return res.status(400).json({
          success: false,
          error: "Agent ID is required",
        });
      }

      const result = await AIService.updateAgent(agentId, updates);

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error(
        { error, agentId: req.params.agentId },
        "Error updating AI agent"
      );

      // Handle not found errors
      if (
        error.message?.includes("not found") ||
        error.message?.includes("No AI agent")
      ) {
        return res.status(404).json({ success: false, error: error.message });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to update AI agent",
      });
    }
  }

  /**
   * POST /ai/chat
   * Chats with an AI agent by assistant ID
   */
  async chatWithAgent(req: Request, res: Response) {
    try {
      const { agentId, message } = req.body;

      // Validate input
      if (!agentId) {
        return res.status(400).json({
          success: false,
          error: "Agent ID is required",
        });
      }

      if (!message) {
        return res.status(400).json({
          success: false,
          error: "Message is required",
        });
      }

      const reply = await AIService.chatWithAgent(agentId, message.stringify());

      return res.status(200).json({ success: true, data: { reply } });
    } catch (error: any) {
      logger.error(
        { error, agentId: req.body.agentId },
        "Error chatting with AI agent"
      );

      // Handle not found errors
      if (
        error.message?.includes("not found") ||
        error.message?.includes("not initialized")
      ) {
        return res.status(404).json({ success: false, error: error.message });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to chat with AI agent",
      });
    }
  }

  /**
   * POST /ai/ask-business
   * Asks the AI assistant for a specific business using businessId
   */
  async askBusinessAssistant(req: Request, res: Response) {
    try {
      const { businessId, message } = req.body;

      // Validate businessId
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      // Validate businessId format
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format. Must be a valid MongoDB ObjectId",
        });
      }

      // Validate message
      if (!message) {
        return res.status(400).json({
          success: false,
          error: "Message is required",
        });
      }

      const result = await AIService.askBusinessAssistant(businessId, message);

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error(
        { error, businessId: req.body.businessId },
        "Error asking business assistant"
      );

      // Handle not found errors
      if (
        error.message?.includes("not found") ||
        error.message?.includes("not initialized") ||
        error.message?.includes("No AI agent")
      ) {
        return res.status(404).json({
          success: false,
          error: `No AI assistant found for business ID: ${req.body.businessId}. Please create an agent first.`,
        });
      }

      return res.status(500).json({
        success: false,
        error:
          error.message || "Failed to get response from business assistant",
      });
    }
  }

  /**
   * GET /ai/business/:businessId
   * Gets the AI agent configuration for a business
   */
  async getBusinessAgent(req: Request, res: Response) {
    try {
      const { businessId } = req.params;

      // Validate businessId
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      // Validate businessId format
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format. Must be a valid MongoDB ObjectId",
        });
      }

      const result = await AIService.getBusinessAIAgent(businessId);

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error(
        { error, businessId: req.params.businessId },
        "Error getting business agent"
      );

      // Handle not found errors
      if (
        error.message?.includes("not found") ||
        error.message?.includes("No AI agent")
      ) {
        return res.status(404).json({
          success: false,
          error: `No AI agent found for business ID: ${req.params.businessId}`,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get business AI agent",
      });
    }
  }
}

const controller = new AIController();
export const aiController = {
  createAgent: controller.createAgent.bind(controller),
  updateAgent: controller.updateAgent.bind(controller),
  chatWithAgent: controller.chatWithAgent.bind(controller),
  askBusinessAssistant: controller.askBusinessAssistant.bind(controller),
  getBusinessAgent: controller.getBusinessAgent.bind(controller),
};
