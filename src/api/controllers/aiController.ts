import { Request, Response } from "express";
import mongoose from "mongoose";
import { AIService } from "../services/ai.service.js";
import { logger } from "../../utils/logger.js";
import { BusinessAIAssistantModel } from "../../models/businessAIAssistant.model.js";

/**
 * Normalizes website URL by adding https:// if missing
 * Handles URLs with www, .com, .org, .in, etc.
 */
function normalizeWebsiteUrl(website: string): string {
  if (!website) return website;

  const trimmed = website.trim();

  // If already has protocol, return as is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // If it looks like a domain (has www or a TLD like .com, .org, etc.)
  if (/^(www\.|\w+\.\w+)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export class AIController {
  /**
   * POST /ai/create-agent
   * Creates a new AI agent for a business
   */
  async createAgent(req: Request, res: Response) {
    try {
      const business = req.body;
      console.log("Received createAgent request with body:", business);

      // Validate required fields
      if (!business || !business.name) {
        return res.status(400).json({
          success: false,
          error: "Business name is required",
        });
      }
      if (!business.businessName) {
        return res.status(400).json({
          success: false,
          error: "Business name is required",
        });
      }

      // Normalize website URL if provided
      if (business.website) {
        business.website = normalizeWebsiteUrl(business.website);

        // Validate website format after normalization
        if (!/^https?:\/\/.+\..+/.test(business.website)) {
          return res.status(400).json({
            success: false,
            error: "Invalid website URL format",
          });
        }
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
      if (business.subCategories && !Array.isArray(business.subCategories)) {
        return res.status(400).json({
          success: false,
          error: "SubCategories must be an array of strings",
        });
      }
      if (!business.businessId) {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      const checkDuplicateBusiness = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(business.businessId),
      });
      if (checkDuplicateBusiness) {
        return res.status(400).json({
          success: false,
          error: "An AI agent for this Business ID already exists.",
        });
      }
      // Validate business ID format
      if (!mongoose.Types.ObjectId.isValid(business.businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Business ID format. Must be a valid MongoDB ObjectId",
        });
      }
      if (
        !business.subCategories ||
        !Array.isArray(business.subCategories) ||
        business.subCategories.length === 0
      ) {
        return res.status(400).json({
          success: false,
          error: "SubCategories are required",
        });
      }
      // if (
      //   !business.tags ||
      //   !Array.isArray(business.tags) ||
      //   business.tags.length === 0
      // ) {
      //   return res.status(400).json({
      //     success: false,
      //     error: "Tags are required",
      //   });
      // }
      const result = await AIService.createAgentForBusiness(business);
      logger.info({ result }, "Created business agent");

      return res.status(201).json({
        success: true,
        data: result,
        message: "AI agent created successfully",
      });
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
      const { businessId } = req.params;
      const updates = req.body;

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
          error: "Invalid Business ID format. Must be a valid MongoDB ObjectId",
        });
      }
      const existingAgent = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });
      if (!existingAgent) {
        return res.status(404).json({
          success: false,
          error: "No AI agent found for this Business ID",
        });
      }
      if (!updates || typeof updates !== "object") {
        return res.status(400).json({
          success: false,
          error: "Updates must be an object",
        });
      }

      // Normalize website URL if provided
      if (updates.website) {
        updates.website = normalizeWebsiteUrl(updates.website);

        // Validate website format after normalization
        if (!/^https?:\/\/.+\..+/.test(updates.website)) {
          return res.status(400).json({
            success: false,
            error: "Invalid website URL format",
          });
        }
      }
      if (
        updates.tone &&
        !["professional", "casual", "friendly"].includes(updates.tone)
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid tone. Allowed values are: professional, casual, friendly.",
        });
      }
      if (updates.name && typeof updates.name !== "string") {
        return res.status(400).json({
          success: false,
          error: "Name must be a string",
        });
      }
      if (updates.category && typeof updates.category !== "string") {
        return res.status(400).json({
          success: false,
          error: "Category must be a string",
        });
      }
      if (updates.subCategories && !Array.isArray(updates.subCategories)) {
        return res.status(400).json({
          success: false,
          error: "SubCategories must be an array of strings",
        });
      }
      if (updates.category && typeof updates.category !== "string") {
        return res.status(400).json({
          success: false,
          error: "Category must be a string",
        });
      }
      if (updates.subCategories && !Array.isArray(updates.subCategories)) {
        return res.status(400).json({
          success: false,
          error: "SubCategories must be an array of strings",
        });
      }
      if (updates.category && typeof updates.category !== "string") {
        return res.status(400).json({
          success: false,
          error: "Category must be a string",
        });
      }
      if (updates.tags && !Array.isArray(updates.tags)) {
        return res.status(400).json({
          success: false,
          error: "Tags must be an array of strings",
        });
      }

      const result = await AIService.updateAgent(businessId, updates);

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error(
        { error, businessId: req.params.businessId },
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

  async trainYourAgent(req: Request, res: Response) {
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
          error: "Invalid Business ID format. Must be a valid MongoDB ObjectId",
        });
      }

      const result = await AIService.trainYourAgent(businessId);

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error(
        { error, businessId: req.body.businessId },
        "Error training AI agent"
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
        error: error.message || "Failed to train AI agent",
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

      return res.status(200).json({
        success: true,
        data: result,
        message: "Business agent retrieved successfully",
      });
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

  /**
   * GET /ai/generate-tags/:businessId
   * Generates relevant tags based on business data from database
   */
  async generateTags(req: Request, res: Response) {
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

      const tags = await AIService.generateTagsForBusiness(businessId);

      logger.info(
        { businessId, tagsCount: tags.length },
        "Generated tags for business"
      );

      return res.status(200).json({
        success: true,
        data: { tags },
        message: "Tags generated successfully",
      });
    } catch (error: any) {
      logger.error(
        { error, businessId: req.params.businessId },
        "Error generating tags"
      );

      // Handle not found errors
      if (
        error.message?.includes("not found") ||
        error.message?.includes("No AI agent")
      ) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to generate tags",
      });
    }
  }

  /**
   * GET /ai/generate-description/:businessId
   * Generates an AI description based on business data from database
   */
  async generateDescription(req: Request, res: Response) {
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

      const description = await AIService.generateDescriptionForBusiness(
        businessId
      );

      logger.info({ businessId }, "Generated description for business");

      return res.status(200).json({
        success: true,
        data: { description },
        message: "Description generated successfully",
      });
    } catch (error: any) {
      logger.error(
        { error, businessId: req.params.businessId },
        "Error generating description"
      );

      // Handle not found errors
      if (
        error.message?.includes("not found") ||
        error.message?.includes("No AI agent")
      ) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      // Handle missing tags error
      if (error.message?.includes("Tags are required")) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || "Failed to generate description",
      });
    }
  }
}

const controller = new AIController();
export const aiController = {
  createAgent: controller.createAgent.bind(controller),
  updateAgent: controller.updateAgent.bind(controller),
  trainYourAgent: controller.trainYourAgent.bind(controller),
  chatWithAgent: controller.chatWithAgent.bind(controller),
  askBusinessAssistant: controller.askBusinessAssistant.bind(controller),
  getBusinessAgent: controller.getBusinessAgent.bind(controller),
  generateDescription: controller.generateDescription.bind(controller),
  generateTags: controller.generateTags.bind(controller),
};
