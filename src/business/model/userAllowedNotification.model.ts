import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BusinessUser } from "./businessUser.model";
import mongoose, { Document } from "mongoose";
import { NotificationTypes } from "src/enums/event.enums";

@Schema({timestamps: true})
export class UserAllowedNotification extends Document{

    @Prop({ required: true,ref: BusinessUser.name })
    user: mongoose.Types.ObjectId;

    @Prop({type: [String], enum: NotificationTypes })
    allowedNotifications: string[];
}

export const UserAllowedNotificationSchema = SchemaFactory.createForClass(UserAllowedNotification);
