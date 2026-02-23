import { Connection, Model, Schema } from "mongoose";
import { getBackendConnection } from "../../db/connection.js";

// Enums for Deal Templates
export enum TemplateCreatorType {
  ADMIN = "Admin",
  BUSINESS = "Business",
  SYSTEM = "System",
}

export enum TemplateType {
  FORMAL = "business_event",
  INFORMAL = "social_event",
  OFFER = "offer",
  PRIVATE = "private",
  FLASHDEAL = "flashdeal",
  SPOTLIGHT = "spotlight",
  DROPPED_PIN = "dropped_pin",
  // Legacy alias
  BUSINESS_EVENT = "business_event",
}

export enum TemplateScope {
  GENERIC = "generic", // Available to all businesses in industry/category
  BUSINESS_SPECIFIC = "business_specific", // Customized for specific business
}

// Deal Template Interface (for templates collection in PinntagBackend DB)
export interface IDealTemplate {
  _id?: string | Schema.Types.ObjectId;
  user?: string | Schema.Types.ObjectId; // Creator user ID (refPath based on creatorType)
  creatorType: string;
  type: string;
  scope: string; // "generic" or "business_specific"
  businessId?: string | Schema.Types.ObjectId; // Only set for business-specific templates
  businessProfile?: string | Schema.Types.ObjectId; // Reference to Business
  discountValue?: string;
  discountType?: string; // Type of discount (e.g., "percentage", "fixed", "buy_one_get_one")
  promotionType?: string; // e.g., "percentage_off", "dollar_off", "bogo", "free_item"
  contentType?: string; // e.g., "offer", "broadcast", "reward", "event"
  percentOffValue?: number; // Numeric percentage discount value
  dollarOffValue?: number; // Numeric dollar discount value
  bogoOrFreeItem?: string; // Description of bogo/free item deal
  categories: Array<string | Schema.Types.ObjectId>;
  title: string;
  keywords: string[];
  description?: string;
  minTargetAge?: number;
  maxTargetAge?: number;
  targetGenders: string[];
  promotionCode?: string;
  isFree: boolean;
  participationCost?: string;
  termsApplied: boolean;
  termsAndConditions?: string;
  businessIndustry?: string | Schema.Types.ObjectId;
  businessCategories: Array<string | Schema.Types.ObjectId>;
  thumbnail?: string;
  tags?: string[];
  // AI-generated metadata
  generatedByAI?: boolean;
  aiGenerationData?: {
    occasion?: string;
    specificHoliday?: string;
    promotionalGoal?: string;
    bestTiming?: {
      days?: string[];
      hours?: string[];
      seasonalNote?: string;
    };
    callToAction?: string;
    marketingTips?: string[];
  };
  // Scheduling for auto-updates
  isActive?: boolean;
  lastUpdated?: Date;
  nextScheduledUpdate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Deal Template Schema Definition
export const DealTemplateSchema = new Schema<IDealTemplate>(
  {
    user: {
      type: Schema.Types.ObjectId,
      refPath: "creatorType"
    },
    creatorType: { type: String, required: true, enum: Object.values(TemplateCreatorType) },
    type: { type: String, required: true, enum: Object.values(TemplateType) },
    scope: { type: String, required: true, enum: Object.values(TemplateScope), default: TemplateScope.GENERIC },
    businessId: { type: Schema.Types.ObjectId, ref: "Business" }, // Only for business-specific
    businessProfile: { type: Schema.Types.ObjectId, ref: "Business" },
    discountValue: { type: String },
    discountType: { type: String },
    promotionType: { type: String },
    contentType: { type: String },
    percentOffValue: { type: Number },
    dollarOffValue: { type: Number },
    bogoOrFreeItem: { type: String },
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    title: { type: String, required: true },
    keywords: [{ type: String }],
    description: { type: String },
    minTargetAge: { type: Number, min: 0, max: 100 },
    maxTargetAge: { type: Number, min: 0, max: 100 },
    targetGenders: [{ type: String, enum: ["male", "female", "others", "all"] }],
    promotionCode: { type: String },
    isFree: { type: Boolean, default: false },
    participationCost: { type: String },
    termsApplied: { type: Boolean, default: false },
    termsAndConditions: { type: String },
    businessIndustry: { type: Schema.Types.ObjectId, ref: "Industry" },
    businessCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    thumbnail: { type: String },
    tags: [{ type: String }],
    generatedByAI: { type: Boolean, default: false },
    aiGenerationData: {
      occasion: { type: String },
      specificHoliday: { type: String },
      promotionalGoal: { type: String },
      bestTiming: {
        days: [{ type: String }],
        hours: [{ type: String }],
        seasonalNote: { type: String },
      },
      callToAction: { type: String },
      marketingTips: [{ type: String }],
    },
    isActive: { type: Boolean, default: true },
    lastUpdated: { type: Date },
    nextScheduledUpdate: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "templates", // Collection name in backend DB
  }
);

// Indexes for better query performance
DealTemplateSchema.index({ type: 1, isActive: 1 });
DealTemplateSchema.index({ scope: 1, isActive: 1 });
DealTemplateSchema.index({ businessId: 1, isActive: 1 });
DealTemplateSchema.index({ businessIndustry: 1, scope: 1 });
DealTemplateSchema.index({ generatedByAI: 1, nextScheduledUpdate: 1 });
DealTemplateSchema.index({ createdAt: -1 });

// Cached model instance
let DealTemplateModel: Model<IDealTemplate> | null = null;

/**
 * Get the Deal Template model (lazy-initialized)
 * Uses the secondary PinntagBackend DB connection
 *
 * @returns Promise<Model<IDealTemplate>>
 *
 * @example
 * ```typescript
 * const TemplateModel = await getDealTemplateModel();
 * const templates = await TemplateModel.find({ isActive: true }).lean();
 * ```
 */
export const getDealTemplateModel = async (): Promise<Model<IDealTemplate>> => {
  if (DealTemplateModel) return DealTemplateModel;

  const backendConn: Connection = await getBackendConnection();
  DealTemplateModel = backendConn.model<IDealTemplate>(
    "Template",
    DealTemplateSchema,
    "templates"
  );

  return DealTemplateModel;
};

/**
 * Helper: Find active templates
 */
export const findActiveTemplates = async () => {
  const TemplateModel = await getDealTemplateModel();
  return TemplateModel.find({ isActive: true }).lean();
};

/**
 * Helper: Find templates by type
 */
export const findTemplatesByType = async (type: TemplateType) => {
  const TemplateModel = await getDealTemplateModel();
  return TemplateModel.find({ type, isActive: true }).lean();
};

/**
 * Helper: Find templates by industry
 */
export const findTemplatesByIndustry = async (industryId: string) => {
  const TemplateModel = await getDealTemplateModel();
  return TemplateModel.find({
    businessIndustry: industryId,
    isActive: true
  }).lean();
};

/**
 * Helper: Find templates by category (subcategory)
 */
export const findTemplatesByCategory = async (categoryId: string) => {
  const TemplateModel = await getDealTemplateModel();
  return TemplateModel.find({
    businessCategories: categoryId,
    isActive: true
  }).lean();
};

/**
 * Helper: Find templates by industry and categories
 */
export const findTemplatesByIndustryAndCategories = async (
  industryId: string,
  categoryIds?: string[]
) => {
  const TemplateModel = await getDealTemplateModel();
  const query: any = {
    businessIndustry: industryId,
    isActive: true
  };

  if (categoryIds && categoryIds.length > 0) {
    query.businessCategories = { $in: categoryIds };
  }

  return TemplateModel.find(query).lean();
};

/**
 * Helper: Find templates that need overnight update
 */
export const findTemplatesForUpdate = async () => {
  const TemplateModel = await getDealTemplateModel();
  const now = new Date();
  return TemplateModel.find({
    generatedByAI: true,
    isActive: true,
    $or: [
      { nextScheduledUpdate: { $lte: now } },
      { nextScheduledUpdate: null },
    ],
  }).lean();
};

/**
 * Helper: Create or update a template
 */
export const upsertTemplate = async (
  filter: Partial<IDealTemplate>,
  templateData: Partial<IDealTemplate>
) => {
  const TemplateModel = await getDealTemplateModel();
  return TemplateModel.findOneAndUpdate(
    filter,
    {
      $set: {
        ...templateData,
        lastUpdated: new Date()
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

/**
 * Helper: Find template by ID
 */
export const findTemplateById = async (templateId: string) => {
  const TemplateModel = await getDealTemplateModel();
  return TemplateModel.findById(templateId).lean();
};

/**
 * Helper: Find generic templates (available to all businesses)
 */
export const findGenericTemplates = async (filters?: {
  type?: TemplateType;
  industryId?: string;
}) => {
  const TemplateModel = await getDealTemplateModel();
  const query: any = {
    scope: TemplateScope.GENERIC,
    isActive: true,
  };

  if (filters?.type) query.type = filters.type;
  if (filters?.industryId) query.businessIndustry = filters.industryId;

  return TemplateModel.find(query).lean();
};

/**
 * Helper: Find business-specific templates
 */
export const findBusinessSpecificTemplates = async (businessId: string) => {
  const TemplateModel = await getDealTemplateModel();
  return TemplateModel.find({
    scope: TemplateScope.BUSINESS_SPECIFIC,
    businessId,
    isActive: true,
  }).lean();
};

/**
 * Helper: Find all templates available for a business
 * Returns both generic (for their industry) and business-specific templates
 */
export const findTemplatesForBusiness = async (
  businessId: string,
  industryId?: string
) => {
  const TemplateModel = await getDealTemplateModel();

  const query: any = {
    isActive: true,
    $or: [
      { scope: TemplateScope.BUSINESS_SPECIFIC, businessId },
      { scope: TemplateScope.GENERIC },
    ],
  };

  if (industryId) {
    // For generic templates, filter by industry
    query.$or[1].businessIndustry = industryId;
  }

  return TemplateModel.find(query).lean();
};
