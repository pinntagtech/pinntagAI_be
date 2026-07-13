import mongoose, { Schema } from "mongoose";

/**
 * Read-only mirror of the pinntagBackend `outlets` collection.
 *
 * A business can operate multiple physical branches ("outlets"). The Business
 * doc holds only a single flat HQ address plus `outlets` / `activatedOutlets`
 * ObjectId references into this collection — so multi-location businesses are
 * misrepresented unless the chat reads the outlets themselves.
 *
 * We only model the consumer-relevant fields (name + address + contact + geo).
 * pinntagAI never writes to this collection.
 */
export interface IOutlet {
  _id: mongoose.Types.ObjectId;
  name?: string;
  business?: mongoose.Types.ObjectId;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  // NOTE: on the outlet doc `country` is a plain string, unlike Business.country
  // (which is an ObjectId ref). Kept as String here to match the stored shape.
  country?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  servingRadius?: number;
  locality?: string;
  placeId?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const OutletSchema = new Schema<IOutlet>(
  {
    name: { type: String },
    business: { type: Schema.Types.ObjectId, ref: "Business" },
    address1: { type: String },
    address2: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String },
    countryCode: { type: String },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    servingRadius: { type: Number },
    locality: { type: String },
    placeId: { type: String },
    isActive: { type: Boolean },
    isDeleted: { type: Boolean },
  },
  { collection: "outlets", timestamps: true },
);

/** Bind the Outlet model onto a specific (backend) connection. */
export const getBackendOutletModel = (
  conn: mongoose.Connection,
): mongoose.Model<IOutlet> => {
  if (conn.models["Outlet"]) {
    return conn.models["Outlet"] as mongoose.Model<IOutlet>;
  }
  return conn.model<IOutlet>("Outlet", OutletSchema, "outlets");
};
