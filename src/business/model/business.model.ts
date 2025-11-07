import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Outlet } from '../../outlet/model/outlet.model';
import { Brand } from './brand.model';
import { Folder } from 'src/drive/models/folder.model';
import { BusinessCategory } from './businessCategory.model';
import { BusinessIndustry } from './businessIndustry.model';
import { BusinessCountry } from './businessCountry.model';
import { BusinessConstitution } from './businessConstitution.model';
import { BusinessDocumentType } from './BussinessDocumentType.model';
import {
  BusinessStatus,
  DEFAULT_IMAGES,
  OfferStatus,
  ScalabilityFactor,
  VerificationStatus,
} from '../enums/business.enum';
import { Event } from 'src/event/models/event.model';
import {
  Allergen,
  Insurance,
  OpeningHours,
  Promotion,
  Review,
  TaxDetails,
} from './types.model';
import { Menu } from './menu.model';
import { Admin } from 'src/admin/models/admin.model';
import { Drive } from 'src/drive/models/drive.model';

export class SocialMediaTokenDetails {
  value: string;
  age: Date;
}

class Hours {
  hour: number;
  minute: number;
}
class TimeBracket {
  startTime: Hours;
  endTime: Hours;
}

export enum CreatorType {
  Admin = 'Admin',
  BusinessUser = 'BusinessUser',
}

export type BusinessDocument = Business & Document;

@Schema({ timestamps: true })
export class Business {
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isFromCrawler: boolean;

  @Prop({
    required: true,
    enum: Object.values(BusinessStatus),
    default: 0,
  })
  status: number;

  // @Prop({crea
  //   required: true,
  //   enum: [0, 1, 2],
  //   default: 0,
  // })
  // status: number;
  @Prop({
    default: DEFAULT_IMAGES.BUSINESS_LOGO,
  })
  logo: string;

  @Prop({
    default: DEFAULT_IMAGES.BUSINESS_LOGO,
  })
  logoThumbnail: string;

  @Prop({ ref: 'Subscription' })
  activeSubscription: mongoose.Types.ObjectId;

  @Prop()
  isRegistered: boolean;

  @Prop({ ref: BusinessCategory.name })
  businessCategories: mongoose.Types.ObjectId[];

  @Prop({ ref: BusinessIndustry.name, type: mongoose.Types.ObjectId })
  businessIndustry: mongoose.Types.ObjectId;

  @Prop({
    default: DEFAULT_IMAGES.BUSINESS_COVER,
  })
  cover: string;
  @Prop({
    default: DEFAULT_IMAGES.BUSINESS_COVER,
  })
  coverThumbnail: string;


  @Prop({ ref: BusinessConstitution.name })
  constitution: mongoose.Types.ObjectId;

  @Prop()
  documentNumber: string;

  @Prop()
  description: string;

  @Prop({ ref: BusinessDocumentType.name })
  documentType: mongoose.Types.ObjectId;

  @Prop({ ref: Brand.name })
  brand: mongoose.Types.ObjectId;

  @Prop({ ref: 'BusinessUser' })
  authorisedUser: mongoose.Types.ObjectId; //owner of the business

  @Prop({ ref: 'BusinessUser' })
  boardMembers: mongoose.Types.ObjectId[];

  @Prop({ enum: Object.values(CreatorType), type: String, required: true })
  creatorType: CreatorType;

  @Prop({ required: true, refPath: 'creatorType' })
  creator: mongoose.Types.ObjectId;

  @Prop()
  name: string;
  @Prop()
  bio: string;
  @Prop({ ref: Outlet.name })
  outlets: Array<mongoose.Types.ObjectId>;
  @Prop()
  countryCode: string;
  @Prop()
  phone: string;
  @Prop()
  email: string;

  @Prop()
  isEmailVerified: boolean;

  @Prop()
  isPhoneVerified: boolean;

  @Prop()
  website: string;
  @Prop()
  addressLine1: string;
  @Prop()
  addressLine2: string;
  @Prop()
  addressLine3: string;
  @Prop()
  city: string;
  @Prop()
  district: string;
  @Prop()
  state: string;
  @Prop({ ref: BusinessCountry.name })
  country: mongoose.Types.ObjectId;

  @Prop()
  latitude: number;

  @Prop()
  longitude: number;

  @Prop()
  county: string;
  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  openingTime: Hours;
  @Prop()
  closingTime: Hours;
  @Prop()
  busyTime: TimeBracket;
  @Prop()
  slowTime: TimeBracket;

  @Prop()
  postalCode: string;
  @Prop({ default: 0 })
  followersCount: number;
  @Prop({ default: 0 })
  followingCount: number;
  @Prop()
  foundationYear: number;
  @Prop()
  vatNumber: string; // VAT registration number, if applicable
  @Prop()
  foodHygieneRating: number; // Food Standards Agency (FSA) hygiene rating
  @Prop()
  menus: string[]; // Array of menu items with details
  @Prop()
  allergenInformation: Allergen[]; // Array of allergens present in the dishes
  @Prop()
  acceptsReservations: boolean; // Indicates if reservations are accepted
  @Prop()
  reservationPolicy: string; // Details about the reservation policy
  @Prop()
  paymentMethods: string[]; // Array of accepted payment methods
  @Prop()
  reviews: Review[]; // Array of customer reviews and ratings
  @Prop()
  promotions: Promotion[]; // Array of ongoing promotions or discounts
  @Prop()
  covidSafetyMeasures: string[]; // Array of COVID-19 safety measures in place
  @Prop()
  isWheelchairAccessible: boolean; // Indicates if the restaurant is wheelchair accessible
  @Prop()
  isParkingAvailable: boolean; // Indicates if parking is available
  @Prop()
  sustainabilityEfforts: string; // Details about sustainability and environmental responsibility
  @Prop()
  insuranceDetails: Insurance; // Details about public liability insurance
  @Prop({ type: TaxDetails })
  taxInformation: TaxDetails; // Details about tax compliance
  @Prop()
  healthAndSafetyPolicies: string[]; // Array of health and safety policies
  @Prop({ default: false })
  isFacebookConnected: boolean;
  @Prop({ default: {} })
  facebookToken: SocialMediaTokenDetails;
  @Prop()
  facebookPageUrl: string;
  @Prop({ default: false })
  isInstagramConnected: boolean;
  @Prop({ default: {} })
  instagramToken: SocialMediaTokenDetails;
  @Prop()
  instagramPageUrl: string;
  @Prop({ default: false })
  isXConnected: boolean;
  @Prop({ default: {} })
  XToken: SocialMediaTokenDetails;
  @Prop()
  XPageUrl: string;
  @Prop()
  managerName: string;
  @Prop()
  managerEmail: string;
  @Prop()
  managerPhone: string;
  @Prop({ ref: 'Drive' })
  drive: mongoose.Types.ObjectId;

  @Prop({ default: false })
  isPhysicalType: boolean;
  @Prop({ default: 0 })
  physicalUnits: number;

  @Prop({ default: false })
  isMobileType: boolean;
  @Prop({ default: 0 })
  mobileUnits: number;

  @Prop({ default: false })
  isOnlineType: boolean;

  @Prop({ default: 0 })
  mobileUnitsCreated: number;

  @Prop({ default: 0 })
  physicalUnitsCreated: number;

  @Prop({ default: true })
  continueJourney: boolean;

  @Prop({})
  journeyStatus: number;

  @Prop({
    type: {
      min: { type: Number },
      max: { type: Number, default: null },
    },
    _id: false,
  })
  teamSize: {
    min: number;
    max: number | null;
  };
  @Prop()
  roleOfCreator: string;

  @Prop({
    enum: Object.values(OfferStatus),
    default: 0,
  })
  onboardingOfferStatus: number;

  @Prop({ default: false })
  isOnboardingOfferDone: boolean;

  @Prop({ ref: 'Event' })
  initialOfferId: mongoose.Types.ObjectId;

  @Prop({ default: 0, enum: Object.values(ScalabilityFactor) })
  scalabilityFactor: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop()
  stripeCustomerId: string;

  @Prop()
  tags: string[];

  @Prop()
  addressVerificationDoc: string;

  @Prop({
    enum: Object.values(VerificationStatus),
    default: VerificationStatus.PENDING,
  })
  addressVerificationStatus: string;

  @Prop({ ref: Admin.name })
  addressVerifiedBy: mongoose.Types.ObjectId;

  @Prop()
  uniqueId: string;

  @Prop({ default: 0 })
  profileCompletionPercentage: number;

  @Prop()
  QRCode: string;

  @Prop()
  appRedirectLink: string;

  // @Prop({default:false})
  // skipToDashboard: boolean;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);

export const generateRandomCode = (): string => {
  const getRandomDigit = () => Math.floor(Math.random() * 10).toString();
  const getRandomLetter = () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z

  const digits1 = Array.from({ length: 4 }, getRandomDigit).join('');
  const letters = Array.from({ length: 4 }, getRandomLetter).join('');
  const digits2 = Array.from({ length: 4 }, getRandomDigit).join('');

  return `${digits1}-${letters}-${digits2}`;
};
const generateNamePrefix = (name: string): string => {
  const upperName = (name || '').toUpperCase();
  const needed = 4 - upperName.length;
  if (needed > 0) {
    // pad with random letters
    const randomLetters = Array.from({ length: needed }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    ).join('');
    return upperName + randomLetters;
  }
  return upperName.substring(0, 4);
};

// pre-save hook
BusinessSchema.pre<BusinessDocument>('save', function (next) {
  if (!this.uniqueId) {
    const prefix = generateNamePrefix(this.name);
    const code = generateRandomCode();
    this.uniqueId = `${prefix}-${code}`;
  }
  next();
});
