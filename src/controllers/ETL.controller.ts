import type { Request, Response } from "express";
import { processETL } from "../services/ETL.service.js";

export const runETL = async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    const result = await processETL(input);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
