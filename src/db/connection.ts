import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export const connectMongo = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
  logger.info(`Connected to MongoDB @ ${env.MONGODB_URI}`);
};
