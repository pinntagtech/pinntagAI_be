import { Router } from "express";
import { internalApiKeyGuard } from "../../middleware/auth";

export const aiRouter = Router();

// Expose AI features to Pinntag backend only
aiRouter.use(internalApiKeyGuard);

/**
 * POST /ai/generate
 * Body: { prompt: string, context?: object }
 * TODO: wire to your LLM provider / internal inference service.
 */
aiRouter.post("/generate", async (req, res) => {
  const { prompt, context } = req.body || {};
  if (!prompt)
    return res
      .status(400)
      .json({ success: false, error: "prompt is required" });

  // TODO: replace with real LLM call (OpenAI, local, or your AI microservice)
  const mock = {
    prompt,
    context: context ?? null,
    output: `This is a stub response for: ${prompt.slice(0, 64)}...`,
  };

  res.json({ success: true, data: mock });
});
