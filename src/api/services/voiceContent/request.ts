// ─────────────────────────────────────────────────────────────────────────────
//  request.ts — inbound contract for POST /voice-content/draft
//
//  Called only by pinntagBackend. The backend has already collapsed whitespace,
//  filtered outlets to active ones and computed each outlet's local date, so
//  this layer validates shape and never does time-zone math.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

export const CONTENT_TYPES = ["offer", "business_event"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const DAY_PARTS = ["BREAKFAST", "BRUNCH", "LUNCH", "DINNER", "LATE_NIGHT"] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

const OutletSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().max(200),
  address: z.string().max(500).nullish(),
  city: z.string().max(200).nullish(),
  timezone: z.string().min(1).max(64),
  localDate: isoDate,
  localWeekday: z.enum(WEEKDAYS),
});

export const VoiceContentRequestSchema = z
  .object({
    requestId: z.string().min(1).max(100),
    // Not in the v1 contract; usage is only tracked per business when sent.
    businessId: z.string().min(1).max(64).optional(),
    contentType: z.enum(CONTENT_TYPES),
    text: z.string().trim().min(3).max(1500),
    // A hint only; the language is detected from the text.
    locale: z.string().max(20).optional(),
    nowIso: z.string().datetime().optional(),
    business: z.object({
      name: z.string().min(1).max(200),
      industry: z.string().max(200).nullish(),
      isFoodAndDrink: z.boolean(),
      verified: z.boolean().optional(),
    }),
    outlets: z.array(OutletSchema).min(1).max(100),
    allowedDiscountTypes: z.array(z.string().min(1).max(50)).max(20).default([]),
    maxDaysAhead: z.number().int().min(0).max(60),
    recurringAllowed: z.boolean(),
    maxTags: z.number().int().min(0).max(20).default(5),
  })
  .superRefine((req, ctx) => {
    const ids = req.outlets.map((o) => o.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["outlets"], message: "duplicate outlet id" });
    }
  });

export type VoiceContentRequest = z.infer<typeof VoiceContentRequestSchema>;
export type Outlet = VoiceContentRequest["outlets"][number];
