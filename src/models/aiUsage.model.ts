import mongoose, { Schema, Document } from "mongoose";

// ===========================
// Enums and Types
// ===========================

export enum UsageType {
  CONTENT_GENERATION = "content_generation",
  IMAGE_GENERATION = "image_generation",
  IMAGE_EDIT = "image_edit",
  CHAT = "chat",
  AGENT_QUERY = "agent_query",
}

export enum ContentGenerationType {
  BROADCAST = "broadcast",
  OFFER = "offer",
  REWARD = "reward",
  EVENT = "event",
  IMPROVE = "improve",
}

// ===========================
// Interfaces
// ===========================

export interface IUsageRecord {
  timestamp: Date;
  type: UsageType;
  subType?: string; // e.g., ContentGenerationType
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  imageCount?: number;
  model?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface IDailyUsage {
  date: string; // YYYY-MM-DD format
  contentGenerations: number;
  imageGenerations: number;
  imageEdits: number;
  chats: number;
  agentQueries: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

export interface IMonthlyUsage {
  month: string; // YYYY-MM format
  contentGenerations: number;
  imageGenerations: number;
  imageEdits: number;
  chats: number;
  agentQueries: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

export interface IAIUsage extends Document {
  businessId: mongoose.Types.ObjectId;
  // Current period counters (reset monthly)
  currentPeriodStart: Date;
  imagesGeneratedThisPeriod: number;
  contentGenerationsThisPeriod: number;
  tokensUsedThisPeriod: number;
  // Lifetime counters
  totalImagesGenerated: number;
  totalContentGenerations: number;
  totalTokensUsed: number;
  totalChats: number;
  totalAgentQueries: number;
  // Detailed records
  usageRecords: IUsageRecord[];
  // Aggregated daily usage (last 30 days)
  dailyUsage: IDailyUsage[];
  // Aggregated monthly usage
  monthlyUsage: IMonthlyUsage[];
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ===========================
// Schema
// ===========================

const UsageRecordSchema = new Schema<IUsageRecord>(
  {
    timestamp: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: Object.values(UsageType),
      required: true,
    },
    subType: { type: String },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    imageCount: { type: Number, default: 0 },
    model: { type: String },
    success: { type: Boolean, default: true },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const DailyUsageSchema = new Schema<IDailyUsage>(
  {
    date: { type: String, required: true },
    contentGenerations: { type: Number, default: 0 },
    imageGenerations: { type: Number, default: 0 },
    imageEdits: { type: Number, default: 0 },
    chats: { type: Number, default: 0 },
    agentQueries: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
  },
  { _id: false }
);

const MonthlyUsageSchema = new Schema<IMonthlyUsage>(
  {
    month: { type: String, required: true },
    contentGenerations: { type: Number, default: 0 },
    imageGenerations: { type: Number, default: 0 },
    imageEdits: { type: Number, default: 0 },
    chats: { type: Number, default: 0 },
    agentQueries: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
  },
  { _id: false }
);

const AIUsageSchema = new Schema<IAIUsage>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    // Current period counters
    currentPeriodStart: { type: Date, default: () => new Date() },
    imagesGeneratedThisPeriod: { type: Number, default: 0 },
    contentGenerationsThisPeriod: { type: Number, default: 0 },
    tokensUsedThisPeriod: { type: Number, default: 0 },
    // Lifetime counters
    totalImagesGenerated: { type: Number, default: 0 },
    totalContentGenerations: { type: Number, default: 0 },
    totalTokensUsed: { type: Number, default: 0 },
    totalChats: { type: Number, default: 0 },
    totalAgentQueries: { type: Number, default: 0 },
    // Detailed records (keep last 1000)
    usageRecords: {
      type: [UsageRecordSchema],
      default: [],
    },
    // Aggregated usage
    dailyUsage: {
      type: [DailyUsageSchema],
      default: [],
    },
    monthlyUsage: {
      type: [MonthlyUsageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
AIUsageSchema.index({ businessId: 1, "dailyUsage.date": 1 });
AIUsageSchema.index({ businessId: 1, "monthlyUsage.month": 1 });

export const AIUsageModel = mongoose.model<IAIUsage>("AIUsage", AIUsageSchema);

// ===========================
// Helper Functions
// ===========================

/**
 * Get or create usage record for a business
 */
export async function getOrCreateUsageRecord(
  businessId: string
): Promise<IAIUsage> {
  let usage = await AIUsageModel.findOne({
    businessId: new mongoose.Types.ObjectId(businessId),
  });

  if (!usage) {
    usage = await AIUsageModel.create({
      businessId: new mongoose.Types.ObjectId(businessId),
      currentPeriodStart: new Date(),
    });
  }

  return usage;
}

/**
 * Check if period needs reset (monthly)
 */
export function shouldResetPeriod(periodStart: Date): boolean {
  const now = new Date();
  const startMonth = periodStart.getMonth();
  const startYear = periodStart.getFullYear();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return currentYear > startYear || currentMonth > startMonth;
}

/**
 * Get current date string in YYYY-MM-DD format
 */
export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get current month string in YYYY-MM format
 */
export function getMonthString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 7);
}
