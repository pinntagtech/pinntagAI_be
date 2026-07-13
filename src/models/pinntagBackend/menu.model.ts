import mongoose, { Schema } from "mongoose";

/**
 * Read-only mirror of the pinntagBackend `menus` collection.
 *
 * IMPORTANT: these are *named* menu documents whose content is stored as
 * IMAGES (photos/PDF pages), not structured line items. The `menuitems`
 * collection that would hold item names + prices is empty in the backend, so
 * the chat can name the menus a business publishes ("they have a Lunch Menu
 * and a Drinks Menu") and point users to them — but it must NOT quote prices
 * or specific dishes from here, because that data does not exist.
 *
 * pinntagAI never writes to this collection.
 */
export interface IMenu {
  _id: mongoose.Types.ObjectId;
  name?: string;
  business?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  images?: string[];
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MenuSchema = new Schema<IMenu>(
  {
    name: { type: String },
    business: { type: Schema.Types.ObjectId, ref: "Business" },
    createdBy: { type: Schema.Types.ObjectId },
    images: [{ type: String }],
    type: { type: String },
  },
  { collection: "menus", timestamps: true },
);

/** Bind the Menu model onto a specific (backend) connection. */
export const getBackendMenuModel = (
  conn: mongoose.Connection,
): mongoose.Model<IMenu> => {
  if (conn.models["Menu"]) {
    return conn.models["Menu"] as mongoose.Model<IMenu>;
  }
  return conn.model<IMenu>("Menu", MenuSchema, "menus");
};
