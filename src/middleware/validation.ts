import { Request, Response, NextFunction } from "express";
import { JobRunRequest } from "../utils/types/types";

export const validateJobRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { groupId, priority } = req.body as JobRunRequest;

  if (!groupId || typeof groupId !== "string") {
    res.status(400).json({ error: "groupId is required and must be a string" });
    return;
  }

  if (priority && !["low", "normal", "high"].includes(priority)) {
    res.status(400).json({ error: "priority must be low, normal, or high" });
    return;
  }

  next();
};
