import OpenAI from "openai";
import fs from "node:fs";
import mongoose from "mongoose";
import { toFile } from "openai/uploads";
import {
  BusinessAIAssistantModel,
  IBusiness_AI_Assistant,
} from "../../models/businessAIAssistant.model.js";
import { Tone } from "../../utils/types/types.js";
import { logger } from "../../utils/logger.js";
import {
  BroadcastContentParams,
  OfferContentParams,
  RewardContentParams,
  EventContentParams,
  ImproveContentParams,
  GeneratedContent,
  ContentType,
} from "../../utils/types/aiAssist.types.js";
import {
  checkContentAssistAccess,
  recordFeatureUsage,
} from "../../utils/subscription.utils.js";
import { getS3ObjectStream } from "../../utils/s3.js";
import { UsageTrackingService } from "./usageTracking.service.js";
import { UsageType } from "../../models/aiUsage.model.js";

// ===========================
// Types & Constants
// ===========================

export type Business = {
  businessName: string;
  businessId: string;
  name: string;
  industry: string;
  website?: string;
  tone?: Tone | string;
  description?: string;
  tags: string[];
  subCategories: string[];
  category: string;
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

    // 1) Create a vector store for the business knowledge base
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
        `Description: ${biz.description ?? "Not provided"}`,
        `Tags: ${biz.tags?.join(", ") ?? "Not provided"}`,
        `Category: ${biz.category ?? "Not provided"}`,
        `Subcategories: ${biz.subCategories?.join(", ") ?? "Not provided"}`,
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
    //   await openai.beta.threads.messages.create(thread.id, {
    //   role: "user",
    //   content: userMessage,
    //   });

    // 3) Persist ids for future use
    const businessAgent = await BusinessAIAssistantModel.create({
      businessId: new mongoose.Types.ObjectId(biz.businessId),
      assistantId: assistant.id,
      // vectorStoreId: vectorStore.id,
      businessName: biz.businessName,
      name: biz.name,
      description: biz.description,
      tags: biz.tags,
      category: biz.category,
      subCategories: biz.subCategories,
      tone: biz.tone,
      website: biz.website,
      threadId: thread.id,
    });

    // 4) Scrape website in background if website is provided
    if (biz.website) {
      // Don't await - let it run in background
      AIService.scrapeAndCacheWebsiteData(biz.businessId, biz.website).catch(
        (error) => {
          logger.warn(
            { businessId: biz.businessId, website: biz.website, error },
            "Background website scraping failed"
          );
        }
      );
    }

    return {
      assistantId: assistant.id,
      // vectorStoreId: vectorStore.id
    };
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
async function getBusinessAssistant(
  businessId: string
): Promise<IBusiness_AI_Assistant> {
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
  static async updateAgent(businessId: string, updates: Partial<Business>) {
    try {
      const agent: IBusiness_AI_Assistant = await getBusinessAssistant(
        businessId
      );

      const updatedInstructions = [
        `You are the AI agent for ${
          updates.businessName ? updates.businessName : agent.businessName
        }.`,
        `Your knowledge is based on the following information about the business:`,
        `Name: ${updates.name ? updates.name : agent.name}`,
        `Description: ${
          updates.description ? updates.description : agent.description
        }`,
        `Tags: ${
          updates.tags ? updates.tags.join(", ") : (agent.tags ?? []).join(", ")
        }`,
        `Category: ${updates.category ? updates.category : agent.category}`,
        `Subcategories: ${
          updates.subCategories
            ? updates.subCategories.join(", ")
            : (agent.subCategories ?? []).join(", ")
        }`,
        `Primary goal: help the business engage customers with relevant events/offers and fast answers.`,
        `Tone: ${
          (updates.tone as any) ??
          (agent.tone as any) ??
          "professional, warm, succinct"
        }.`,
        `If you don't know, say so briefly and ask for missing info.`,
        `Use the provided tools to fetch live data from the business backend when relevant.`,
        `${ASSISTANT_INSTRUCTIONS}`,
      ].join("\n");

      const updatedAssistant = await openai.beta.assistants.update(
        agent.assistantId,
        {
          name: updates.name ? `${updates.name}` : undefined,
          instructions: updatedInstructions,
        }
      );

      const updatedAgent = await BusinessAIAssistantModel.findOneAndUpdate(
        { businessId: new mongoose.Types.ObjectId(businessId) },
        {
          businessName: updates.businessName ?? agent.businessName,
          name: updates.name ?? agent.name,
          description: updates.description ?? agent.description,
          tags: updates.tags ?? agent.tags,
          category: updates.category ?? agent.category,
          subCategories: updates.subCategories ?? agent.subCategories,
          tone: updates.tone ?? agent.tone,
          website: updates.website ?? agent.website,
          instructions: updatedInstructions,
        },
        { new: true }
      );

      return updatedAssistant;
    } catch (error: any) {
      logger.error("Error updating business agent:", error);
      throw error;
    }
  }

  static async trainYourAgent(businessId: string) {
    try {
      /*
      Service to retrain or update the AI agent's knowledge base.
      All questions are organized into 5 categories:

      business_info - Business identity, services, products
      customer_profile - Target audience demographics and behavior
      operations - Hours, capacity, busy/slow periods
      marketing - Past promotions, discount preferences, goals
      goals - Primary objectives for AI agent assistance
      */
      const agent: IBusiness_AI_Assistant = await getBusinessAssistant(
        businessId
      );

      // Update the agent's knowledge base
      await openai.beta.assistants.update(agent.assistantId, {
        instructions: agent.instructions,
      });
      // Add local files
      // if (localPaths && localPaths.length > 0) {
      //   await AIService.addFilesToVectorStore(
      //     agent.vectorStoreId,
      //     localPaths
      //   );
      // }

      // // Add S3 files
      // if (s3Keys && s3Keys.length > 0) {
      //   await AIService.addS3FilesToVectorStore(agent.vectorStoreId, s3Keys);
      // }

      return { message: "Training initiated successfully." };
    } catch (error: any) {
      logger.error("Error training your agent:", error);
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

  /**
   * Scrapes website content and caches it in the business_ai_assistant model
   * This runs in the background during agent creation to optimize description generation
   */
  static async scrapeAndCacheWebsiteData(
    businessId: string,
    website: string
  ): Promise<void> {
    try {
      logger.info(
        { businessId, website },
        "Starting background website scraping"
      );

      const websiteData = await this.scrapeWebsiteContent(website);

      if (websiteData) {
        await BusinessAIAssistantModel.updateOne(
          { businessId: new mongoose.Types.ObjectId(businessId) },
          { $set: { websiteData } }
        );

        logger.info(
          { businessId, websiteDataLength: websiteData.length },
          "Successfully cached website data"
        );
      }
    } catch (error: any) {
      logger.error(
        { businessId, website, error },
        "Error scraping and caching website data"
      );
      // Don't throw - this is a background operation
    }
  }

  /**
   * Generates an AI description for an agent based on business context
   * Uses cached websiteData if available to avoid scraping during description generation
   */
  static async generateAgentDescription(params: {
    category: string;
    subcategory?: string;
    tags?: string[]; // Made optional
    businessName?: string;
    website?: string;
    aboutSection?: string;
    businessId?: string; // Added to fetch cached website data
  }): Promise<string> {
    try {
      const {
        category,
        subcategory,
        tags,
        businessName,
        website,
        aboutSection,
        businessId,
      } = params;

      // Build context for description generation
      const contextParts = [
        `Generate a concise, professional business description for an AI agent.`,
        `Business Category: ${category}`,
      ];

      if (subcategory) {
        contextParts.push(`Subcategory: ${subcategory}`);
      }

      if (tags && tags.length > 0) {
        contextParts.push(`Selected Tags: ${tags.join(", ")}`);
      }

      if (businessName) {
        contextParts.push(`Business Name: ${businessName}`);
      }

      // Try to use cached website data first, fall back to scraping if not available
      let websiteContent = null;
      if (businessId) {
        const businessAgent = await BusinessAIAssistantModel.findOne({
          businessId: new mongoose.Types.ObjectId(businessId),
        });
        if (businessAgent?.websiteData) {
          websiteContent = businessAgent.websiteData;
          logger.info(
            { businessId },
            "Using cached website data for description generation"
          );
        }
      }

      // If no cached data and website is provided, scrape (legacy behavior)
      if (!websiteContent && website) {
        logger.info(
          { businessId, website },
          "No cached website data, scraping website for description generation"
        );
        websiteContent = await this.scrapeWebsiteContent(website);
      }

      if (websiteContent) {
        contextParts.push(`\nWebsite Content (excerpt): ${websiteContent}`);
      } else if (website) {
        contextParts.push(`Website: ${website}`);
      }

      if (aboutSection) {
        contextParts.push(`About the Business: ${aboutSection}`);
      }

      contextParts.push(
        `\nBased on the above information, generate a clear, informative description (2-3 sentences) that describes this business to the Pinntag app. Explain what products or services this business provides, their industry/niche, and what types of customer inquiries they handle. If you can find the year the business was established from the website content, include it in the description. This will help the app understand and route users appropriately.`
      );

      const prompt = contextParts.join("\n");

      // Use OpenAI to generate description
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a business analyst writing descriptions for the Pinntag app. Generate concise, informative descriptions that help the app understand what the business does, what industry they serve, what types of customer inquiries they handle, and when they were established (if available).",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const generatedDescription =
        response.choices[0]?.message?.content?.trim();

      if (!generatedDescription) {
        throw new Error("Failed to generate description from OpenAI");
      }

      logger.info(
        { params, generatedDescription },
        "Generated AI agent description"
      );

      return generatedDescription;
    } catch (error: any) {
      logger.error("Error generating agent description:", error);
      throw new Error(`Failed to generate agent description: ${error.message}`);
    }
  }

  /**
   * Scrapes website content to extract relevant information for tag generation
   */
  private static async scrapeWebsiteContent(
    website: string
  ): Promise<string | null> {
    try {
      const response = await fetch(website, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PinntagBot/1.0)",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        logger.warn(
          { website, status: response.status },
          "Failed to fetch website"
        );
        return null;
      }

      const html = await response.text();

      // Extract text content from HTML (basic extraction)
      // Remove script and style tags
      let text = html.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ""
      );
      text = text.replace(
        /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
        ""
      );

      // Remove HTML tags
      text = text.replace(/<[^>]+>/g, " ");

      // Decode HTML entities
      text = text.replace(/&nbsp;/g, " ");
      text = text.replace(/&amp;/g, "&");
      text = text.replace(/&lt;/g, "<");
      text = text.replace(/&gt;/g, ">");
      text = text.replace(/&quot;/g, '"');

      // Clean up whitespace
      text = text.replace(/\s+/g, " ").trim();

      // Limit to first 3000 characters for token efficiency
      const excerpt = text.substring(0, 3000);

      logger.info(
        { website, excerptLength: excerpt.length },
        "Successfully scraped website content"
      );

      return excerpt;
    } catch (error: any) {
      logger.warn({ website, error: error.message }, "Error scraping website");
      return null;
    }
  }

  /**
   * Generates relevant tags based on category, subcategory, and optional website
   */
  private static async generateTagsFromContext(params: {
    category: string;
    subcategory?: string;
    website?: string;
    maxTags?: number;
  }): Promise<string[]> {
    try {
      const { category, subcategory, website, maxTags = 10 } = params;

      // Build context for tag generation
      const contextParts = [
        `Generate relevant tags for a business based on the following information:`,
        `Category: ${category}`,
      ];

      if (subcategory) {
        contextParts.push(`Subcategory: ${subcategory}`);
      }

      // If website is provided, try to scrape content
      let websiteContent = null;
      if (website) {
        websiteContent = await this.scrapeWebsiteContent(website);
        if (websiteContent) {
          contextParts.push(`\nWebsite Content (excerpt): ${websiteContent}`);
        } else {
          contextParts.push(`Website URL: ${website} (content not available)`);
        }
      }

      contextParts.push(
        `\nGenerate ${maxTags} relevant, specific tags that focus on this business's brand specialties and the types of deals they offer.`,
        `Tags should describe:`,
        `- Brand specialties (unique offerings, signature products/services, expertise areas)`,
        `- Deal types (discounts, promotions, packages, seasonal offers)`,
        `- Product/service categories they specialize in`,
        `- Customer segments they serve`,
        `\nTag formatting requirements:`,
        `- Lowercase`,
        `- Short (1-3 words)`,
        `- Specific and descriptive`,
        `- Relevant to the business category`,
        `\nReturn ONLY a JSON array of strings, nothing else. Example: ["tag1", "tag2", "tag3"]`
      );

      const prompt = contextParts.join("\n");

      // Use OpenAI to generate tags
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a business categorization expert specializing in brand specialties and deal types. Generate relevant, specific tags that highlight what makes this business unique (their specialties, signature offerings) and the types of deals/promotions they offer. Always respond with a valid JSON object containing a 'tags' array of strings. IMPORTANT: Always generate tags based on the provided category and any available information. Even if website content seems unrelated or mismatched with the category, generate tags based on the category provided. Never return an error - always generate useful tags.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 300,
        response_format: { type: "json_object" },
      });

      const responseContent = response.choices[0]?.message?.content?.trim();

      if (!responseContent) {
        throw new Error("Failed to generate tags from OpenAI");
      }

      // Parse the JSON response
      let tags: string[];
      try {
        const parsed = JSON.parse(responseContent);
        // Handle different possible response formats
        if (Array.isArray(parsed)) {
          tags = parsed;
        } else if (parsed.tags && Array.isArray(parsed.tags)) {
          tags = parsed.tags;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          tags = parsed.data;
        } else if (parsed.error) {
          // AI returned an error message instead of tags
          logger.warn(
            { errorMessage: parsed.error, params },
            "AI returned error instead of tags, generating fallback tags"
          );
          // Generate basic tags from category and subcategory
          tags = [
            category.toLowerCase(),
            ...(subcategory ? [subcategory.toLowerCase()] : []),
          ];
        } else {
          throw new Error("Unexpected response format");
        }
      } catch (parseError) {
        logger.error(
          { responseContent, parseError },
          "Failed to parse tag response"
        );
        throw new Error("Failed to parse generated tags");
      }

      // Validate and clean tags
      tags = tags
        .filter(
          (tag): tag is string =>
            typeof tag === "string" && tag.trim().length > 0
        )
        .map((tag) => tag.toLowerCase().trim())
        .slice(0, maxTags);

      if (tags.length === 0) {
        throw new Error("No valid tags generated");
      }

      logger.info(
        { params, tags, websiteScraped: Boolean(websiteContent) },
        "Generated tags"
      );

      return tags;
    } catch (error: any) {
      logger.error("Error generating tags:", error);
      throw new Error(`Failed to generate tags: ${error.message}`);
    }
  }

  /**
   * Generates tags for a business by fetching data from the database
   */
  static async generateTagsForBusiness(businessId: string): Promise<string[]> {
    try {
      // Fetch business AI assistant data
      const businessAI = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!businessAI) {
        throw new Error(`No AI agent found for business ID: ${businessId}`);
      }

      console.log("Business AI data:", businessAI);

      // Extract category and subcategory from categories array
      const category = businessAI.category || "";
      const subcategory = businessAI.subCategories?.[0] || undefined;

      if (!category) {
        throw new Error("Business category is required to generate tags");
      }

      // Generate tags using business context
      const tags = await this.generateTagsFromContext({
        category,
        subcategory,
        website: businessAI.website,
        maxTags: 5,
      });

      logger.info(
        { businessId, category, subcategory, tagsCount: tags.length },
        "Generated tags for business"
      );

      return tags;
    } catch (error: any) {
      logger.error({ businessId, error }, "Error generating tags for business");
      throw error;
    }
  }

  /**
   * Generates description for a business by fetching data from the database
   */
  static async generateDescriptionForBusiness(
    businessId: string
  ): Promise<string> {
    try {
      // Fetch business AI assistant data
      const businessAI = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!businessAI) {
        throw new Error(`No AI agent found for business ID: ${businessId}`);
      }

      // Extract category and subcategory from categories array
      const category = businessAI.category || "";
      const subcategory = businessAI.subCategories?.[0] || undefined;

      if (!category) {
        throw new Error(
          "Business category is required to generate description"
        );
      }

      // Tags are now optional - will use category and other metadata if tags not available
      // Generate description using business context with cached website data
      const description = await this.generateAgentDescription({
        category,
        subcategory,
        tags: businessAI.tags,
        businessName: businessAI.businessName,
        website: businessAI.website,
        businessId, // Pass businessId to use cached website data
      });

      logger.info(
        { businessId, category, subcategory },
        "Generated description for business"
      );

      return description;
    } catch (error: any) {
      logger.error(
        { businessId, error },
        "Error generating description for business"
      );
      throw error;
    }
  }

  // ===========================
  // Content Assist Methods
  // ===========================

  /**
   * Helper to generate content using the business's AI agent
   */
  private static async generateContentWithAgent(
    businessId: string,
    prompt: string,
    contentType: string
  ): Promise<GeneratedContent> {
    // Get business agent
    const businessAI = await BusinessAIAssistantModel.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!businessAI?.assistantId) {
      throw new Error(
        "Business AI agent not found. Please create an agent first."
      );
    }

    // Create a new thread for this generation
    const thread = await openai.beta.threads.create();

    // Add the generation request
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: businessAI.assistantId,
    });

    // Poll until complete
    await pollRunUntilComplete(thread.id, run.id);

    // Get the final run to extract usage
    const finalRun = await openai.beta.threads.runs.retrieve(run.id, {
      thread_id: thread.id,
    });

    // Get the response
    const messages = await openai.beta.threads.messages.list(thread.id, {
      limit: 1,
    });

    const assistantMessage = messages.data.find((m) => m.role === "assistant");
    const responseText =
      assistantMessage?.content
        ?.map((c) => (c.type === "text" ? c.text.value : ""))
        .join("\n") ?? "";

    // Parse JSON from response (extract JSON if wrapped in markdown)
    let jsonContent = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    try {
      const content = JSON.parse(jsonContent) as GeneratedContent;

      // Track usage with token counts
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.CONTENT_GENERATION,
        subType: contentType,
        promptTokens: finalRun.usage?.prompt_tokens || 0,
        completionTokens: finalRun.usage?.completion_tokens || 0,
        totalTokens: finalRun.usage?.total_tokens || 0,
        model: "gpt-4o",
        success: true,
        metadata: { threadId: thread.id, runId: run.id },
      });

      logger.info(
        { businessId, contentType },
        `Generated ${contentType} content with agent`
      );
      return content;
    } catch (error) {
      // Track failed usage
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.CONTENT_GENERATION,
        subType: contentType,
        promptTokens: finalRun.usage?.prompt_tokens || 0,
        completionTokens: finalRun.usage?.completion_tokens || 0,
        totalTokens: finalRun.usage?.total_tokens || 0,
        model: "gpt-4o",
        success: false,
        errorMessage: "Failed to parse JSON response",
      });

      // If JSON parsing fails, try to extract structured data
      logger.warn(
        { businessId, responseText },
        "Failed to parse agent response as JSON"
      );
      throw new Error("Failed to parse generated content. Please try again.");
    }
  }

  /**
   * Generate broadcast content for a business
   */
  static async generateBroadcastContent(
    params: BroadcastContentParams
  ): Promise<GeneratedContent> {
    const {
      businessId,
      purpose,
      keyMessage,
      urgency,
      tone,
      targetAudience,
      additionalContext,
      category,
      subcategory,
      tags,
    } = params;

    // Check subscription access
    const access = await checkContentAssistAccess(businessId);
    if (!access.hasAccess) {
      throw new Error(access.reason || "Content assist not available");
    }

    try {
      const prompt = `Generate marketing content for a business broadcast.

Content Details:
- Purpose: ${purpose}
- Key Message: ${keyMessage}
- Urgency Level: ${urgency || "medium"}
- Preferred Tone: ${tone || "use your configured tone"}
- Target Audience: ${targetAudience || "general customers"}
${category ? `- Category: ${category}` : ""}
${subcategory ? `- Subcategory: ${subcategory}` : ""}
${tags && tags.length > 0 ? `- Tags: ${tags.join(", ")}` : ""}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}

Using your knowledge of this business, generate content that aligns with the brand identity and resonates with the target audience.

Respond with ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "title": "Catchy, attention-grabbing title (max 60 chars)",
  "description": "Engaging description that conveys the message clearly (100-200 words)",
  "callToAction": "Clear call-to-action phrase",
  "hashtags": ["relevant", "hashtags", "for", "social"],
  "keywords": ["seo", "keywords"],
  "suggestedTiming": {
    "bestDays": ["Monday", "Wednesday"],
    "bestHours": ["9am-11am", "2pm-4pm"],
    "seasonalNote": "any seasonal considerations"
  },
  "marketingTips": ["tip1", "tip2"]
}`;

      const content = await this.generateContentWithAgent(
        businessId,
        prompt,
        "broadcast"
      );

      // Record usage
      await recordFeatureUsage(businessId, "content", 1);

      return content;
    } catch (error: any) {
      logger.error({ businessId, error }, "Error generating broadcast content");
      throw new Error(`Failed to generate broadcast content: ${error.message}`);
    }
  }

  /**
   * Generate offer content for a business
   */
  static async generateOfferContent(
    params: OfferContentParams
  ): Promise<GeneratedContent> {
    const {
      businessId,
      offerType,
      discountValue,
      discountType,
      product,
      validityPeriod,
      minPurchase,
      tone,
      targetAudience,
      additionalContext,
      category,
      subcategory,
      tags,
    } = params;

    // Check subscription access
    const access = await checkContentAssistAccess(businessId);
    if (!access.hasAccess) {
      throw new Error(access.reason || "Content assist not available");
    }

    try {
      const prompt = `Generate compelling offer content for a business promotion.

Offer Details:
- Offer Type: ${offerType}
- Discount Value: ${discountValue || "not specified"}
- Discount Type: ${discountType || "percentage"}
- Product/Service: ${product || "general"}
- Validity Period: ${validityPeriod || "limited time"}
- Minimum Purchase: ${minPurchase ? `$${minPurchase}` : "none"}
- Preferred Tone: ${tone || "use your configured tone"}
- Target Audience: ${targetAudience || "general customers"}
${category ? `- Category: ${category}` : ""}
${subcategory ? `- Subcategory: ${subcategory}` : ""}
${tags && tags.length > 0 ? `- Tags: ${tags.join(", ")}` : ""}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}

Using your knowledge of this business, generate an offer that aligns with the brand identity and creates urgency for the target audience.

Respond with ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "title": "Attention-grabbing offer title (max 60 chars)",
  "description": "Compelling offer description that creates urgency (100-150 words)",
  "callToAction": "Strong call-to-action",
  "hashtags": ["deal", "discount", "related", "tags"],
  "keywords": ["offer", "keywords"],
  "termsAndConditions": "Clear terms and conditions",
  "promoCode": "SUGGESTED_CODE",
  "suggestedTiming": {
    "bestDays": ["Friday", "Saturday"],
    "bestHours": ["10am-12pm", "6pm-8pm"],
    "seasonalNote": "any timing considerations"
  },
  "marketingTips": ["tip1", "tip2"]
}`;

      const content = await this.generateContentWithAgent(
        businessId,
        prompt,
        "offer"
      );

      // Record usage
      await recordFeatureUsage(businessId, "content", 1);

      return content;
    } catch (error: any) {
      logger.error({ businessId, error }, "Error generating offer content");
      throw new Error(`Failed to generate offer content: ${error.message}`);
    }
  }

  /**
   * Generate reward content for a business
   */
  static async generateRewardContent(
    params: RewardContentParams
  ): Promise<GeneratedContent> {
    const {
      businessId,
      rewardType,
      rewardValue,
      conditions,
      expiryDays,
      tone,
      targetAudience,
      additionalContext,
      category,
      subcategory,
      tags,
    } = params;

    // Check subscription access
    const access = await checkContentAssistAccess(businessId);
    if (!access.hasAccess) {
      throw new Error(access.reason || "Content assist not available");
    }

    try {
      const prompt = `Generate engaging reward content for a customer loyalty program.

Reward Details:
- Reward Type: ${rewardType}
- Reward Value: ${rewardValue || "special reward"}
- Conditions: ${conditions || "for loyal customers"}
- Expiry: ${expiryDays ? `${expiryDays} days` : "no expiry"}
- Preferred Tone: ${tone || "use your configured tone"}
- Target Audience: ${targetAudience || "loyal customers"}
${category ? `- Category: ${category}` : ""}
${subcategory ? `- Subcategory: ${subcategory}` : ""}
${tags && tags.length > 0 ? `- Tags: ${tags.join(", ")}` : ""}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}

Using your knowledge of this business, generate reward content that makes customers feel valued and appreciated.

Respond with ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "title": "Exciting reward title that makes customers feel valued (max 60 chars)",
  "description": "Warm, appreciative description that explains the reward clearly (100-150 words)",
  "callToAction": "Encouraging call-to-action",
  "hashtags": ["loyalty", "rewards", "related", "tags"],
  "keywords": ["reward", "keywords"],
  "termsAndConditions": "Clear eligibility and redemption terms",
  "suggestedTiming": {
    "bestDays": ["Monday"],
    "bestHours": ["morning"],
    "seasonalNote": "timing considerations"
  },
  "marketingTips": ["tip1", "tip2"]
}`;

      const content = await this.generateContentWithAgent(
        businessId,
        prompt,
        "reward"
      );

      // Record usage
      await recordFeatureUsage(businessId, "content", 1);

      return content;
    } catch (error: any) {
      logger.error({ businessId, error }, "Error generating reward content");
      throw new Error(`Failed to generate reward content: ${error.message}`);
    }
  }

  /**
   * Generate event content for a business
   */
  static async generateEventContent(
    params: EventContentParams
  ): Promise<GeneratedContent> {
    const {
      businessId,
      eventType,
      eventName,
      date,
      time,
      location,
      capacity,
      isFree,
      cost,
      tone,
      targetAudience,
      additionalContext,
      category,
      subcategory,
      tags,
    } = params;

    // Check subscription access
    const access = await checkContentAssistAccess(businessId);
    if (!access.hasAccess) {
      throw new Error(access.reason || "Content assist not available");
    }

    try {
      const prompt = `Generate compelling event content for a business event.

Event Details:
- Event Type: ${eventType}
- Event Name: ${eventName || "upcoming event"}
- Date: ${date || "TBD"}
- Time: ${time || "TBD"}
- Location: ${location || "at our location"}
- Capacity: ${capacity || "limited spots"}
- Cost: ${isFree ? "Free" : cost ? `$${cost}` : "TBD"}
- Preferred Tone: ${tone || "use your configured tone"}
- Target Audience: ${targetAudience || "community"}
${category ? `- Category: ${category}` : ""}
${subcategory ? `- Subcategory: ${subcategory}` : ""}
${tags && tags.length > 0 ? `- Tags: ${tags.join(", ")}` : ""}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}

Using your knowledge of this business, generate event content that builds excitement and drives attendance.

Respond with ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "title": "Exciting event title that creates anticipation (max 60 chars)",
  "description": "Engaging event description with all key details (150-200 words)",
  "callToAction": "Clear registration/attendance CTA",
  "hashtags": ["event", "community", "related", "tags"],
  "keywords": ["event", "keywords"],
  "termsAndConditions": "Event policies, cancellation, etc.",
  "suggestedTiming": {
    "bestDays": ["days to promote"],
    "bestHours": ["best times to post"],
    "seasonalNote": "promotion timing tips"
  },
  "marketingTips": ["promotion tip 1", "promotion tip 2"]
}`;

      const content = await this.generateContentWithAgent(
        businessId,
        prompt,
        "event"
      );

      // Record usage
      await recordFeatureUsage(businessId, "content", 1);

      return content;
    } catch (error: any) {
      logger.error({ businessId, error }, "Error generating event content");
      throw new Error(`Failed to generate event content: ${error.message}`);
    }
  }

  /**
   * Improve existing content based on feedback
   */
  static async improveContent(
    params: ImproveContentParams
  ): Promise<GeneratedContent> {
    const {
      businessId,
      contentType,
      existingContent,
      feedback,
      aspectToImprove,
    } = params;

    // Check subscription access
    const access = await checkContentAssistAccess(businessId);
    if (!access.hasAccess) {
      throw new Error(access.reason || "Content assist not available");
    }

    try {
      const prompt = `Improve the following ${contentType} content based on feedback.

Current Content:
- Title: ${existingContent.title || "not provided"}
- Description: ${existingContent.description || "not provided"}
- Call to Action: ${existingContent.callToAction || "not provided"}
- Terms: ${existingContent.terms || "not provided"}

User Feedback: ${feedback}
Aspect to Focus On: ${aspectToImprove || "overall improvement"}

Using your knowledge of this business, improve the content while maintaining brand consistency.

Respond with ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "title": "Improved title",
  "description": "Improved description",
  "callToAction": "Improved CTA",
  "hashtags": ["updated", "hashtags"],
  "keywords": ["updated", "keywords"],
  "termsAndConditions": "Improved terms if applicable",
  "marketingTips": ["improvement suggestions"]
}

Make meaningful improvements while preserving the core message. Focus on the specified aspect.`;

      const content = await this.generateContentWithAgent(
        businessId,
        prompt,
        `${contentType}-improvement`
      );

      // Record usage
      await recordFeatureUsage(businessId, "content", 1);

      logger.info(
        { businessId, contentType, aspectToImprove },
        "Improved content"
      );

      return content;
    } catch (error: any) {
      logger.error({ businessId, error }, "Error improving content");
      throw new Error(`Failed to improve content: ${error.message}`);
    }
  }

  /**
   * Generate content for any type (generic method)
   */
  static async generateContent(
    contentType: ContentType,
    params:
      | BroadcastContentParams
      | OfferContentParams
      | RewardContentParams
      | EventContentParams
  ): Promise<GeneratedContent> {
    switch (contentType) {
      case "broadcast":
        return this.generateBroadcastContent(params as BroadcastContentParams);
      case "offer":
        return this.generateOfferContent(params as OfferContentParams);
      case "reward":
        return this.generateRewardContent(params as RewardContentParams);
      case "event":
        return this.generateEventContent(params as EventContentParams);
      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }
  }
}
