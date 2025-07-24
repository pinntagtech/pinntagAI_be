import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Business } from 'src/business/model/business.model';
import { DeviceTypes, TokenTypes, UserTypes } from 'src/enums/auth.enums';

export type TokenDocument = Token & mongoose.Document;
@Schema({ timestamps: true })
export class Token {
  @Prop({ required: true, enum: Object.values(UserTypes) })
  userType: string;

  @Prop({ refPath: 'userType', default: null })
  user: mongoose.Types.ObjectId;

  @Prop({ ref: Business.name })
  businessProfile: mongoose.Types.ObjectId;

  @Prop()
  token: string;

  @Prop({ required: true, enum: Object.values(TokenTypes) })
  type: string;

  @Prop()
  expiresAt: Date;

  @Prop({ enum: Object.values(DeviceTypes) })
  deviceType: string;

  @Prop({ default: false })
  isBlacklisted: boolean;
}

export const TokenSchema = SchemaFactory.createForClass(Token);

TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
