import mongoose, { Schema } from "mongoose";

/**
 * Read-only mirror of the pinntagBackend `broadcasts` collection.
 *
 * Broadcasts are business → audience announcements (a title + message, e.g.
 * "Closed for a private event this Saturday"). `visibility` gates who they
 * were sent to — only `public` broadcasts are safe to surface to any consumer;
 * `followers` broadcasts target the business's followers and are excluded from
 * the anonymous chat. pinntagAI never writes to this collection.
 */
export interface IBroadcast {
  _id: mongoose.Types.ObjectId;
  title?: string;
  message?: string;
  image?: string;
  business?: mongoose.Types.ObjectId;
  creator?: mongoose.Types.ObjectId;
  status?: string;
  /** "public" | "followers" */
  visibility?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BroadcastSchema = new Schema<IBroadcast>(
  {
    title: { type: String },
    message: { type: String },
    image: { type: String },
    business: { type: Schema.Types.ObjectId, ref: "Business" },
    creator: { type: Schema.Types.ObjectId },
    status: { type: String },
    visibility: { type: String },
  },
  { collection: "broadcasts", timestamps: true },
);

/** Bind the Broadcast model onto a specific (backend) connection. */
export const getBackendBroadcastModel = (
  conn: mongoose.Connection,
): mongoose.Model<IBroadcast> => {
  if (conn.models["Broadcast"]) {
    return conn.models["Broadcast"] as mongoose.Model<IBroadcast>;
  }
  return conn.model<IBroadcast>("Broadcast", BroadcastSchema, "broadcasts");
};
