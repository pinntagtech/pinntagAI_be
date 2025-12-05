import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class UserSearchActivity {
  @Prop({ required: true })
  user: mongoose.Types.ObjectId;

  @Prop()
  searchText: string;

  @Prop({default:1})
  count:number;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const UserSearchActivitySchema =
  SchemaFactory.createForClass(UserSearchActivity);

UserSearchActivitySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 2592000 },
);
