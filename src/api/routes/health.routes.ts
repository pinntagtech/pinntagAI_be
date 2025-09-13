import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  res.json({ success: true, service: "pinntag-ai", status: "ok" });
});

healthRouter.get("/deep", async (_req, res) => {
  try {
    // const etl = await etlClient.health();
    // res.json({ success: true, ai: "ok", etl });
  } catch (e: any) {
    res
      .status(502)
      .json({ success: false, error: "ETL unreachable", details: e?.message });
  }
});
