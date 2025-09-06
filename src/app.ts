import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.ts";

import type { Application } from "express";

dotenv.config();
connectDB();

const app: Application = express();

app.use(express.json());

// Routes
// app.use("/api/etl", ETLRoutes);

export default app;
