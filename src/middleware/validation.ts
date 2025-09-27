import { Request, Response, NextFunction } from "express";

export const validateCreateJobRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { urls, source, output_formats } = req.body || {};

  if (urls && !Array.isArray(urls)) {
    res.status(400).json({ error: "urls must be an array of strings" });
    return;
  }
  if (output_formats && !Array.isArray(output_formats)) {
    res
      .status(400)
      .json({ error: "output_formats must be an array of strings" });
    return;
  }
  if (source && typeof source !== "string") {
    res.status(400).json({ error: "source must be a string" });
    return;
  }

  next();
};
