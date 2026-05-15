// ─────────────────────────────────────────────────────────────────────────────
//  evalReviewChat.ts
//
//  Tiny eval harness for the review chatbot. NOT a Jest test — a standalone
//  script you run manually before a deploy or after touching the prompt.
//
//  Usage:
//    tsx src/scripts/evalReviewChat.ts <businessId>
//
//  Exit code:
//    0  — all gates passed (pass rate ≥ MIN_PASS_RATE,
//          abstain rate within [MIN_ABSTAIN_RATE, MAX_ABSTAIN_RATE])
//    1  — at least one gate failed
//    2  — fatal error (couldn't connect, business not found, etc.)
//
//  The gates are intentionally conservative:
//    - 80% of cases must pass overall
//    - abstain rate between 5% and 30%
//      (too low → hallucinating; too high → useless)
//
//  Add cases in evalReviewChat.fixtures.ts. Add new invariants here as we
//  learn what failure modes matter.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import { connectMongo, getBackendConnection, closeAllMongo } from "../db/connection.js";
import { reviewChatService } from "../api/services/reviewChat.service.js";
import { EVAL_CASES, EvalCase } from "./evalReviewChat.fixtures.js";

const MIN_PASS_RATE = 0.8;
const MIN_ABSTAIN_RATE = 0.05;
const MAX_ABSTAIN_RATE = 0.3;

interface CaseResult {
  case: EvalCase;
  passed: boolean;
  failures: string[];
  answer: string;
  sources: string[];
  abstained: boolean;
}

function evaluateCase(
  c: EvalCase,
  answer: string,
  sources: string[],
  abstained: boolean,
): { passed: boolean; failures: string[] } {
  const failures: string[] = [];
  const lower = answer.toLowerCase();

  if (c.shouldAbstain === true && !abstained) {
    failures.push("expected abstain but model answered");
  }
  if (c.shouldAbstain === false && abstained) {
    failures.push("did not expect abstain but model abstained");
  }

  if (c.mustMentionAny && c.mustMentionAny.length > 0) {
    const found = c.mustMentionAny.some((phrase) =>
      lower.includes(phrase.toLowerCase()),
    );
    if (!found) {
      failures.push(
        `must mention one of: [${c.mustMentionAny.join(", ")}]`,
      );
    }
  }

  if (c.mustNotMention && c.mustNotMention.length > 0) {
    for (const phrase of c.mustNotMention) {
      if (lower.includes(phrase.toLowerCase())) {
        failures.push(`must not mention: "${phrase}"`);
      }
    }
  }

  if (c.expectedSources && c.expectedSources.length > 0) {
    // Subset: at least one expected source must appear in actual sources.
    const overlap = c.expectedSources.some((s) => sources.includes(s));
    if (!overlap) {
      failures.push(
        `expected sources to include one of [${c.expectedSources.join(", ")}], got [${sources.join(", ")}]`,
      );
    }
  }

  return { passed: failures.length === 0, failures };
}

async function runEval(businessId: string): Promise<number> {
  if (!mongoose.Types.ObjectId.isValid(businessId)) {
    console.error(`[fatal] Invalid businessId: ${businessId}`);
    return 2;
  }

  console.log(`\nReview chat eval — business ${businessId}`);
  console.log(`Cases: ${EVAL_CASES.length}\n`);

  const results: CaseResult[] = [];

  for (const c of EVAL_CASES) {
    process.stdout.write(`  [${c.id}] ${c.question} ... `);
    try {
      const response = await reviewChatService.chat({
        businessId,
        message: c.question,
      });

      const { passed, failures } = evaluateCase(
        c,
        response.response,
        response.sources,
        response.abstained,
      );

      results.push({
        case: c,
        passed,
        failures,
        answer: response.response,
        sources: response.sources,
        abstained: response.abstained,
      });

      console.log(passed ? "PASS" : `FAIL — ${failures.join("; ")}`);
    } catch (error: any) {
      results.push({
        case: c,
        passed: false,
        failures: [`runtime error: ${error.message}`],
        answer: "",
        sources: [],
        abstained: false,
      });
      console.log(`ERROR — ${error.message}`);
    }
  }

  // ── Aggregate metrics ──────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const passRate = total > 0 ? passed / total : 0;
  const abstainCount = results.filter((r) => r.abstained).length;
  const abstainRate = total > 0 ? abstainCount / total : 0;

  console.log(`\n─── Results ──────────────────────────`);
  console.log(`Passed:        ${passed} / ${total} (${(passRate * 100).toFixed(1)}%)`);
  console.log(`Abstain rate:  ${abstainCount} / ${total} (${(abstainRate * 100).toFixed(1)}%)`);

  // ── Gates ─────────────────────────────────────────────────────────────────
  const gateFailures: string[] = [];
  if (passRate < MIN_PASS_RATE) {
    gateFailures.push(
      `pass rate ${(passRate * 100).toFixed(1)}% < required ${(MIN_PASS_RATE * 100).toFixed(0)}%`,
    );
  }
  if (abstainRate < MIN_ABSTAIN_RATE) {
    gateFailures.push(
      `abstain rate ${(abstainRate * 100).toFixed(1)}% < ${(MIN_ABSTAIN_RATE * 100).toFixed(0)}% (model may be hallucinating)`,
    );
  }
  if (abstainRate > MAX_ABSTAIN_RATE) {
    gateFailures.push(
      `abstain rate ${(abstainRate * 100).toFixed(1)}% > ${(MAX_ABSTAIN_RATE * 100).toFixed(0)}% (model may be over-refusing)`,
    );
  }

  if (gateFailures.length > 0) {
    console.log(`\nGates FAILED:`);
    for (const f of gateFailures) console.log(`  - ${f}`);
    console.log(`\nFailing cases:`);
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  [${r.case.id}] ${r.case.question}`);
      console.log(`    failures: ${r.failures.join("; ")}`);
      console.log(`    answer:   ${r.answer.slice(0, 200)}`);
      console.log(`    sources:  [${r.sources.join(", ")}]  abstained: ${r.abstained}`);
    }
    return 1;
  }

  console.log(`\nAll gates passed.`);
  return 0;
}

(async () => {
  const businessId = process.argv[2];
  if (!businessId) {
    console.error("Usage: tsx src/scripts/evalReviewChat.ts <businessId>");
    process.exit(2);
  }

  try {
    await connectMongo();
    await getBackendConnection();
    const exitCode = await runEval(businessId);
    await closeAllMongo();
    process.exit(exitCode);
  } catch (error: any) {
    console.error(`[fatal] ${error.message}`);
    await closeAllMongo().catch(() => {});
    process.exit(2);
  }
})();
