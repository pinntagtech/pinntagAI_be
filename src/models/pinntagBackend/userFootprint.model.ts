import mongoose, { Schema } from "mongoose";

export enum FootprintTargetType {
  BUSINESS = "BUSINESS",
  EVENT = "EVENT",
  USER = "USER",
}

export enum FootprintAction {
  BUSINESS_VIEW = "BUSINESS_VIEW",
  EVENT_VIEW = "EVENT_VIEW",
  EVENT_LIKE = "EVENT_LIKE",
  EVENT_UNLIKE = "EVENT_UNLIKE",
  EVENT_SAVE = "EVENT_SAVE",
  EVENT_UNSAVE = "EVENT_UNSAVE",
  EVENT_SHARE = "EVENT_SHARE",
  EVENT_RSVP = "EVENT_RSVP",
  EVENT_CANCEL_RSVP = "EVENT_CANCEL_RSVP",
  EVENT_CLICK = "EVENT_CLICK",
  FOLLOW = "FOLLOW",
  UNFOLLOW = "UNFOLLOW",
  CHECK_IN = "CHECK_IN",
}

export interface IUserFootprint {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: string;
  targetType: string;
  targetId: mongoose.Types.ObjectId;
  latitude?: number | null;
  longitude?: number | null;
  location?: { type: "Point"; coordinates: [number, number] };
  createdAt: Date;
  updatedAt: Date;
}

const UserFootprintSchema = new Schema<IUserFootprint>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  { timestamps: true, strict: false },
);

UserFootprintSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
UserFootprintSchema.index({ user: 1, createdAt: -1 });
UserFootprintSchema.index({ action: 1, createdAt: -1 });

export const getUserFootprintModel = (conn: mongoose.Connection) => {
  if (conn.models["UserFootprint"]) {
    return conn.models["UserFootprint"] as mongoose.Model<IUserFootprint>;
  }
  return conn.model<IUserFootprint>(
    "UserFootprint",
    UserFootprintSchema,
    "user_footprints",
  );
};
