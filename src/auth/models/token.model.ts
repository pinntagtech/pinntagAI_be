import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { DeviceTypes, TokenTypes } from 'src/enums/auth.enums';
import { User } from 'src/user/models/user.model';

export type TokenDocument = Token & mongoose.Document;
@Schema({ timestamps: true })
export class Token {
  @Prop()
  token: string;
  @Prop({ ref: User.name })
  userId: mongoose.Types.ObjectId;
  @Prop({
    enum: [
      TokenTypes.ACCESS,
      TokenTypes.REFRESH,
      TokenTypes.RESET_PASSWORD,
      TokenTypes.VERIFY_EMAIL,
      TokenTypes.GUEST_USER,
      TokenTypes.FCM,
    ],
    required: true,
  })
  type: string;
  @Prop()
  expiresAt: Date;
  @Prop({
    enum: [
      DeviceTypes.WEB,
      DeviceTypes.ANDROID,
      DeviceTypes.IOS,
      DeviceTypes.POSTMAN,
      DeviceTypes.MOBILE,
    ],
  })
  deviceType: string;
  @Prop({ default: false })
  isBlacklisted: boolean;
}

export const TokenSchema = SchemaFactory.createForClass(Token);

// TokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
