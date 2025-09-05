import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from 'src/user/models/user.model';
import { Business } from './business.model';
import { OwnershipTransferStatus } from '../enums/business.enum';
import { BusinessUser } from './businessUser.model';

@Schema({ timestamps: true })
export class OwnershipTransferRecord extends Document {
  @Prop({ ref: Business.name })
  business: mongoose.Types.ObjectId;

  @Prop({ ref: BusinessUser.name })
  user: mongoose.Types.ObjectId;

  @Prop()
  transferDate: Date;

  @Prop({ required: true })
  email: string;

  @Prop({ enum: Object.values(OwnershipTransferStatus), default: 0 })
  status: number;
}

export const OwnershipTransferRecordSchema = SchemaFactory.createForClass(
  OwnershipTransferRecord,
);
