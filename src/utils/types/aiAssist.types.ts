// ===========================
// AI Assist Types
// ===========================

/**
 * Content type for AI assistance
 */
export type ContentType = "broadcast" | "offer" | "reward" | "event";

/**
 * Image generation style options
 */
export type ImageStyle =
  | "photorealistic"
  | "illustration"
  | "minimal"
  | "vibrant"
  | "professional"
  | "artistic";

/**
 * Image aspect ratio options
 */
export type ImageAspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

// ===========================
// Content Generation Types
// ===========================

/**
 * Base parameters for content generation
 */
export interface BaseContentParams {
  businessId: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  tone?: "professional" | "casual" | "friendly" | "exciting" | "urgent";
  targetAudience?: string;
  additionalContext?: string;
}

/**
 * Parameters for broadcast content generation
 */
export interface BroadcastContentParams extends BaseContentParams {
  purpose: "announcement" | "update" | "reminder" | "promotion" | "general";
  keyMessage: string;
  urgency?: "low" | "medium" | "high";
}

/**
 * Parameters for offer content generation
 */
export interface OfferContentParams extends BaseContentParams {
  offerType: "discount" | "bogo" | "freebie" | "bundle" | "loyalty";
  discountValue?: number;
  discountType?: "percentage" | "fixed" | "buy_one_get_one";
  product?: string;
  validityPeriod?: string;
  minPurchase?: number;
}

/**
 * Parameters for reward content generation
 */
export interface RewardContentParams extends BaseContentParams {
  rewardType: "points" | "cashback" | "freeItem" | "upgrade" | "exclusive";
  rewardValue?: string;
  conditions?: string;
  expiryDays?: number;
}

/**
 * Parameters for event content generation
 */
export interface EventContentParams extends BaseContentParams {
  eventType: "workshop" | "sale" | "launch" | "celebration" | "seasonal" | "community";
  eventName?: string;
  date?: string;
  time?: string;
  location?: string;
  capacity?: number;
  isFree?: boolean;
  cost?: number;
}

/**
 * Parameters for improving existing content
 */
export interface ImproveContentParams {
  businessId: string;
  contentType: ContentType;
  existingContent: {
    title?: string;
    description?: string;
    callToAction?: string;
    terms?: string;
  };
  feedback: string;
  aspectToImprove?: "clarity" | "engagement" | "urgency" | "brevity" | "detail";
}

// ===========================
// Image Generation Types
// ===========================

/**
 * Parameters for image generation
 */
export interface ImageGenerationParams {
  businessId: string;
  prompt: string;
  contentType: ContentType;
  style?: ImageStyle;
  aspectRatio?: ImageAspectRatio;
  includeText?: string;
  colorScheme?: string;
  brandElements?: string;
}

/**
 * Parameters for image editing
 */
export interface ImageEditParams {
  businessId: string;
  imageUrl: string;
  editPrompt: string;
  preserveElements?: string[];
}

/**
 * Parameters for generating content-specific images
 */
export interface ContentImageParams {
  businessId: string;
  contentType: ContentType;
  title: string;
  description?: string;
  style?: ImageStyle;
  aspectRatio?: ImageAspectRatio;
  brandColors?: string[];
  includeLogoSpace?: boolean;
  // Additional context for better image generation
  category?: string;
  subcategory?: string;
  tags?: string[];
  dealType?: string;
  discountValue?: number;
  discountType?: string;
  eventType?: string;
  targetAudience?: string;
  tone?: string;
  callToAction?: string;
  promoCode?: string;
}

// ===========================
// Response Types
// ===========================

/**
 * Generated content response
 */
export interface GeneratedContent {
  title: string;
  description: string;
  callToAction?: string;
  hashtags?: string[];
  keywords?: string[];
  termsAndConditions?: string;
  suggestedTiming?: {
    bestDays?: string[];
    bestHours?: string[];
    seasonalNote?: string;
  };
  promoCode?: string;
  marketingTips?: string[];
}

/**
 * Generated image response
 */
export interface GeneratedImage {
  imageUrl: string;
  thumbnailUrl?: string;
  s3Key: string;
  mimeType: string;
  width?: number;
  height?: number;
  prompt: string;
  style?: ImageStyle;
}

/**
 * Subscription access response
 */
export interface SubscriptionAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeUrl?: string;
  currentPlan?: string;
  requiredPlan?: string;
}

// ===========================
// API Request/Response Types
// ===========================

/**
 * API request for content generation
 */
export interface ContentGenerationRequest {
  type: ContentType;
  params: BroadcastContentParams | OfferContentParams | RewardContentParams | EventContentParams;
}

/**
 * API response for content generation
 */
export interface ContentGenerationResponse {
  success: boolean;
  content?: GeneratedContent;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * API response for image generation
 */
export interface ImageGenerationResponse {
  success: boolean;
  image?: GeneratedImage;
  error?: string;
  subscriptionRequired?: boolean;
}

/**
 * API response for content improvement
 */
export interface ContentImprovementResponse {
  success: boolean;
  improvedContent?: GeneratedContent;
  changes?: string[];
  error?: string;
}
