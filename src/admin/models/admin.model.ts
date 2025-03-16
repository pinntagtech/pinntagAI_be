import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Role } from 'src/roles/models/roles.model';

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

export const AdminCreatorType = ['System', 'Admin'];

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ enum: Object.values(AdminCreatorType) })
  creatorType: string;

  @Prop({ ref: 'Admin' })
  creator: mongoose.Types.ObjectId;

  @Prop({ default: false })
  isSuperAdmin: boolean;

  @Prop({ required: true, ref: 'Role' })
  role: mongoose.Types.ObjectId;

  @Prop({ default: '' })
  firstName: string;

  @Prop({ default: '' })
  lastName: string;

  @Prop({ default: '' })
  name: string;

  @Prop({
    default:
      'https://staging-pinntagbucket.s3.us-east-1.amazonaws.com/defaultimage.jpeg',
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

  @Prop({ default: null })
  password: string;

  @Prop()
  latitude: number;

  @Prop()
  longitude: number;

  @Prop({ default: 1024 * 1024 * 1024 })
  driveDefaultSpace: number;
}
export const AdminSchema = SchemaFactory.createForClass(Admin);

//Restrict that no admin can be created with isSuperAdmin set to true
AdminSchema.pre('save', function (next) {
  if (this.$locals?.isSeeding) {
    return next();
  }

  if (this.isSuperAdmin) {
    this.isSuperAdmin = false;
  }
  next();
});

//Restrict that no admin can be deleted with isSuperAdmin set to true
AdminSchema.pre('deleteOne', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be deleted');
  }
  next();
});

AdminSchema.pre('deleteMany', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be deleted');
  }
  next();
});

AdminSchema.pre('findOneAndDelete', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be deleted');
  }
  next();
});

AdminSchema.pre('updateOne', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be updated');
  }
  next();
});

AdminSchema.pre('updateMany', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be updated');
  }
  next();
});
AdminSchema.pre('findOneAndUpdate', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be updated');
  }
  next();
});
