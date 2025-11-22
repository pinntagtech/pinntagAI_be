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
    // const vectorStore = await openai.vectorStores.create({
    //   name: `${biz.name} Knowledge`,
    // });

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
        `Category: ${biz.category}`,
        `Subcategories: ${biz.subCategories.join(", ")}`,
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
        // file_search: {
        //   vector_store_ids: [vectorStore.id],
        // },
      },
    });

    const thread = await openai.beta.threads.create();
    //   await openai.beta.threads.messages.create(thread.id, {
    //   role: "user",
    //   content: userMessage,
    //   });

    // 3) Persist ids for future use
    await BusinessAIAssistantModel.create({
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
   * Generates an AI description for an agent based on business context
   */
  static async generateAgentDescription(params: {
    category: string;
    subcategory?: string;
    tags: string[];
    businessName?: string;
    website?: string;
    aboutSection?: string;
  }): Promise<string> {
    try {
      const {
        category,
        subcategory,
        tags,
        businessName,
        website,
        aboutSection,
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

      // If website is provided, scrape content to extract additional information
      let websiteContent = null;
      if (website) {
        websiteContent = await this.scrapeWebsiteContent(website);
        if (websiteContent) {
          contextParts.push(`\nWebsite Content (excerpt): ${websiteContent}`);
        } else {
          contextParts.push(`Website: ${website}`);
        }
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
              "You are a business categorization expert specializing in brand specialties and deal types. Generate relevant, specific tags that highlight what makes this business unique (their specialties, signature offerings) and the types of deals/promotions they offer. Always respond with a valid JSON array of strings.",
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

      if (!businessAI.tags || businessAI.tags.length === 0) {
        throw new Error(
          "Tags are required to generate description. Please generate and save tags first."
        );
      }

      // Generate description using business context
      const description = await this.generateAgentDescription({
        category,
        subcategory,
        tags: businessAI.tags,
        businessName: businessAI.businessName,
        website: businessAI.website,
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
}
