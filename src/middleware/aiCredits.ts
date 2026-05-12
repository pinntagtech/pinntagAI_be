import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { getBackendConnection } from "../db/connection.js";
import {
  AI_CREDIT_TYPE,
  AiCreditType,
  getBackendAdminModel,
} from "../models/pinntagBackend/admin.model.js";
import { getBackendCreditWalletModel } from "../models/pinntagBackend/creditWallet.model.js";
import { logger } from "../utils/logger.js";

declare global {
  namespace Express {
    interface Request {
      aiCredits?: {
        type: AiCreditType | string;
        cost: number;
        balance: number;
      };
    }
  }
}

const resolveBusinessId = (req: Request): string | undefined => {
  return (
    req.user?.businessProfile ||
    (req.params as any)?.businessId ||
    (req.body as any)?.businessId ||
    (req.query as any)?.businessId
  );
};

export function requireAiCredits(aiCreditType: AiCreditType | string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessId = resolveBusinessId(req);

      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "businessId is required to verify AI credits",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid businessId",
        });
      }

      const conn = await getBackendConnection();
      const CreditWallet = getBackendCreditWalletModel(conn);
      const Admin = getBackendAdminModel(conn);

      const [wallet, admin] = await Promise.all([
        CreditWallet.findOne({
          business: new mongoose.Types.ObjectId(businessId),
        }).lean(),
        Admin.findOne({ isSuperAdmin: true }).lean(),
      ]);

      if (!admin) {
        logger.error(
          { aiCreditType },
          "AI credits check failed: super-admin config not found"
        );
        return res.status(500).json({
          success: false,
          error: "AI credit configuration unavailable",
        });
      }
      if (!wallet) {
        return res.status(403).json({
          success: false,
          error: "Credit wallet not found for this business",
        });
      }

      const cost = admin.aiCreditCost?.[aiCreditType] ?? 0;
      if (cost <= 0) {
        logger.warn(
          { aiCreditType },
          "AI credits check: cost is zero or unconfigured for credit type"
        );
        return res.status(500).json({
          success: false,
          error: `AI credit cost not configured for "${aiCreditType}"`,
        });
      }

      if (wallet.credits < cost) {
        logger.info(
          {
            businessId,
            aiCreditType,
            balance: wallet.credits,
            cost,
            path: req.path,
          },
          "AI credits insufficient"
        );
        return res.status(402).json({
          success: false,
          error: "Insufficient AI credits",
          aiCreditType,
          balance: wallet.credits,
          cost,
        });
      }

      req.aiCredits = {
        type: aiCreditType,
        cost,
        balance: wallet.credits,
      };

      next();
    } catch (err: any) {
      logger.error(
        { err: err?.message ?? err, aiCreditType, path: req.path },
        "AI credits middleware error"
      );
      return res.status(500).json({
        success: false,
        error: "Failed to verify AI credits",
      });
    }
  };
}

export { AI_CREDIT_TYPE };
