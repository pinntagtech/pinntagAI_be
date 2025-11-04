import mongoose, { Connection, Schema, Model } from "mongoose";

/**
 * Lightweight shadow schema for Backend `businesses` collection.
 * - Uses strict:false so we don't have to mirror all nested refs/types.
 * - Safe for read-only use from PinntagAI.
 */
const BusinessBackendSchema = new Schema(
  {
    name: String,
    logo: String,
    cover: String,
    email: String,
    phone: String,
    followersCount: Number,
    uniqueId: String,
    // Add any other fields you frequently read for better typings
  },
  {
    collection: "businesses",
    strict: false,
    timestamps: true,
  }
);

export type BusinessBackend = mongoose.InferSchemaType<
  typeof BusinessBackendSchema
> & {
  _id: mongoose.Types.ObjectId;
};

let cached: Model<BusinessBackend> | null = null;

export const getBackendBusinessModel = (conn: Connection) => {
  if (conn.models["Business"])
    return conn.models["Business"] as Model<BusinessBackend>;
  const model = conn.model<BusinessBackend>(
    "Business",
    BusinessBackendSchema,
    "businesses"
  );
  cached = model;
  return model;
};
