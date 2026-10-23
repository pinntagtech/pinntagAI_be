// ─────────────────────────────────────────────────────────────────────────────
//  draft.ts — model output → response draft
//
//  Cheap, lossless tidying only (tag casing, empty strings, a schedule whose
//  `type` disagrees with its lists). Business rules — title length, date
//  window, % cap — stay in the backend, whose warnings measure our quality.
// ─────────────────────────────────────────────────────────────────────────────

import { ContentType, VoiceContentRequest } from "./request.js";
import { ModelOutput } from "./schema.js";

// Every field of every content type, so fields that don't apply go out as null.
const EMPTY_DRAFT = {
  title: null,
  description: null,
  discountType: null,
  discountValue: null,
  isFree: null,
  participationCost: null,
  bookingUrl: null,
  dayPart: null,
  tags: [] as string[],
  terms: null,
  outletIds: [] as string[],
  schedule: { type: null, fixed: null, recurring: null },
};

type Draft = Record<string, any>;

const VALUE_DISCOUNT_TYPES = new Set(["% Off", "$ Off"]);

function blankToNull(v: unknown): unknown {
  return typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v;
}

/** "$10", "20%", "10.00" → "10", "20", "10"; anything else unchanged. */
function numberString(v: unknown): string | null {
  const s = blankToNull(v);
  if (typeof s !== "string") return null;
  const m = s.replace(/[$%\s]/g, "").match(/^\d+(\.\d+)?$/);
  return m ? String(Number(m[0])) : s;
}

function normalizeTags(tags: unknown, maxTags: number): string[] {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  for (const t of tags) {
    const tag = String(t).replace(/^#+/, "").trim().toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen].slice(0, maxTags);
}

function normalizeSchedule(s: any) {
  if (s?.type === "fixed" && Array.isArray(s.fixed) && s.fixed.length) {
    return { type: "fixed", fixed: s.fixed, recurring: null };
  }
  if (s?.type === "recurring" && s.recurring && s.recurring.weekDays?.length) {
    return { type: "recurring", fixed: null, recurring: s.recurring };
  }
  return { type: null, fixed: null, recurring: null };
}

export function normalizeDraft(raw: Draft, req: VoiceContentRequest): Draft {
  const d: Draft = { ...EMPTY_DRAFT, ...raw };

  d.title = blankToNull(d.title);
  d.description = blankToNull(d.description);
  d.terms = blankToNull(d.terms);
  d.tags = normalizeTags(d.tags, req.maxTags);
  d.outletIds = [...new Set(d.outletIds as string[])];
  d.schedule = normalizeSchedule(d.schedule);

  if (req.contentType === "offer") {
    d.discountValue = VALUE_DISCOUNT_TYPES.has(d.discountType) ? numberString(d.discountValue) : null;
  }
  if (req.contentType === "business_event") {
    d.participationCost = d.isFree === true ? null : numberString(d.participationCost);
    d.bookingUrl = blankToNull(d.bookingUrl);
  }
  return d;
}

/** Field names the text did not supply, for logs and the backend. */
export function missingFields(d: Draft, req: VoiceContentRequest): string[] {
  const missing: string[] = [];
  const check = (field: string, isMissing: boolean) => isMissing && missing.push(field);

  check("title", !d.title);
  check("description", !d.description);
  check("tags", d.tags.length === 0);
  check("terms", d.terms === null);
  if (req.business.isFoodAndDrink) check("dayPart", d.dayPart === null);
  check("outletIds", d.outletIds.length === 0);
  check("schedule", d.schedule.type === null);

  const byType: Record<ContentType, () => void> = {
    offer: () => {
      check("discountType", d.discountType === null);
      if (VALUE_DISCOUNT_TYPES.has(d.discountType)) check("discountValue", d.discountValue === null);
    },
    business_event: () => {
      check("isFree", d.isFree === null);
      if (d.isFree !== true) check("participationCost", d.participationCost === null);
      check("bookingUrl", d.bookingUrl === null);
    },
  };
  byType[req.contentType]();
  return missing;
}

export function toDraft(out: ModelOutput, req: VoiceContentRequest) {
  const draft = normalizeDraft(out.draft ?? {}, req);
  return { draft, missing: missingFields(draft, req) };
}
