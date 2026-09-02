import mongoose from "mongoose";
import { getBackendConnection } from "../../db/connection.js";
import {
  getBackendCreditWalletModel,
  CreditWalletStatus,
} from "../../models/pinntagBackend/creditWallet.model.js";
import { logger } from "../../utils/logger.js";

/**
 * AI credit spending against the backend `creditwallets` collection.
 *
 * `requireAiCredits` (middleware/aiCredits.ts) only *checks* a balance ahead
 * of a request. This is the other half: the actual debit, for background work
 * that has no request to hang middleware off.
 *
 * The debit is a single conditional `$inc` — the balance guard lives in the
 * query filter, so two concurrent charges can never take the wallet below
 * zero or double-spend the last credits.
 */

/** Credits charged per daily (slow-time) recommendation update. */
export const DAILY_RECOMMENDATION_CREDIT_COST = Number(
  process.env.DAILY_RECOMMENDATION_CREDIT_COST ?? 5,
);

export interface CreditChargeResult {
  charged: boolean;
  /** Balance after the charge, or the balance we found when refusing. */
  balance?: number;
  reason?: "insufficient" | "no_wallet" | "wallet_inactive" | "error";
}

/**
 * Can this business afford `amount` right now?
 *
 * Advisory only — used to avoid spending money on image/LLM work for a
 * business that can't pay. The authoritative check is the conditional filter
 * in `charge`.
 */
export async function hasSufficientCredits(
  businessId: string,
  amount: number,
): Promise<boolean> {
  try {
    const conn = await getBackendConnection();
    const CreditWallet = getBackendCreditWalletModel(conn);

    const wallet = await CreditWallet.findOne({
      business: new mongoose.Types.ObjectId(businessId),
    })
      .select("credits status")
      .lean();

    if (!wallet) return false;
    if (wallet.status !== CreditWalletStatus.ACTIVE) return false;

    return wallet.credits >= amount;
  } catch (err: any) {
    logger.warn(
      { businessId, amount, err: err?.message },
      "Could not read credit wallet — treating as unaffordable",
    );
    return false;
  }
}

/**
 * Debit `amount` credits from the business's wallet.
 *
 * Only charges an ACTIVE wallet that holds at least `amount`; otherwise
 * returns `charged: false` and leaves the wallet untouched.
 */
export async function chargeCredits(
  businessId: string,
  amount: number,
  reason: string,
): Promise<CreditChargeResult> {
  if (amount <= 0) return { charged: true };

  try {
    const conn = await getBackendConnection();
    const CreditWallet = getBackendCreditWalletModel(conn);
    const business = new mongoose.Types.ObjectId(businessId);

    const updated = await CreditWallet.findOneAndUpdate(
      {
        business,
        status: CreditWalletStatus.ACTIVE,
        credits: { $gte: amount },
      },
      { $inc: { credits: -amount } },
      { new: true, projection: { credits: 1 } },
    ).lean();

    if (updated) {
      logger.info(
        { businessId, amount, reason, balance: updated.credits },
        "AI credits charged",
      );
      return { charged: true, balance: updated.credits };
    }

    // Nothing matched — work out why, for the caller's log.
    const wallet = await CreditWallet.findOne({ business })
      .select("credits status")
      .lean();

    const result: CreditChargeResult = !wallet
      ? { charged: false, reason: "no_wallet" }
      : wallet.status !== CreditWalletStatus.ACTIVE
        ? { charged: false, reason: "wallet_inactive", balance: wallet.credits }
        : { charged: false, reason: "insufficient", balance: wallet.credits };

    logger.info(
      { businessId, amount, reason, ...result },
      "AI credits not charged",
    );
    return result;
  } catch (err: any) {
    logger.error(
      { businessId, amount, reason, err: err?.message },
      "Failed to charge AI credits",
    );
    return { charged: false, reason: "error" };
  }
}
