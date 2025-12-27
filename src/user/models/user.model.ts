import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
// import { BusinessProfile } from '../../business-profile/models/businessProfile.model';
import { Event } from 'src/event/models/event.model';
import { Subscription } from 'src/subscription/models/subscription.model';
import { Refferal } from '../../subscription/models/referral.model';
import { Drive } from 'src/drive/models/drive.model';
import { Role } from 'src/roles/models/roles.model';
import { UserProfileStatus } from 'src/enums/user.enum';

export const Genders = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  RATHER_NOT_SAY: 'rather_not_say',
};
export const SignupMethod = {
  EMAIL: 'email',
  PHONE: 'phone',
};

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ default: false })
  isDeleted: boolean;
  @Prop({ required: true, ref: Role.name })
  role: mongoose.Types.ObjectId;
  @Prop({ default: '' })
  firstName: string;
  @Prop({ default: '' })
  lastName: string;
  @Prop({ default: '' })
  name: string;

  @Prop({
    required: true,
    enum: Object.values(UserProfileStatus),
    default: UserProfileStatus.INITIATED,
  })
  status: number;

  @Prop({
    default:
      'https://pinntag-assets.s3.us-east-1.amazonaws.com/Defaults/Default+user+logo.png',
  })
  profilePhoto: string;
  @Prop({
    default:
      'https://pinntag-assets.s3.us-east-1.amazonaws.com/Defaults/Default+user+logo.png',
  })
  thumbnail: string;

  @Prop({ unique: true, sparse: true })
  email: string;
  @Prop({ default: false })
  isEmailVerified: boolean;
  @Prop()
  countryCode: string;
  @Prop()
  phone: string;
  @Prop({ unique: true, sparse: true })
  fullPhoneNumber: string;
  @Prop({ default: false })
  isPhoneVerified: boolean;
  @Prop({ default: null })
  password: string;
  @Prop()
  latitude: number;
  @Prop()
  longitude: number;
  @Prop({ default: false })
  isOAuth: boolean;
  @Prop({
    enum: [Genders.MALE, Genders.FEMALE, Genders.OTHER, Genders.RATHER_NOT_SAY],
  })
  gender: string;
  @Prop()
  age: number;

  @Prop()
  dob: Date;

  @Prop()
  oAuthProvider: string;
  @Prop({ default: false })
  hasSubscribedForBusiness: boolean;
  @Prop({ ref: Subscription.name })
  subscriptions: Array<mongoose.Types.ObjectId>;
  @Prop({ default: false })
  isBusiness: boolean;
  // @Prop({ ref: BusinessProfile.name })
  // businessProfiles: Array<mongoose.Types.ObjectId>;
  // @Prop({ ref: Business.name })
  // createdBy: mongoose.Types.ObjectId;
  @Prop({ required: true, default: 0 })
  followersCount: number;
  @Prop({ required: true, default: 0 })
  followingCount: number;
  @Prop({ default: User.name })
  profileType: string;
  @Prop({ ref: Event.name, default: [] })
  savedEvents: Array<mongoose.Types.ObjectId>;
  @Prop({ ref: Event.name, default: [] })
  likedEvents: Array<mongoose.Types.ObjectId>;
  @Prop()
  userAgent: string;
  @Prop()
  ipAddress: string;
  @Prop({ ref: Refferal.name })
  refferal: mongoose.Types.ObjectId;
  @Prop()
  stripeCustomerId: string;
  @Prop()
  savedCards: Array<string>;
  @Prop()
  drive: mongoose.Types.ObjectId;

  @Prop({ default: false })
  privacyConsent: boolean;

  @Prop()
  consentTimestamp: Date;

  @Prop()
  accountDeletionSchedulerId: string;

  @Prop()
  bio: string;

  @Prop()
  userName: string;

  @Prop({ default: true })
  checkInDetection: boolean;

}
export const UserSchema = SchemaFactory.createForClass(User);


const generateRandomDigits = (length: number): string =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');

const generateRandomLetters = (length: number): string =>
  Array.from({ length }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  ).join('');

const generateNamePrefix = (name: string): string => {
  const upperName = (name || '').replace(/[^A-Z]/gi, '').toUpperCase();

  if (upperName.length >= 4) {
    return upperName.substring(0, 4);
  }

  // pad with random letters if name is short
  const padding = generateRandomLetters(4 - upperName.length);
  return upperName + padding;
};

// pre-save hook
UserSchema.pre<UserDocument>('save', function (next) {
  if (!this.userName) {
    const prefix = generateNamePrefix(this.name); // 4 letters
    const digits = generateRandomDigits(3); // 3 digits
    const letters = generateRandomLetters(3); // 3 letters

    this.userName = `${prefix}${digits}${letters}`;
  }
  next();
});

// Function to crypt password (if it is present) before save
// UserSchema.pre<User>('save', function (next) {
//   if (!this.password) {
//     this.password = bcrypt.hashSync(this.password, 10);
//   }
//   next();
// });
// UserSchema.pre<User>('save', async function (next) {
//   this.name =
//     `${this.firstName ? this.firstName : ''} ${this.lastName ? this.lastName : ''}`.trim();
//   next();
// });
