// ─────────────────────────────────────────────────────────────────────────────
//  schema.ts — per-request output schemas for the voice-content draft
//
//  Two views of the same shape, built from the same request:
//    • a JSON schema for OpenAI Structured Outputs (strict: true), so the
//      model cannot emit an outlet id, discount type, day part or weekly
//      schedule we would have to throw away;
//    • a zod schema that re-parses the model output before we trust it.
//
//  Strict mode requires every property to be listed in `required`, so unknown
//  values are nulls, never omitted keys. Content types plug in through
//  CONTENT_TYPE_FIELDS; adding one means a new entry here and in prompt.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import { ContentType, DAY_PARTS, VoiceContentRequest, WEEKDAYS } from "./request.js";

export type JsonSchema = Record<string, unknown>;

export const DRAFT_STATUSES = ["ok", "no_content", "not_relevant"] as const;
export const LANGUAGES = ["en", "es"] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

const obj = (properties: Record<string, JsonSchema>): JsonSchema => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const nullable = (schema: JsonSchema): JsonSchema => ({ anyOf: [schema, { type: "null" }] });

const str = (description?: string): JsonSchema =>
  description ? { type: "string", description } : { type: "string" };

const strOrNull = (description?: string): JsonSchema =>
  description ? { type: ["string", "null"], description } : { type: ["string", "null"] };

/** Enum of `values` plus null; collapses to null-only when nothing is allowed. */
const enumOrNull = (values: readonly string[]): JsonSchema =>
  values.length ? { type: ["string", "null"], enum: [...values, null] } : { type: "null" };

const zEnumOrNull = (values: readonly string[]) =>
  values.length ? z.enum(values as [string, ...string[]]).nullable() : z.null();

const DATE_DESC = "YYYY-MM-DD";
const TIME_DESC = "24-hour HH:mm, wall-clock time at the outlet";

// ── Fields shared by every content type ──────────────────────────────────────

function scheduleJson(req: VoiceContentRequest): JsonSchema {
  const fixedEntry = obj({ date: str(DATE_DESC), start: str(TIME_DESC), end: str(TIME_DESC) });
  const weekDay = obj({
    day: { type: "string", enum: [...WEEKDAYS] },
    start: str(TIME_DESC),
    end: str(TIME_DESC),
  });
  const recurring = obj({
    startDate: str(DATE_DESC),
    endDate: strOrNull(DATE_DESC),
    weekDays: { type: "array", items: weekDay },
  });
  return obj({
    type: enumOrNull(req.recurringAllowed ? ["fixed", "recurring"] : ["fixed"]),
    fixed: nullable({ type: "array", items: fixedEntry }),
    recurring: req.recurringAllowed ? nullable(recurring) : { type: "null" },
  });
}

function scheduleZod(req: VoiceContentRequest) {
  const fixedEntry = z.object({ date: z.string(), start: z.string(), end: z.string() }).strict();
  const weekDay = z.object({ day: z.enum(WEEKDAYS), start: z.string(), end: z.string() }).strict();
  const recurring = z
    .object({ startDate: z.string(), endDate: z.string().nullable(), weekDays: z.array(weekDay) })
    .strict();
  return z
    .object({
      type: zEnumOrNull(req.recurringAllowed ? ["fixed", "recurring"] : ["fixed"]),
      fixed: z.array(fixedEntry).nullable(),
      recurring: req.recurringAllowed ? recurring.nullable() : z.null(),
    })
    .strict();
}

function commonJson(req: VoiceContentRequest): Record<string, JsonSchema> {
  return {
    title: str("At most 80 characters"),
    description: str("2 to 4 sentences, 50 to 1000 characters"),
    tags: { type: "array", items: str() },
    terms: strOrNull(),
    dayPart: enumOrNull(req.business.isFoodAndDrink ? DAY_PARTS : []),
    outletIds: { type: "array", items: { type: "string", enum: req.outlets.map((o) => o.id) } },
    schedule: scheduleJson(req),
  };
}

function commonZod(req: VoiceContentRequest) {
  const ids = req.outlets.map((o) => o.id) as [string, ...string[]];
  return {
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    terms: z.string().nullable(),
    dayPart: zEnumOrNull(req.business.isFoodAndDrink ? DAY_PARTS : []),
    outletIds: z.array(z.enum(ids)),
    schedule: scheduleZod(req),
  };
}

// ── Per content type ─────────────────────────────────────────────────────────

interface ContentTypeFields {
  json(req: VoiceContentRequest): Record<string, JsonSchema>;
  zod(req: VoiceContentRequest): z.ZodRawShape;
}

export const CONTENT_TYPE_FIELDS: Record<ContentType, ContentTypeFields> = {
  offer: {
    json: (req) => ({
      discountType: enumOrNull(req.allowedDiscountTypes),
      discountValue: strOrNull('Number only: "20" for 20% off, "10" for $10 off'),
    }),
    zod: (req) => ({
      discountType: zEnumOrNull(req.allowedDiscountTypes),
      discountValue: z.string().nullable(),
    }),
  },
  business_event: {
    json: () => ({
      isFree: { type: ["boolean", "null"] },
      participationCost: strOrNull('Ticket price as a number, e.g. "25"'),
      bookingUrl: strOrNull("Full http(s) URL that appears in the text"),
    }),
    zod: () => ({
      isFree: z.boolean().nullable(),
      participationCost: z.string().nullable(),
      bookingUrl: z.string().nullable(),
    }),
  },
};

// ── Root schemas ─────────────────────────────────────────────────────────────

/** JSON schema for `response_format.json_schema.schema`. */
export function buildJsonSchema(req: VoiceContentRequest): JsonSchema {
  const draft = obj({ ...commonJson(req), ...CONTENT_TYPE_FIELDS[req.contentType].json(req) });
  return obj({
    status: { type: "string", enum: [...DRAFT_STATUSES] },
    language: { type: "string", enum: [...LANGUAGES] },
    draft: nullable(draft),
  });
}

export function buildZodSchema(req: VoiceContentRequest) {
  const draft = z.object({ ...commonZod(req), ...CONTENT_TYPE_FIELDS[req.contentType].zod(req) }).strict();
  return z
    .object({
      status: z.enum(DRAFT_STATUSES),
      language: z.enum(LANGUAGES),
      draft: draft.nullable(),
    })
    .strict()
    .refine((out) => out.status !== "ok" || out.draft !== null, {
      message: "status ok requires a draft",
      path: ["draft"],
    });
}

export type ModelOutput = {
  status: (typeof DRAFT_STATUSES)[number];
  language: (typeof LANGUAGES)[number];
  draft: Record<string, unknown> | null;
};
