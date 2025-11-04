import OpenAI from "openai";
import fs from "node:fs";
import mongoose from "mongoose";
import { toFile } from "openai/uploads";
import { BusinessAIAssistantModel } from "../../models/businessAIAssistant.model.js";
import { logger } from "../../utils/logger.js";
import { getS3ObjectStream } from "../../utils/s3.js";

// ===========================
// Types & Constants
// ===========================

export type Business = {
  businessName: string;
  businessId: string;
  name: string;
  industry: string;
  website?: string;
  tone: string;
  description?: string;
  tags: string[];
  categories: string[];
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_INSTRUCTIONS = `
You are the AI for the PinnTag Business app. You MUST restrict all discussions to app-relevant topics:
- Creating/managing offers, events, promotions
- Business onboarding, locations, schedules, pricing in-app
- App how-to, account/billing (PinnTag), analytics, notifications
- Integrations specifically related to PinnTag (Stripe/IAP status, etc.)

Hard refusals (do NOT answer; give a short refusal + suggest an allowed topic):
- Politics, news, elections, government policy
- Religion, ideology debates, adult content
- Personal legal/medical/financial advice unrelated to app usage
- Anything not directly about PinnTag or the business’s use of it

Refusal style:
- 1 concise sentence: "I can't help with that here. I can help you with [allowed areas]."
- Never provide partial answers to disallowed topics.
`;

// ===========================
// Helper Functions
// ===========================

/**
 * Routes tool calls from the OpenAI assistant to appropriate backend services
 */
async function toolRouter(toolCall: any): Promise<string> {
  switch (toolCall.function.name) {
    case "getActiveOffers": {
      const { businessId, limit } = JSON.parse(
        toolCall.function.arguments || "{}"
      );
      const offers = await fetch(
        `${process.env.BACKEND_URL}/offers?businessId=${businessId}&limit=${
          limit ?? 5
        }`
      ).then((r) => r.json());
      return JSON.stringify(offers);
    }
    case "createEventDraft": {
      const { businessId, title, date } = JSON.parse(
        toolCall.function.arguments || "{}"
      );
      const result = await fetch(`${process.env.BACKEND_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, title, date }),
      }).then((r) => r.json());
      return JSON.stringify(result);
    }
    default:
      return "{}";
  }
}

/**
 * Polls an OpenAI assistant run until completion, handling tool calls
 */
async function pollRunUntilComplete(
  threadId: string,
  runId: string
): Promise<void> {
  while (true) {
    const run = await openai.beta.threads.runs.retrieve(runId, {
      thread_id: threadId,
    });

    if (
      run.status === "requires_action" &&
      run.required_action?.submit_tool_outputs?.tool_calls
    ) {
      const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
      const outputs = await Promise.all(
        toolCalls.map(async (tc) => ({
          tool_call_id: tc.id,
          output: await toolRouter(tc),
        }))
      );

      await openai.beta.threads.runs.submitToolOutputs(runId, {
        thread_id: threadId,
        tool_outputs: outputs,
      });
    } else if (run.status === "completed") {
      break;
    } else if (["failed", "cancelled", "expired"].includes(run.status)) {
      throw new Error(`Run ended with status: ${run.status}`);
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
  }
}

// ===========================
// Core Service Functions
// ===========================

/**
 * Creates a new AI assistant for a business with vector store
 */
async function createBusinessAgent(biz: Business) {
  try {
    console.log("Creating business agent for (in service):", biz);
    if (!biz.businessId) {
      return Error("Business ID is required to create an agent.");
    }
    if (!mongoose.Types.ObjectId.isValid(biz.businessId)) {
      return Error("Business ID must be a valid ObjectId string.");
    }

    // Basic input validation to fail fast with clear message
    if (!biz || !biz.businessId || !biz.name) {
      const msg = `Invalid business payload: ${JSON.stringify(biz)}`;
      logger.error(msg);
      throw new Error(msg);
    }
    const vectorStore = await openai.vectorStores.create({
      name: `${biz.name} Knowledge`,
    });

    // 2) Create the assistant with biz-specific instructions + tools
    let assistant;
    assistant = await openai.beta.assistants.create({
      name: `${biz.name}`,
      model: "gpt-4o", // or gpt-4.1 / gpt-4o-mini depending on cost/latency
      instructions: [
        `You are the AI agent for ${biz.name}.`,
        `Your knowledge is based on the following information about the business:`,
        `Name: ${biz.name}`,
        `Description: ${biz.description}`,
        `Tags: ${biz.tags.join(", ")}`,
        `Categories: ${biz.categories.join(", ")}`,
        `Primary goal: help the business engage customers with relevant events/offers and fast answers.`,
        `Tone: ${biz.tone ?? "professional, warm, succinct"}.`,
        `If you don't know, say so briefly and ask for missing info.`,
        `Use the provided tools to fetch live data from the business backend when relevant.`,
        `${ASSISTANT_INSTRUCTIONS}`,
      ].join("\n"),
      tools: [
        // A function tool that lets the agent call your backend (examples)
        // {
        //   type: "function",
        //   function: {
        //     name: "getActiveOffers",
        //     description: "Fetch current offers for this business",
        //     parameters: {
        //       type: "object",
        //       properties: {
        //         businessId: { type: "string" },
        //         limit: { type: "number" },
        //       },
        //       required: ["businessId"],
        //     },
        //   },
        // },
        // {
        //   type: "function",
        //   function: {
        //     name: "createEventDraft",
        //     description: "Create an event draft in the business system",
        //     parameters: {
        //       type: "object",
        //       properties: {
        //         businessId: { type: "string" },
        //         title: { type: "string" },
        //         date: { type: "string", description: "ISO 8601 date" },
        //       },
        //       required: ["businessId", "title", "date"],
        //     },
        //   },
        // },
      ],
      // Connect the vector store for retrieval (you can attach later too)
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id],
        },
      },
    });

    const thread = await openai.beta.threads.create();

    // 3) Persist ids for future use
    await BusinessAIAssistantModel.create({
      businessId: new mongoose.Types.ObjectId(biz.businessId),
      assistantId: assistant.id,
      vectorStoreId: vectorStore.id,
      businessName: biz.businessName,
      name: biz.name,
      description: biz.description,
      tags: biz.tags,
      categories: biz.categories,
      tone: biz.tone,
      industry: biz.industry,
      website: biz.website,
      threadId: thread.id,
    });

    return { assistantId: assistant.id, vectorStoreId: vectorStore.id };
  } catch (err: any) {
    // If the OpenAI SDK throws an HTTP error, try to extract status/body
    logger.error(
      {
        message: err?.message,
        status: err?.status || err?.response?.status,
        body: err?.response?.data || err?.response?.body || err?.body,
        stack: err?.stack,
      },
      "OpenAI assistant.create failed"
    );
    // rethrow a clearer error for upstream logging / client
    const re = new Error(
      `OpenAI assistant creation failed${
        err?.status ? ` (status ${err.status})` : ""
      }: ${err?.message ?? "unknown"}`
    ) as Error & { cause: any };
    re.cause = err;
    throw re;
  }
}

export async function addFilesToBusinessVectorStore(
  vectorStoreId: string,
  localPaths: string[]
) {
  const fileStreams = localPaths.map((p) => fs.createReadStream(p));
  const batch = await openai.vectorStores.fileBatches.uploadAndPoll(
    vectorStoreId,
    { files: fileStreams }
  );
  return batch.status; // "completed" when done
}

export async function addS3FilesToVectorStore(
  vectorStoreId: string,
  s3Keys: string[]
) {
  const files = await Promise.all(
    s3Keys.map(async (key) => {
      const stream = await getS3ObjectStream(key);
      // Give a clean filename to toFile for better provenance
      const filename = key.split("/").pop() || "doc";
      return toFile(stream as any, filename);
    })
  );

  const batch = await openai.vectorStores.fileBatches.uploadAndPoll(
    vectorStoreId,
    { files }
  );

  if (batch.status !== "completed") {
    throw new Error(`Indexing did not complete: ${batch.status}`);
  }
  return batch.file_counts ?? 0;
}

/**
 * Retrieves the assistant for a business by ID
 */
async function getBusinessAssistant(businessId: string) {
  const businessAI = await BusinessAIAssistantModel.findOne({
    businessId: new mongoose.Types.ObjectId(businessId),
  });
  if (!businessAI?.assistantId) {
    throw new Error("Business assistant not initialized");
  }
  return businessAI;
}

/**
 * Creates a thread and chats with the business assistant
 */
async function chatWithAssistant(
  assistantId: string,
  userMessage: string,
  includeTopicReminder: boolean = false
): Promise<{ threadId: string; text: string }> {
  // Create a new thread
  const thread = await openai.beta.threads.create();

  // Optional: reinforce topic restriction at run-time
  if (includeTopicReminder) {
    await openai.beta.threads.messages.create(thread.id, {
      role: "assistant",
      content: "Reminder: Only app-relevant questions will be answered.",
    });
  }

  // Add user message
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: userMessage,
  });

  // Create and run the assistant
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId,
  });

  // Poll until complete
  await pollRunUntilComplete(thread.id, run.id);

  // Retrieve assistant's response
  const messages = await openai.beta.threads.messages.list(thread.id, {
    limit: 10,
  });
  const last = messages.data.find((m) => m.role === "assistant");
  const text =
    last?.content
      ?.map((c) => (c.type === "text" ? c.text.value : ""))
      .join("\n") ?? "";

  return { threadId: thread.id, text };
}

// ===========================
// Exported Service Class
// ===========================

/**
 * AI Service for managing business assistants and interactions
 */
export class AIService {
  /**
   * Creates a new AI agent for a business
   */
  static async createAgentForBusiness(business: Business) {
    try {
      // Validate business has an ID
      // if (!business.id) {
      //   business.id = `biz_${Math.random().toString(36).substring(2, 10)}`;
      // }

      const result = await createBusinessAgent(business);
      logger.info({ result }, "Created business agent");
      return result;
    } catch (error: any) {
      logger.error("Error creating business agent:", error);
      throw error;
    }
  }

  /**
   * Updates an existing AI agent's configuration
   */
  static async updateAgent(agentId: string, updates: Partial<Business>) {
    try {
      const updatedInstructions = [
        `You are the AI agent for ${updates.name ?? "the business"}.`,
        `Primary goal: help the business engage customers with relevant events/offers and fast answers.`,
        `Tone: ${updates.tone ?? "professional, warm, succinct"}.`,
        `If you don't know, say so briefly and ask for missing info.`,
        `Use the provided tools to fetch live data from the business backend when relevant.`,
        `${ASSISTANT_INSTRUCTIONS}`,
      ].join("\n");

      const updatedAssistant = await openai.beta.assistants.update(agentId, {
        name: updates.name ? `${updates.name}` : undefined,
        instructions: updatedInstructions,
      });

      return updatedAssistant;
    } catch (error: any) {
      logger.error("Error updating business agent:", error);
      throw error;
    }
  }

  /**
   * Chats with a business agent by assistant ID
   */
  static async chatWithAgent(assistantId: string, message: string) {
    try {
      const response = await chatWithAssistant(assistantId, message, false);
      return response.text;
    } catch (error: any) {
      logger.error("Error chatting with business agent:", error);
      throw error;
    }
  }

  /**
   * Chats with a business assistant by business ID
   */
  static async askBusinessAssistant(businessId: string, userMessage: string) {
    try {
      const biz = await getBusinessAssistant(businessId);
      const response = await chatWithAssistant(
        biz.assistantId!,
        userMessage,
        true
      );
      return response;
    } catch (error: any) {
      logger.error("Error asking business assistant:", error);
      throw error;
    }
  }

  /**
   * Retrieves the AI agent configuration for a business
   */
  static async getBusinessAIAgent(businessId: string) {
    try {
      const businessAI = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });
      if (!businessAI) {
        throw new Error(`No AI agent found for businessId: ${businessId}`);
      }
      return businessAI;
    } catch (error: any) {
      logger.error("Error getting business AI agent:", error);
      throw error;
    }
  }

  /**
   * Adds local files to a business's vector store
   */
  static async addFilesToVectorStore(
    vectorStoreId: string,
    localPaths: string[]
  ) {
    try {
      return await addFilesToBusinessVectorStore(vectorStoreId, localPaths);
    } catch (error: any) {
      logger.error("Error adding files to vector store:", error);
      throw error;
    }
  }

  /**
   * Adds S3 files to a business's vector store
   */
  static async addS3FilesToVectorStore(
    vectorStoreId: string,
    s3Keys: string[]
  ) {
    try {
      return await addS3FilesToVectorStore(vectorStoreId, s3Keys);
    } catch (error: any) {
      logger.error("Error adding S3 files to vector store:", error);
      throw error;
    }
  }

  /**
   * Retrieves an AI agent by business ID
   */
  static async getAgentByBusinessId(businessId: string) {
    try {
      const businessAI = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });
      return businessAI;
    } catch (error: any) {
      logger.error("Error getting agent by business ID:", error);
      throw error;
    }
  }
}
