import type { Connection } from "mongoose";
import { getBackendBusinessModel } from "../../models/pinntagBackend/business.model";

/**
 * Ad-hoc reads against the Backend DB from PinntagAI context.
 * Always pass in the backend connection from getBackendConnection().
 */
export const fetchBusinessById = async (
  backendConn: Connection,
  id: string
) => {
  const Business = getBackendBusinessModel(backendConn);
  return Business.findById(id).lean();
};

export const fetchBusinessesByIds = async (
  backendConn: Connection,
  ids: string[]
) => {
  const Business = getBackendBusinessModel(backendConn);
  return Business.find({ _id: { $in: ids } }).lean();
};

export const searchBusinesses = async (
  backendConn: Connection,
  q: string,
  limit = 10
) => {
  const Business = getBackendBusinessModel(backendConn);
  return Business.find({ name: { $regex: q, $options: "i" } })
    .limit(limit)
    .lean();
};
