import { Connection, Model, Schema } from "mongoose";
import { getBackendConnection } from "../../db/connection";

// Enums for Backend Event
export enum EventTypes {
  FORMAL = "business_event",
  // INFORMAL = 'social_event',
  OFFER = "offer",
  PRIVATE = "private",
  // LISTING = 'listing',
  FLASHDEAL = "flashdeal",
  SPOTLIGHT = "spotlight",
  DROPPED_PIN = "dropped_pin",
}

export enum BackendEventStatus {
  DRAFTED = "DRAFTED",
  PUBLISHED = "PUBLISHED",
  CLOSED = "CLOSED",
  BLOCKED = "BLOCKED",
}

export enum BackendDiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
  BUY_ONE_GET_ONE = "BUY_ONE_GET_ONE",
}

// Sub-schemas
const DurationSchema = new Schema(
  {
    startTime: { type: Date },
    endTime: { type: Date },
  },
  { _id: false }
);

const ScheduleSchema = new Schema(
  {
    date: { type: Date },
    durations: { type: [DurationSchema] },
  },
  { _id: false }
);

// Backend Event Interface (read-only from PinntagBackend DB)
export interface IBackendEvent {
  _id: string | Schema.Types.ObjectId;
  isFromCrawler?: boolean;
  type: string;
  discountType?: string;
  discountValue?: string;
  creatorType: string;
  user: string | Schema.Types.ObjectId;
  businessProfile?: string | Schema.Types.ObjectId;
  status: string;
  categories: Array<string | Schema.Types.ObjectId>;
  drivePath?: string | Schema.Types.ObjectId;
  QR_CODE?: string | Schema.Types.ObjectId;
  images: Array<string | Schema.Types.ObjectId>;
  title: string;
  keywords: string[];
  description: string;
  schedule: Array<{
    date: Date;
    durations: Array<{ startTime: Date; endTime: Date }>;
  }>;
  eventSchedule: Array<string | Schema.Types.ObjectId>;
  locations: Array<string | Schema.Types.ObjectId>;
  minTargetAge?: number;
  maxTargetAge?: number;
  targetGenders: string[];
  promotionCode?: string;
  isFree: boolean;
  participationCost?: string;
  bookingUrl: string[];
  notifyFollowers: boolean;
  RSVP: string;
  termsApplied: boolean;
  termsAndConditions?: string;
  isPostedOnFacebook?: boolean;
  facebookPostId?: string;
  specifyForEachDay: boolean;
  participants: Array<string | Schema.Types.ObjectId>;
  offset?: string;
  eventUrl?: string;
  responses: Array<string | Schema.Types.ObjectId>;
  viewsCount: number;
  engagementCount: number;
  quantityLimit?: number;
  clientRefId?: string;
  totalLikes: number;
  totalShares: number;
  totalSaved: number;
  date_range: boolean;
  each_date: boolean;
  isDisabled: boolean;
  isSavedAsTemplate: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Backend Event Schema Definition (matches PinntagBackend structure)
export const BackendEventSchema = new Schema<IBackendEvent>(
  {
    isFromCrawler: { type: Boolean },
    type: { type: String },
    discountType: { type: String },
    discountValue: { type: String },
    creatorType: { type: String },
    user: { type: Schema.Types.ObjectId },
    businessProfile: { type: Schema.Types.ObjectId },
    status: { type: String },
    categories: [{ type: Schema.Types.ObjectId }],
    drivePath: { type: Schema.Types.ObjectId },
    QR_CODE: { type: Schema.Types.ObjectId },
    images: [{ type: Schema.Types.ObjectId }],
    title: { type: String },
    keywords: [{ type: String }],
    description: { type: String },
    schedule: [ScheduleSchema],
    eventSchedule: [{ type: Schema.Types.ObjectId }],
    locations: [{ type: Schema.Types.ObjectId }],
    minTargetAge: { type: Number },
    maxTargetAge: { type: Number },
    targetGenders: [{ type: String }],
    promotionCode: { type: String },
    isFree: { type: Boolean },
    participationCost: { type: String },
    bookingUrl: [{ type: String }],
    notifyFollowers: { type: Boolean },
    RSVP: { type: String },
    termsApplied: { type: Boolean },
    termsAndConditions: { type: String },
    isPostedOnFacebook: { type: Boolean },
    facebookPostId: { type: String },
    specifyForEachDay: { type: Boolean },
    participants: [{ type: Schema.Types.ObjectId }],
    offset: { type: String },
    eventUrl: { type: String },
    responses: [{ type: Schema.Types.ObjectId }],
    viewsCount: { type: Number },
    engagementCount: { type: Number },
    quantityLimit: { type: Number },
    clientRefId: { type: String },
    totalLikes: { type: Number },
    totalShares: { type: Number },
    totalSaved: { type: Number },
    date_range: { type: Boolean },
    each_date: { type: Boolean },
    isDisabled: { type: Boolean },
    isSavedAsTemplate: { type: Boolean },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "events", // Explicitly specify the collection name in backend DB
  }
);

// Cached model instance
let BackendEventModel: Model<IBackendEvent> | null = null;

/**
 * Get the Backend Event model (lazy-initialized)
 * Uses the secondary PinntagBackend DB connection
 *
 * @returns Promise<Model<IBackendEvent>>
 *
 * @example
 * ```typescript
 * const EventModel = await getBackendEventModel();
 * const events = await EventModel.find({ status: 'PUBLISHED' }).lean();
 * ```
 */
export const getBackendEventModel = async (): Promise<Model<IBackendEvent>> => {
  if (BackendEventModel) return BackendEventModel;

  const backendConn: Connection = await getBackendConnection();
  BackendEventModel = backendConn.model<IBackendEvent>(
    "Event",
    BackendEventSchema,
    "events"
  );

  return BackendEventModel;
};

/**
 * Helper: Find published events from backend
 */
export const findPublishedBackendEvents = async () => {
  const EventModel = await getBackendEventModel();
  return EventModel.find({
    status: BackendEventStatus.PUBLISHED,
    isDisabled: false,
  }).lean();
};

/**
 * Helper: Find events by business profile ID
 */
export const findBackendEventsByBusiness = async (
  businessProfileId: string
) => {
  const EventModel = await getBackendEventModel();
  return EventModel.find({
    businessProfile: businessProfileId,
  }).lean();
};

/**
 * Helper: Find upcoming published events
 */
export const findUpcomingBackendEvents = async () => {
  const EventModel = await getBackendEventModel();
  const now = new Date();
  return EventModel.find({
    status: BackendEventStatus.PUBLISHED,
    isDisabled: false,
    "schedule.date": { $gte: now },
  })
    .sort({ "schedule.date": 1 })
    .lean();
};

/**
 * Helper: Find event by ID
 */
export const findBackendEventById = async (eventId: string) => {
  const EventModel = await getBackendEventModel();
  return EventModel.findById(eventId).lean();
};

/**
 * Helper: Find events by status
 */
export const findBackendEventsByStatus = async (status: BackendEventStatus) => {
  const EventModel = await getBackendEventModel();
  return EventModel.find({ status }).lean();
};

/**
 * Helper: Search events by keywords
 */
export const searchBackendEvents = async (searchTerm: string) => {
  const EventModel = await getBackendEventModel();
  return EventModel.find({
    $or: [
      { title: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
      { keywords: { $in: [new RegExp(searchTerm, "i")] } },
    ],
    status: BackendEventStatus.PUBLISHED,
    isDisabled: false,
  }).lean();
};
