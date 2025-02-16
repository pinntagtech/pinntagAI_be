import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Token } from './token.model';
import mongoose from 'mongoose';
import { DeviceTypes } from 'src/enums/auth.enums';

export type GuestSessionDocument = GuestSession & Document;
@Schema({ timestamps: true })
export class GuestSession {
  @Prop({ required: true })
  deviceId: string;
  @Prop({
    required: true,
    enum: [
      DeviceTypes.ANDROID,
      DeviceTypes.IOS,
      DeviceTypes.WEB,
      DeviceTypes.POSTMAN,
    ],
  })
  deviceType: string;
  @Prop({ required: true, ref: Token.name })
  token: mongoose.Types.ObjectId;
  @Prop({ default: false })
  isBlocked: boolean;
}

export const GuestSessionSchema = SchemaFactory.createForClass(GuestSession);

GuestSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
