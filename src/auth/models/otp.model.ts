import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { OtpTypes } from 'src/enums/auth.enums';
import { User } from 'src/user/models/user.model';

export type OtpDocument = Otp & mongoose.Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({
    required: true,
    enum: [OtpTypes.EMAIL, OtpTypes.MOBILE],
    default: OtpTypes.EMAIL,
  })
  type: string;
  @Prop({ required: true })
  otp: number;
  @Prop({ required: true, ref: User.name })
  user: mongoose.Types.ObjectId;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });
