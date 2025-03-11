import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Role } from 'src/models/role.model';
import { BusinessProfile } from '../../business-profile/models/businessProfile.model';
import { Event } from 'src/event/models/event.model';
import { Subscription } from 'src/subscription/models/subscription.model';

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

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
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
    default: 'https://staging-pinntagbucket.s3.us-east-1.amazonaws.com/defaultimage.jpeg',
  })
  profilePhoto: string;
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
  @Prop({ ref: BusinessProfile.name })
  businessProfiles: Array<mongoose.Types.ObjectId>;
  @Prop({ ref: BusinessProfile.name })
  createdBy: mongoose.Types.ObjectId;
  @Prop({ required: true, default: 0 })
  followersCount: number;
  @Prop({ required: true, default: 0 })
  followingCount: number;
  @Prop({ default: Admin.name })
  profileType: string;
  @Prop({ ref: Event.name, default: [] })
  savedEvents: Array<mongoose.Types.ObjectId>;
  @Prop({ ref: Event.name, default: [] })
  likedEvents: Array<mongoose.Types.ObjectId>;
  @Prop()
  userAgent: string;
  @Prop()
  ipAddress: string;
  @Prop()
  stripeCustomerId: string;
  @Prop()
  savedCards: Array<string>;
  @Prop({default: 1024*1024})
  driveDefaultSpace: number;
}
export const AdminSchema = SchemaFactory.createForClass(Admin);

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
