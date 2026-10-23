// ─────────────────────────────────────────────────────────────────────────────
//  evalVoiceContent.ts
//
//  Eval for POST /voice-content/draft. NOT a CI test — it calls OpenAI. Run it
//  on every prompt or model change:
//
//    npm run eval:voice-content            # all fixtures
//    npm run eval:voice-content -- hard    # fixture files whose name matches
//
//  Fixtures: tests/voice-content/fixtures/*.json, each case a partial request
//  merged over _base.json plus the expected fields. Outlets are expected by
//  name. Schedules are written as
//    { "fixed": [[date, start, end], ...] } | { "recurring": {...} } | null.
//
//  Gate (exit 1 when missed): schedule and outlet accuracy each ≥ 90%,
//  separately for English and Spanish. Scores are written to
//  tests/voice-content/results/<prompt version>--<model>.json; no drafts.
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { VoiceContentRequest, VoiceContentRequestSchema } from "../api/services/voiceContent/request.js";
import { PROMPT_VERSION } from "../api/services/voiceContent/prompt.js";
import { CallModel, DEFAULT_CALL_TIMEOUT_MS, generateDraft } from "../api/services/voiceContent/voiceContent.service.js";

dotenv.config();

const FIXTURE_DIR = path.resolve("tests/voice-content/fixtures");
const RESULT_DIR = path.resolve("tests/voice-content/results");
const GATE = 0.9;
const CONCURRENCY = 4;

type Expect = {
  code?: string;
  language?: "en" | "es";
  discountType?: string | null;
  discountValue?: string | null;
  isFree?: boolean | null;
  participationCost?: string | null;
  bookingUrl?: string | null;
  outlets?: string[];
  schedule?: null | { fixed?: string[][]; recurring?: { startDate: string; endDate: string | null; weekDays: string[][] } };
};
type Case = { id: string; slice: string; request: VoiceContentRequest; expect: Expect };
type Check = { field: string; pass: boolean; detail?: string };

// ── Loading ──────────────────────────────────────────────────────────────────

function loadCases(filter?: string): Case[] {
  const base = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, "_base.json"), "utf8"));
  const files = fs
    .readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_") && (!filter || f.includes(filter)));
  return files.flatMap((f) => {
    const { slice, cases } = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, f), "utf8"));
    return cases.map((c: any) => ({
      id: c.id,
      slice,
      request: VoiceContentRequestSchema.parse({ ...base, requestId: `eval-${c.id}`, ...c.request }),
      expect: c.expect,
    }));
  });
}

// ── Scoring ──────────────────────────────────────────────────────────────────

const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Draft schedule → the fixture shorthand, sorted, for exact comparison. */
function canonicalSchedule(s: any): Expect["schedule"] {
  if (!s || s.type === null) return null;
  if (s.type === "fixed") {
    return { fixed: s.fixed.map((e: any) => [e.date, e.start, e.end]).sort((a: string[], b: string[]) => a.join().localeCompare(b.join())) };
  }
  return {
    recurring: {
      startDate: s.recurring.startDate,
      endDate: s.recurring.endDate,
      weekDays: s.recurring.weekDays
        .map((w: any) => [w.day, w.start, w.end])
        .sort((a: string[], b: string[]) => DAY_ORDER.indexOf(a[0]) - DAY_ORDER.indexOf(b[0]) || a[1].localeCompare(b[1])),
    },
  };
}

function canonicalExpected(s: Expect["schedule"]): Expect["schedule"] {
  if (!s) return null;
  if (s.fixed) return { fixed: [...s.fixed].sort((a, b) => a.join().localeCompare(b.join())) };
  return canonicalSchedule({ type: "recurring", recurring: { ...s.recurring, weekDays: s.recurring!.weekDays.map(([day, start, end]) => ({ day, start, end })) } });
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function score(c: Case, status: number, body: any): Check[] {
  const e = c.expect;
  if (e.code) {
    return [{ field: "code", pass: body?.code === e.code, detail: `got ${status} ${body?.code ?? "draft"}` }];
  }
  if (status !== 200 || !body?.draft) {
    return [{ field: "draft", pass: false, detail: `got ${status} ${body?.code ?? ""}` }];
  }
  const d = body.draft;
  const checks: Check[] = [];
  const exact = (field: keyof Expect, actual: unknown) => {
    if (field in e) checks.push({ field, pass: same(actual, e[field]), detail: `got ${JSON.stringify(actual)}` });
  };

  exact("language", body.language);
  exact("discountType", d.discountType);
  exact("discountValue", d.discountValue);
  exact("isFree", d.isFree);
  exact("participationCost", d.participationCost);
  exact("bookingUrl", d.bookingUrl);

  if (e.outlets) {
    const byId = new Map(c.request.outlets.map((o) => [o.id, o.name]));
    const got = (d.outletIds as string[]).map((id) => byId.get(id) ?? id).sort();
    checks.push({ field: "outlets", pass: same(got, [...e.outlets].sort()), detail: `got ${JSON.stringify(got)}` });
  }
  if ("schedule" in e) {
    const got = canonicalSchedule(d.schedule);
    checks.push({ field: "schedule", pass: same(got, canonicalExpected(e.schedule)), detail: `got ${JSON.stringify(got)}` });
  }

  const title: string = d.title ?? "";
  checks.push({
    field: "title",
    pass: title.length > 0 && title.length <= 80 && title !== title.toUpperCase(),
    detail: `${title.length} chars`,
  });
  const desc: string = d.description ?? "";
  checks.push({ field: "description", pass: desc.length >= 50 && desc.length <= 1000, detail: `${desc.length} chars` });
  return checks;
}

// ── Run ──────────────────────────────────────────────────────────────────────

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

function rate(results: { checks: Check[] }[], field: string): { pass: number; total: number } {
  const relevant = results.flatMap((r) => r.checks.filter((c) => c.field === field || (c.field === "draft" && (field === "schedule" || field === "outlets"))));
  return { pass: relevant.filter((c) => c.pass).length, total: relevant.length };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set");
    process.exit(2);
  }
  const model = process.env.VOICE_CONTENT_LLM_MODEL || "gpt-4o-mini";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0, timeout: DEFAULT_CALL_TIMEOUT_MS });
  const callModel: CallModel = (params, o) => client.chat.completions.create(params, o);

  const cases = loadCases(process.argv[2]);
  console.log(`Running ${cases.length} cases · ${PROMPT_VERSION} · ${model}\n`);

  const results = await mapLimit(cases, CONCURRENCY, async (c) => {
    const r = await generateDraft(c.request, { callModel, model });
    const status = r.ok ? 200 : r.error.status;
    const body = r.ok ? r.body : r.error.toBody();
    const checks = score(c, status, body);
    const lang = c.expect.language ?? null;
    const failed = checks.filter((k) => !k.pass);
    console.log(`${failed.length ? "✗" : "✓"} ${c.id}  (${r.meta.latencyMs.total} ms)`);
    for (const f of failed) console.log(`    ${f.field}: ${f.detail}`);
    if (r.meta.failure) console.log(`    last failure: ${r.meta.failure}`);
    return { id: c.id, slice: c.slice, language: lang, latencyMs: r.meta.latencyMs.total, usage: r.meta.usage, checks };
  });

  // ── Summary ────────────────────────────────────────────────────────────────
  const fields = ["schedule", "outlets", "language", "discountType", "discountValue", "isFree", "participationCost", "bookingUrl", "title", "description", "code"];
  const summary: Record<string, Record<string, string>> = {};
  for (const lang of ["en", "es", "all"]) {
    const subset = lang === "all" ? results : results.filter((r) => r.language === lang);
    summary[lang] = {};
    for (const f of fields) {
      const { pass, total } = rate(subset, f);
      if (total) summary[lang][f] = `${pass}/${total} (${Math.round((pass / total) * 100)}%)`;
    }
  }
  console.log("\nScores");
  console.table(summary);

  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const pct = (p: number) => latencies[Math.min(latencies.length - 1, Math.floor(p * latencies.length))];
  const tokens = results.reduce((s, r) => ({ in: s.in + r.usage.inputTokens, out: s.out + r.usage.outputTokens }), { in: 0, out: 0 });
  console.log(`Latency p50 ${pct(0.5)} ms · p95 ${pct(0.95)} ms · tokens in ${tokens.in} out ${tokens.out}`);

  const gateFailures: string[] = [];
  for (const lang of ["en", "es"]) {
    for (const f of ["schedule", "outlets"]) {
      const { pass, total } = rate(results.filter((r) => r.language === lang), f);
      if (total && pass / total < GATE) gateFailures.push(`${lang} ${f} ${pass}/${total}`);
    }
  }

  fs.mkdirSync(RESULT_DIR, { recursive: true });
  const file = path.join(RESULT_DIR, `${PROMPT_VERSION.replace(/[^\w.@-]/g, "_")}--${model}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        promptVersion: PROMPT_VERSION,
        model,
        ranAt: new Date().toISOString(),
        cases: results.length,
        summary,
        latencyMs: { p50: pct(0.5), p95: pct(0.95) },
        gate: { threshold: GATE, passed: gateFailures.length === 0, failures: gateFailures },
        results: results.map((r) => ({ id: r.id, failed: r.checks.filter((c) => !c.pass).map((c) => c.field) })),
      },
      null,
      2,
    ),
  );
  console.log(`\nWrote ${path.relative(process.cwd(), file)}`);

  if (gateFailures.length) {
    console.log(`\nGATE FAILED (< ${GATE * 100}%): ${gateFailures.join("; ")}`);
    process.exit(1);
  }
  console.log("\nGate passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
