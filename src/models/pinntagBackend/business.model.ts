import mongoose, { Schema, Document } from "mongoose";

export interface SocialMediaTokenDetails {
  value?: string;
  age?: Date;
}

interface Duration {
  startHour?: number;
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
}

export interface DaySchedule {
  duration?: Duration;
}

export interface Schedule {
  weekDays?: {
    sunday?: DaySchedule;
    monday?: DaySchedule;
    tuesday?: DaySchedule;
    wednesday?: DaySchedule;
    thursday?: DaySchedule;
    friday?: DaySchedule;
    saturday?: DaySchedule;
  };
}

interface Hours {
  hour?: number;
  minute?: number;
}

interface TimeBracket {
  startTime?: Hours;
  endTime?: Hours;
}

export enum CreatorType {
  Admin = "Admin",
  BusinessUser = "BusinessUser",
}

export const ConnectStatus = {
  ONBOARDED: "onboarded",
  PENDING: "pending",
  REJECTED: "rejected",
};

export const BusinessStructure = {
  INDIVIDUAL: "individual",
  COMPANY: "company",
};

export interface StripeAccountStatus {
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  currently_due?: string[];
  disabled_reason?: string | null;
  lastUpdatedAt?: Date;
}

export interface FacebookPageInfo {
  name?: string;
  about?: string;
  category?: string;
  followers?: number;
  website?: string;
  phone?: string;
  email?: string;
  profilePicture?: string;
  coverPhoto?: string;
}

export interface FacebookMetaData {
  pageId?: string;
  pageAccessToken?: string;
  tokenExpiresAt?: Date;
  pageInfo?: FacebookPageInfo;
}

export interface IBusiness extends Document {
  isDeleted?: boolean;
  isFromCrawler?: boolean;
  status?: number;
  logo?: string | null;
  logoThumbnail?: string | null;
  activeSubscription?: mongoose.Types.ObjectId;
  isRegistered?: boolean;
  businessCategories?: mongoose.Types.ObjectId[];
  businessIndustry?: mongoose.Types.ObjectId;
  cover?: string | null;
  coverThumbnail?: string | null;
  constitution?: mongoose.Types.ObjectId;
  documentNumber?: string;
  description?: string;
  documentType?: mongoose.Types.ObjectId;
  brand?: mongoose.Types.ObjectId;
  authorisedUser?: mongoose.Types.ObjectId;
  boardMembers?: mongoose.Types.ObjectId[];
  creatorType?: CreatorType;
  creator?: mongoose.Types.ObjectId;
  name?: string;
  bio?: string;
  outlets?: mongoose.Types.ObjectId[];
  activatedOutlets?: mongoose.Types.ObjectId[];
  countryCode?: string;
  phone?: string;
  email?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: mongoose.Types.ObjectId;
  placeId?: string;
  regularTiming?: Schedule;
  dataFetchedFromGoogle?: boolean;
  latitude?: number;
  longitude?: number;
  county?: string;
  isActive?: boolean;
  openingTime?: Hours;
  closingTime?: Hours;
  busyTime?: TimeBracket;
  slowTime?: TimeBracket;
  postalCode?: string;
  followersCount?: number;
  followingCount?: number;
  foundationYear?: number;
  vatNumber?: string;
  foodHygieneRating?: number;
  menus?: string[];
  allergenInformation?: any[];
  acceptsReservations?: boolean;
  reservationPolicy?: string;
  paymentMethods?: string[];
  reviews?: any[];
  promotions?: any[];
  covidSafetyMeasures?: string[];
  isWheelchairAccessible?: boolean;
  isParkingAvailable?: boolean;
  sustainabilityEfforts?: string;
  insuranceDetails?: any;
  taxInformation?: any;
  healthAndSafetyPolicies?: string[];
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  drive?: mongoose.Types.ObjectId;
  galleryPath?: mongoose.Types.ObjectId;
  isPhysicalType?: boolean;
  physicalUnits?: number;
  isMobileType?: boolean;
  mobileUnits?: number;
  isOnlineType?: boolean;
  mobileUnitsCreated?: number;
  physicalUnitsCreated?: number;
  continueJourney?: boolean;
  journeyStatus?: number;
  teamSize?: {
    min?: number;
    max?: number | null;
  };
  roleOfCreator?: string;
  onboardingOfferStatus?: number;
  isOnboardingOfferDone?: boolean;
  initialOfferId?: mongoose.Types.ObjectId;
  scalabilityFactor?: number;
  rating?: number;
  userRatingCount?: number;
  stripeCustomerId?: string;
  tags?: string[];
  addressVerificationDocs?: string[];
  verificationStatus?: string;
  verificationRemarks?: string;
  addressVerifiedBy?: mongoose.Types.ObjectId;
  uniqueId?: string;
  profileCompletionPercentage?: number;
  QRCode?: string;
  appRedirectLink?: string;
  isAgentCreated?: boolean;
  viewsCount?: number;
  stripeAccountId?: string;
  connectStatus?: string;
  stripeOnboardingComplete?: boolean;
  stripeAccountStatus?: StripeAccountStatus;
  businessStructure?: string;
  isFacebookConnected?: boolean;
  facebookMetaData?: FacebookMetaData;
  isInstagramConnected?: boolean;
  instagramToken?: SocialMediaTokenDetails;
  instagramPageUrl?: string;
  isXConnected?: boolean;
  XToken?: SocialMediaTokenDetails;
  XPageUrl?: string;
  isFacebookDatafetched?: boolean;
  lastFacebookDatafetched?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const FacebookPageInfoSchema = new Schema(
  {
    name: { type: String },
    about: { type: String },
    category: { type: String },
    followers: { type: Number },
    website: { type: String },
    phone: { type: String },
    email: { type: String },
    profilePicture: { type: String },
    coverPhoto: { type: String },
  },
  { _id: false }
);

const FacebookMetaDataSchema = new Schema(
  {
    pageId: { type: String },
    pageAccessToken: { type: String },
    tokenExpiresAt: { type: Date },
    pageInfo: { type: FacebookPageInfoSchema },
  },
  { _id: false }
);

const StripeAccountStatusSchema = new Schema(
  {
    charges_enabled: { type: Boolean, default: false },
    payouts_enabled: { type: Boolean, default: false },
    details_submitted: { type: Boolean, default: false },
    currently_due: { type: [String], default: [] },
    disabled_reason: { type: String, default: null },
    lastUpdatedAt: { type: Date },
  },
  { _id: false }
);

const BusinessSchema = new Schema<IBusiness>(
  {
    isDeleted: { type: Boolean, default: false },
    isFromCrawler: { type: Boolean, default: false },
    status: { type: Number, default: 0 },
    logo: { type: String, default: null },
    logoThumbnail: { type: String, default: null },
    activeSubscription: { type: Schema.Types.ObjectId, ref: "Subscription" },
    isRegistered: { type: Boolean },
    businessCategories: [
      { type: Schema.Types.ObjectId, ref: "BusinessCategory" },
    ],
    businessIndustry: { type: Schema.Types.ObjectId, ref: "BusinessIndustry" },
    cover: { type: String, default: null },
    coverThumbnail: { type: String, default: null },
    constitution: { type: Schema.Types.ObjectId, ref: "BusinessConstitution" },
    documentNumber: { type: String },
    description: { type: String },
    documentType: { type: Schema.Types.ObjectId, ref: "BusinessDocumentType" },
    brand: { type: Schema.Types.ObjectId, ref: "Brand" },
    authorisedUser: { type: Schema.Types.ObjectId, ref: "BusinessUser" },
    boardMembers: [{ type: Schema.Types.ObjectId, ref: "BusinessUser" }],
    creatorType: { type: String, enum: Object.values(CreatorType) },
    creator: { type: Schema.Types.ObjectId, refPath: "creatorType" },
    name: { type: String },
    bio: { type: String },
    outlets: [{ type: Schema.Types.ObjectId, ref: "Outlet" }],
    activatedOutlets: [{ type: Schema.Types.ObjectId, ref: "Outlet" }],
    countryCode: { type: String },
    phone: { type: String },
    email: { type: String },
    isEmailVerified: { type: Boolean },
    isPhoneVerified: { type: Boolean },
    website: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    addressLine3: { type: String },
    city: { type: String },
    district: { type: String },
    state: { type: String },
    country: { type: Schema.Types.ObjectId, ref: "BusinessCountry" },
    placeId: { type: String },
    regularTiming: { type: Schema.Types.Mixed },
    dataFetchedFromGoogle: { type: Boolean, default: false },
    latitude: { type: Number },
    longitude: { type: Number },
    county: { type: String },
    isActive: { type: Boolean, default: true },
    openingTime: { type: Schema.Types.Mixed },
    closingTime: { type: Schema.Types.Mixed },
    busyTime: { type: Schema.Types.Mixed },
    slowTime: { type: Schema.Types.Mixed },
    postalCode: { type: String },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    foundationYear: { type: Number },
    vatNumber: { type: String },
    foodHygieneRating: { type: Number },
    menus: [{ type: String }],
    allergenInformation: { type: Schema.Types.Mixed },
    acceptsReservations: { type: Boolean },
    reservationPolicy: { type: String },
    paymentMethods: [{ type: String }],
    reviews: { type: Schema.Types.Mixed },
    promotions: { type: Schema.Types.Mixed },
    covidSafetyMeasures: [{ type: String }],
    isWheelchairAccessible: { type: Boolean },
    isParkingAvailable: { type: Boolean },
    sustainabilityEfforts: { type: String },
    insuranceDetails: { type: Schema.Types.Mixed },
    taxInformation: { type: Schema.Types.Mixed },
    healthAndSafetyPolicies: [{ type: String }],
    managerName: { type: String },
    managerEmail: { type: String },
    managerPhone: { type: String },
    drive: { type: Schema.Types.ObjectId, ref: "Drive" },
    galleryPath: { type: Schema.Types.ObjectId, ref: "Folder" },
    isPhysicalType: { type: Boolean, default: false },
    physicalUnits: { type: Number, default: 0 },
    isMobileType: { type: Boolean, default: false },
    mobileUnits: { type: Number, default: 0 },
    isOnlineType: { type: Boolean, default: false },
    mobileUnitsCreated: { type: Number, default: 0 },
    physicalUnitsCreated: { type: Number, default: 0 },
    continueJourney: { type: Boolean, default: true },
    journeyStatus: { type: Number },
    teamSize: {
      type: {
        min: { type: Number },
        max: { type: Number, default: null },
      },
      _id: false,
    },
    roleOfCreator: { type: String },
    onboardingOfferStatus: { type: Number, default: 0 },
    isOnboardingOfferDone: { type: Boolean, default: false },
    initialOfferId: { type: Schema.Types.ObjectId, ref: "Event" },
    scalabilityFactor: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    userRatingCount: { type: Number, default: 0 },
    stripeCustomerId: { type: String },
    tags: [{ type: String }],
    addressVerificationDocs: [{ type: String }],
    verificationStatus: { type: String, default: "NOT_VERIFIED" },
    verificationRemarks: { type: String },
    addressVerifiedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    uniqueId: { type: String },
    profileCompletionPercentage: { type: Number, default: 0 },
    QRCode: { type: String },
    appRedirectLink: { type: String },
    isAgentCreated: { type: Boolean, default: false },
    viewsCount: { type: Number, default: 0 },
    stripeAccountId: { type: String },
    connectStatus: { type: String, default: ConnectStatus.PENDING },
    stripeOnboardingComplete: { type: Boolean, default: false },
    stripeAccountStatus: { type: StripeAccountStatusSchema },
    businessStructure: { type: String, enum: Object.values(BusinessStructure) },
    isFacebookConnected: { type: Boolean, default: false },
    facebookMetaData: { type: FacebookMetaDataSchema },
    isInstagramConnected: { type: Boolean, default: false },
    instagramToken: { type: Schema.Types.Mixed, default: {} },
    instagramPageUrl: { type: String },
    isXConnected: { type: Boolean, default: false },
    XToken: { type: Schema.Types.Mixed, default: {} },
    XPageUrl: { type: String },
    isFacebookDatafetched: { type: Boolean, default: false },
    lastFacebookDatafetched: { type: Date },
  },
  {
    collection: "businesses",
    timestamps: true,
  }
);

const generateRandomDigits = (length: number): string =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");

const generateRandomLetters = (length: number): string =>
  Array.from({ length }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join("");

const generateNamePrefix = (name: string): string => {
  const upperName = (name || "").replace(/[^A-Z]/gi, "").toUpperCase();

  if (upperName.length >= 4) {
    return upperName.substring(0, 4);
  }

  // pad with random letters if name is short
  const padding = generateRandomLetters(4 - upperName.length);
  return upperName + padding;
};

// pre-save hook
BusinessSchema.pre<IBusiness>("save", function (next) {
  if (!this.uniqueId) {
    const prefix = generateNamePrefix(this.name || ""); // 4 letters
    const digits = generateRandomDigits(3); // 3 digits
    const letters = generateRandomLetters(3); // 3 letters

    this.uniqueId = `${prefix}${digits}${letters}`;
  }
  next();
});

export const BusinessModel = mongoose.model<IBusiness>(
  "Business",
  BusinessSchema,
  "businesses"
);

export type BusinessBackend = IBusiness;

// Helper function to get the backend business model with a specific connection
export const getBackendBusinessModel = (conn: mongoose.Connection) => {
  if (conn.models["Business"]) {
    return conn.models["Business"] as mongoose.Model<IBusiness>;
  }
  return conn.model<IBusiness>("Business", BusinessSchema, "businesses");
};
