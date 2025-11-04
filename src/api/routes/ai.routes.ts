import { Router } from "express";
import { internalApiKeyGuard } from "../../middleware/auth.js";
import { aiController } from "../controllers/aiController.js";

export const aiRouter = Router();

// Expose AI features to Pinntag backend only
aiRouter.use(internalApiKeyGuard);

/**
 * POST /ai/create-agent
 * Body: { id?: string, name: string, category?: string, website?: string, tone?: string }
 * Creates a new AI agent for a business
 */
aiRouter.post("/create-agent", aiController.createAgent);

/**
 * PUT /ai/update-agent/:agentId
 * Body: { name?: string, category?: string, website?: string, tone?: string }
 * Updates an existing AI agent's configuration
 */
aiRouter.put("/update-agent/:agentId", aiController.updateAgent);

/**
 * POST /ai/chat
 * Body: { agentId: string, message: string }
 * Chats with an AI agent using the assistant ID
 */
aiRouter.post("/chat", aiController.chatWithAgent);

/**
 * POST /ai/ask-business
 * Body: { businessId: string, message: string }
 * Asks the AI assistant for a specific business using the business ID
 */
aiRouter.post("/ask-business", aiController.askBusinessAssistant);

/**
 * GET /ai/business/:businessId
 * Gets the AI agent configuration for a business
 */
aiRouter.get("/business/:businessId", aiController.getBusinessAgent);

export { aiRouter as aiRoutes };
