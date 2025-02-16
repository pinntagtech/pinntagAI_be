import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DeviceTypes } from 'src/enums/auth.enums';

export type AppVersionDocument = AppVersion & Document;
@Schema({ timestamps: true })
export class AppVersion {
  @Prop({
    required: true,
    enum: [DeviceTypes.ANDROID, DeviceTypes.IOS, DeviceTypes.WEB],
  })
  deviceType: string;
  @Prop({ required: true })
  version: string;
  @Prop()
  description: string;
}

export const AppVersionSchema = SchemaFactory.createForClass(AppVersion);
