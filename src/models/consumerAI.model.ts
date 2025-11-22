import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Message role in conversation
 */
export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

/**
 * Interface for a single chat message
 */
export interface IChatMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: {
    eventsReferenced?: string[]; // Event IDs mentioned in this message
    intentDetected?: string; // e.g., "search", "recommendation", "question"
    sentiment?: string; // e.g., "positive", "neutral", "negative"
  };
}

/**
 * Interface for a conversation session
 */
export interface IConversation {
  sessionId: string;
  messages: IChatMessage[];
  summary?: string; // AI-generated summary for cross-chat reference
  topics: string[]; // Key topics discussed
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
}

/**
 * Interface for learned user preferences
 */
export interface IUserPreferences {
  // Category preferences (learned from engagement)
  favoriteCategories: Array<{
    categoryId: string;
    categoryName: string;
    score: number; // 0-100 interest score
    lastInteraction: Date;
  }>;

  // Location preferences
  preferredLocations: Array<{
    city: string;
    state?: string;
    score: number;
  }>;

  // Time preferences
  preferredTimes: {
    weekdays: boolean;
    weekends: boolean;
    mornings: boolean; // 6am-12pm
    afternoons: boolean; // 12pm-6pm
    evenings: boolean; // 6pm-10pm
    lateNight: boolean; // 10pm-6am
  };

  // Price sensitivity (1-5, 1=very price sensitive, 5=price insensitive)
  priceSensitivity: number;

  // Event type preferences
  eventTypePreferences: Array<{
    type: string; // "offer", "flashdeal", "business_event", etc.
    score: number;
  }>;

  // Dietary preferences (for food deals)
  dietaryPreferences: string[];

  // Explicit preferences (user-stated)
  explicitPreferences: {
    interests: string[];
    dislikes: string[];
    notes: string; // Free-form notes from conversations
  };
}

/**
 * Interface for cross-chat reference context
 */
export interface ICrossChatContext {
  // Recent conversation summaries for context
  recentConversationSummaries: Array<{
    sessionId: string;
    summary: string;
    topics: string[];
    date: Date;
  }>;

  // Key facts learned about the user
  userFacts: Array<{
    fact: string;
    source: string; // "explicit" (user stated) or "inferred" (from behavior)
    confidence: number; // 0-1
    learnedAt: Date;
  }>;

  // Mentioned events/businesses for continuity
  mentionedEntities: Array<{
    entityType: "event" | "business" | "category" | "location";
    entityId: string;
    entityName: string;
    context: string; // Why it was mentioned
    lastMentioned: Date;
  }>;

  // Pending follow-ups or recommendations
  pendingFollowUps: Array<{
    type: "recommendation" | "reminder" | "question";
    content: string;
    createdAt: Date;
    resolved: boolean;
  }>;
}

/**
 * Main Consumer AI Profile interface
 */
export interface IConsumerAIProfile extends Document {
  userId: mongoose.Types.ObjectId;

  // User preferences (learned + explicit)
  preferences: IUserPreferences;

  // Conversation history
  conversations: IConversation[];

  // Cross-chat referencing context
  crossChatContext: ICrossChatContext;

  // Profile metadata
  profileVersion: number;
  lastActiveAt: Date;
  totalConversations: number;
  totalMessages: number;

  // Onboarding status
  onboardingCompleted: boolean;
  onboardingStep: number;

  createdAt: Date;
  updatedAt: Date;
}

// Sub-schemas
const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: Object.values(MessageRole),
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      eventsReferenced: [{ type: String }],
      intentDetected: { type: String },
      sentiment: { type: String },
    },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    sessionId: {
      type: String,
      required: true,
    },
    messages: [ChatMessageSchema],
    summary: { type: String },
    topics: [{ type: String }],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const CategoryPreferenceSchema = new Schema(
  {
    categoryId: { type: String, required: true },
    categoryName: { type: String, required: true },
    score: { type: Number, default: 50, min: 0, max: 100 },
    lastInteraction: { type: Date, default: Date.now },
  },
  { _id: false }
);

const LocationPreferenceSchema = new Schema(
  {
    city: { type: String, required: true },
    state: { type: String },
    score: { type: Number, default: 50, min: 0, max: 100 },
  },
  { _id: false }
);

const EventTypePreferenceSchema = new Schema(
  {
    type: { type: String, required: true },
    score: { type: Number, default: 50, min: 0, max: 100 },
  },
  { _id: false }
);

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    favoriteCategories: [CategoryPreferenceSchema],
    preferredLocations: [LocationPreferenceSchema],
    preferredTimes: {
      weekdays: { type: Boolean, default: true },
      weekends: { type: Boolean, default: true },
      mornings: { type: Boolean, default: true },
      afternoons: { type: Boolean, default: true },
      evenings: { type: Boolean, default: true },
      lateNight: { type: Boolean, default: false },
    },
    priceSensitivity: { type: Number, default: 3, min: 1, max: 5 },
    eventTypePreferences: [EventTypePreferenceSchema],
    dietaryPreferences: [{ type: String }],
    explicitPreferences: {
      interests: [{ type: String }],
      dislikes: [{ type: String }],
      notes: { type: String, default: "" },
    },
  },
  { _id: false }
);

const ConversationSummarySchema = new Schema(
  {
    sessionId: { type: String, required: true },
    summary: { type: String, required: true },
    topics: [{ type: String }],
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserFactSchema = new Schema(
  {
    fact: { type: String, required: true },
    source: { type: String, enum: ["explicit", "inferred"], required: true },
    confidence: { type: Number, default: 0.8, min: 0, max: 1 },
    learnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MentionedEntitySchema = new Schema(
  {
    entityType: {
      type: String,
      enum: ["event", "business", "category", "location"],
      required: true,
    },
    entityId: { type: String, required: true },
    entityName: { type: String, required: true },
    context: { type: String },
    lastMentioned: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PendingFollowUpSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["recommendation", "reminder", "question"],
      required: true,
    },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
  },
  { _id: false }
);

const CrossChatContextSchema = new Schema<ICrossChatContext>(
  {
    recentConversationSummaries: [ConversationSummarySchema],
    userFacts: [UserFactSchema],
    mentionedEntities: [MentionedEntitySchema],
    pendingFollowUps: [PendingFollowUpSchema],
  },
  { _id: false }
);

// Main Consumer AI Profile Schema
const ConsumerAIProfileSchema = new Schema<IConsumerAIProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
      ref: "User",
    },
    preferences: {
      type: UserPreferencesSchema,
      default: () => ({}),
    },
    conversations: {
      type: [ConversationSchema],
      default: [],
    },
    crossChatContext: {
      type: CrossChatContextSchema,
      default: () => ({
        recentConversationSummaries: [],
        userFacts: [],
        mentionedEntities: [],
        pendingFollowUps: [],
      }),
    },
    profileVersion: {
      type: Number,
      default: 1,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    totalConversations: {
      type: Number,
      default: 0,
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
ConsumerAIProfileSchema.index({ lastActiveAt: -1 });
ConsumerAIProfileSchema.index({ "conversations.sessionId": 1 });
ConsumerAIProfileSchema.index({ totalMessages: -1 });

// Pre-save hook to update counters
ConsumerAIProfileSchema.pre("save", function (next) {
  this.lastActiveAt = new Date();

  // Update total messages count
  let totalMessages = 0;
  for (const conv of this.conversations) {
    totalMessages += conv.messages.length;
    conv.messageCount = conv.messages.length;
  }
  this.totalMessages = totalMessages;
  this.totalConversations = this.conversations.length;

  next();
});

// Static methods
interface ConsumerAIProfileModel extends Model<IConsumerAIProfile> {
  getOrCreateProfile(
    userId: mongoose.Types.ObjectId | string
  ): Promise<IConsumerAIProfile>;
  getActiveConversation(
    userId: mongoose.Types.ObjectId | string,
    sessionId: string
  ): Promise<IConversation | null>;
}

ConsumerAIProfileSchema.statics.getOrCreateProfile = async function (
  userId: mongoose.Types.ObjectId | string
): Promise<IConsumerAIProfile> {
  let profile = await this.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!profile) {
    profile = await this.create({
      userId: new mongoose.Types.ObjectId(userId),
    });
  }

  return profile;
};

ConsumerAIProfileSchema.statics.getActiveConversation = async function (
  userId: mongoose.Types.ObjectId | string,
  sessionId: string
): Promise<IConversation | null> {
  const profile = await this.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    "conversations.sessionId": sessionId,
  });

  if (!profile) return null;

  return (
    profile.conversations.find(
      (c: IConversation) => c.sessionId === sessionId
    ) || null
  );
};

export const ConsumerAIProfileModel = mongoose.model<
  IConsumerAIProfile,
  ConsumerAIProfileModel
>("ConsumerAIProfile", ConsumerAIProfileSchema);
