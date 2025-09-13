export enum GenderType {
  MALE = "Male",
  FEMALE = "Female",
  OTHERS = "Others",
}

export enum EventStatus {
  PUBLISHED = "published",
  DRAFT = "draft",
  ARCHIVED = "archived",
  CANCELLED = "cancelled",
}

export enum EventType {
  EVENT = "event",
  WORKSHOP = "workshop",
  CONFERENCE = "conference",
  FESTIVAL = "festival",
  CONCERT = "concert",
}

export enum CreatorType {
  BUSINESS_USER = "BusinessUser",
  INDIVIDUAL_USER = "IndividualUser",
  ORGANIZATION = "Organization",
}

export enum ProfileType {
  BUSINESS_PROFILE = "BusinessProfile",
  PERSONAL_PROFILE = "PersonalProfile",
}

export enum ScheduleType {
  FIXED_SCHEDULE = "Fixed Schedule",
  RECURRING_SCHEDULE = "Recurring Schedule",
  FLEXIBLE_SCHEDULE = "Flexible Schedule",
}

export enum AudienceType {
  GENERAL = "General",
  ADULTS = "Adults",
  FAMILIES = "Families",
  CHILDREN = "Children",
  SENIORS = "Seniors",
}

export interface LocationCoordinates {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface EventLocation {
  _id: string;
  location: LocationCoordinates;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  zip?: string;
  website?: string;
  email?: string;
  phone?: string;
  distance?: number;
}

export interface FixedSchedule {
  date: string;
  startTime: Date;
  endTime: Date;
  startDate: Date;
  endDate: Date;
}

export interface EventSchedule {
  scheduleType: ScheduleType;
  fixedSchedule?: FixedSchedule;
  recurringSchedule?: Record<string, any>;
}

export interface Category {
  _id: string;
  name: string;
  darkIcon: string;
  lightIcon: string;
  activeColor: string;
}

export interface BusinessProfile {
  _id: string;
  name: string;
  cover?: string;
  logo?: string;
  email?: string;
  bio?: string;
  description?: string;
  followersCount: number;
  isFollowedByMe: boolean;
  profileType: ProfileType;
  phone?: string;
  website?: string;
  isDeleted: boolean;
  isMe: boolean;
}

export interface Organizer {
  businessName: string;
  businessId: string;
}

export interface QRCode {
  url?: string;
  code?: string;
}

export interface ScrapedEvent {
  _id: string;
  title: string;
  keywords: string[];
  description: string;
  type: EventType;
  status: EventStatus;
  notifyFollowers: boolean;
  targetGenders: GenderType[];
  promotionCode?: string;
  isFree: boolean;
  participationCost?: number;
  bookingUrl: string[];
  termsAndConditions?: string;
  creatorType: CreatorType;
  businessProfileDetails?: BusinessProfile;
  QR_CODE: QRCode;
  isLiked: boolean;
  isSaved: boolean;
  locations: EventLocation[];
  organizer: Organizer;
  websites: string[];
  audience: AudienceType[];
  images: string[];
  score: number;
  schedules: EventSchedule[];
  categories: Category[];
  creatorDetails?: BusinessProfile;
  highlights: string[];

  // Metadata fields
  scrapedAt?: Date;
  scrapedFrom?: string;
  scraperVersion?: string;
  lastUpdated?: Date;
}

export interface ScrapedEventBatch {
  events: ScrapedEvent[];
  batchId: string;
  scrapedAt: Date;
  source: string;
  totalCount: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    data: any;
    error: string;
  }>;
}

export interface EventFilters {
  status?: EventStatus[];
  type?: EventType[];
  isFree?: boolean;
  targetGenders?: GenderType[];
  audience?: AudienceType[];
  city?: string;
  state?: string;
  keywords?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minScore?: number;
  maxCost?: number;
}

export interface EventSearchRequest {
  query?: string;
  filters?: EventFilters;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface EventResponse {
  event: ScrapedEvent;
  message?: string;
}

export interface EventListResponse {
  events: ScrapedEvent[];
  total: number;
  page: number;
  perPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}
