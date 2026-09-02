// ─────────────────────────────────────────────────────────────────────────────
//  websiteSummary.service.ts
//
//  Fetches a business's own website once, LLM-extracts a compact structured
//  summary (~2 KB), caches it in Mongo, and returns it to the review chatbot
//  as an additional grounding source alongside reviews + profile.
//
//  Trigger model: LAZY on chat. On a review-chat request, we call
//  getOrGenerateWebsiteSummary(businessId, business.website) alongside the
//  review summary. If a fresh row exists (< TTL) we use it; otherwise we
//  generate a new one. Extract failures are cached with a shorter cooldown so
//  we don't hammer failing sites on every chat.
//
//  Not a batch job for v1 — reviews-summarization is nightly, this could
//  follow later if we want cold-start freshness. Skipping until we see it's
//  worth the ops load.
//
//  Security notes (SSRF):
//    We refuse to fetch loopback, RFC1918, link-local, and metadata IPs
//    (169.254.169.254). Public URLs only. `axios` is configured with a
//    conservative timeout and size cap.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import axios, { AxiosError } from "axios";
import { llm } from "../../utils/llm.js";
import { logger } from "../../utils/logger.js";
import {
  WebsiteSummaryModel,
  IWebsiteSummary,
  IWebsiteFaq,
  WebsiteSummaryStatus,
} from "../../models/websiteSummary.model.js";

const EXTRACT_MODEL = "gpt-4o-mini";

// TTLs — success is refreshed monthly; failures are cooled down for a week so
// a broken site doesn't keep costing us fetch + LLM calls.
const SUMMARY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const FAILURE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// Fetch budget. Kept small on purpose — most business websites are static and
// well under this. If we can't get the content in 8s we're not getting it.
const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_BYTES = 2_000_000; // 2 MB — enough for anything reasonable

// Text budget fed to the LLM. Even large sites compress to this; anything
// beyond it is very likely nav / footer / repeated boilerplate.
const MAX_EXTRACT_INPUT_CHARS = 30_000;

// Extract shape caps. Keep the whole document under ~3 KB so the review-chat
// system prompt doesn't balloon.
const MAX_ABOUT_CHARS = 500;
const MAX_LIST_ITEMS = 8;
const MAX_LIST_ITEM_CHARS = 240;
const MAX_FAQS = 8;
const MAX_FAQ_CHARS = 240;

/**
 * Compact structured extract returned by the LLM. Mirrors the persistence
 * shape but without Mongo metadata.
 */
interface WebsiteExtract {
  aboutSummary?: string;
  services: string[];
  hoursText?: string;
  policies: string[];
  faqs: IWebsiteFaq[];
  address?: string;
  phone?: string;
  otherFacts: string[];
}

class WebsiteSummaryService {
  /** Pure read — never triggers generation. Returns null if none stored. */
  async getWebsiteSummary(
    businessId: string | mongoose.Types.ObjectId,
  ): Promise<IWebsiteSummary | null> {
    const id =
      typeof businessId === "string"
        ? mongoose.Types.ObjectId.isValid(businessId)
          ? new mongoose.Types.ObjectId(businessId)
          : null
        : businessId;
    if (!id) return null;

    const doc = await WebsiteSummaryModel.findOne({ business: id }).lean();
    return (doc as unknown as IWebsiteSummary) || null;
  }

  /**
   * Runtime entrypoint used by the chat service. Returns the cached extract
   * if fresh (or fresh-enough for the failure case), otherwise regenerates.
   *
   * Never throws — a failure here must not block the chat call. On any error
   * we log and return null, and the chat continues with reviews + profile
   * only. Fail-open, same posture as the answer cache.
   */
  async getOrGenerateWebsiteSummary(
    businessId: mongoose.Types.ObjectId,
    websiteUrl: string | undefined | null,
  ): Promise<IWebsiteSummary | null> {
    if (!websiteUrl || websiteUrl.trim().length === 0) {
      // No website on file — nothing to extract. Not an error.
      return null;
    }

    try {
      const existing = await WebsiteSummaryModel.findOne({
        business: businessId,
      }).lean();

      if (existing) {
        const age =
          Date.now() - new Date(existing.extractedAt).getTime();
        const ttl =
          existing.status === "ok" ? SUMMARY_TTL_MS : FAILURE_COOLDOWN_MS;
        if (age < ttl) {
          return existing as unknown as IWebsiteSummary;
        }
      }

      return await this.generateWebsiteSummary(businessId, websiteUrl);
    } catch (err: any) {
      logger.warn(
        { error: err.message, businessId: String(businessId) },
        "getOrGenerateWebsiteSummary failed — falling back to no website context",
      );
      return null;
    }
  }

  /**
   * Fetch → extract → upsert. Writes a row for every outcome (including
   * failures) so we don't hot-loop failing hosts. Callers should treat this
   * as best-effort and check `status === "ok"` before using the fields.
   */
  async generateWebsiteSummary(
    businessId: mongoose.Types.ObjectId,
    websiteUrl: string,
  ): Promise<IWebsiteSummary | null> {
    const url = this.normalizeUrl(websiteUrl);
    if (!url) {
      return this.upsertFailure(
        businessId,
        "",
        "fetch_failed",
        "Invalid URL",
      );
    }

    if (!this.isSafeHost(url.hostname)) {
      return this.upsertFailure(
        businessId,
        url.toString(),
        "fetch_failed",
        `Blocked host: ${url.hostname}`,
      );
    }

    let html: string;
    let contentBytes: number;
    try {
      const fetched = await this.fetchHtml(url.toString());
      html = fetched.html;
      contentBytes = fetched.contentBytes;
    } catch (err: any) {
      return this.upsertFailure(
        businessId,
        url.toString(),
        "fetch_failed",
        this.fetchErrorMessage(err),
      );
    }

    const text = this.extractTextFromHtml(html).slice(
      0,
      MAX_EXTRACT_INPUT_CHARS,
    );
    if (text.trim().length < 100) {
      return this.upsertFailure(
        businessId,
        url.toString(),
        "no_content",
        `Extracted only ${text.length} chars of text`,
        contentBytes,
      );
    }

    let extract: WebsiteExtract;
    let tokensUsed = 0;
    try {
      const result = await this.summarizeText(text);
      extract = result.extract;
      tokensUsed = result.tokensUsed;
    } catch (err: any) {
      return this.upsertFailure(
        businessId,
        url.toString(),
        "extract_failed",
        err.message || "LLM extract failed",
        contentBytes,
      );
    }

    if (this.isEmptyExtract(extract)) {
      return this.upsertFailure(
        businessId,
        url.toString(),
        "no_content",
        "LLM returned empty extract",
        contentBytes,
      );
    }

    const doc = await WebsiteSummaryModel.findOneAndUpdate(
      { business: businessId },
      {
        $set: {
          business: businessId,
          sourceUrl: url.toString(),
          fetchedAt: new Date(),
          contentBytes,
          extractedAt: new Date(),
          aboutSummary: extract.aboutSummary,
          services: extract.services,
          hoursText: extract.hoursText,
          policies: extract.policies,
          faqs: extract.faqs,
          address: extract.address,
          phone: extract.phone,
          otherFacts: extract.otherFacts,
          status: "ok" as WebsiteSummaryStatus,
          errorMessage: undefined,
          modelUsed: EXTRACT_MODEL,
          tokensUsed,
        },
        $unset: { errorMessage: "" },
      },
      { upsert: true, new: true },
    ).lean();

    logger.info(
      {
        businessId: String(businessId),
        url: url.toString(),
        contentBytes,
        tokensUsed,
        services: extract.services.length,
        faqs: extract.faqs.length,
        policies: extract.policies.length,
      },
      "Website summary generated",
    );

    return doc as unknown as IWebsiteSummary;
  }

  // ── Fetch ────────────────────────────────────────────────────────────────

  private normalizeUrl(raw: string): URL | null {
    let candidate = raw.trim();
    if (!candidate) return null;
    if (!/^https?:\/\//i.test(candidate)) {
      candidate = `https://${candidate}`;
    }
    try {
      const u = new URL(candidate);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      return u;
    } catch {
      return null;
    }
  }

  /**
   * Refuse to fetch loopback, RFC1918, link-local, or metadata IPs (SSRF
   * guard). This is a first line; we're not resolving DNS to catch a domain
   * that points at a private address. For MVP that's an accepted risk on a
   * curated set of business websites; would harden if we expand.
   */
  private isSafeHost(hostname: string): boolean {
    const h = hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".localhost")) return false;
    if (h === "0.0.0.0" || h === "::" || h === "::1") return false;
    if (h === "169.254.169.254") return false; // cloud metadata endpoint

    // Basic literal-IP guard. Domain names are allowed through — we accept
    // the DNS-rebinding risk for MVP.
    const octets = h.split(".");
    if (octets.length === 4 && octets.every((o) => /^\d+$/.test(o))) {
      const [a, b] = octets.map(Number);
      if (a === 10) return false;
      if (a === 127) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a === 169 && b === 254) return false;
      if (a === 100 && b >= 64 && b <= 127) return false;
    }
    return true;
  }

  private async fetchHtml(url: string): Promise<{
    html: string;
    contentBytes: number;
  }> {
    const res = await axios.get<string>(url, {
      timeout: FETCH_TIMEOUT_MS,
      maxContentLength: MAX_HTML_BYTES,
      maxBodyLength: MAX_HTML_BYTES,
      maxRedirects: 5,
      responseType: "text",
      // Transform is a no-op — we want the raw string, axios sometimes tries
      // to JSON-parse based on content-type.
      transformResponse: [(data) => data],
      headers: {
        "User-Agent":
          "PinntagAI-WebsiteSummary/1.0 (+https://pinntag.com; contact: support@pinntag.com)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      // 4xx/5xx should raise so we record a fetch failure with the code.
      validateStatus: (s) => s >= 200 && s < 300,
    });

    const html = typeof res.data === "string" ? res.data : String(res.data);
    return { html, contentBytes: Buffer.byteLength(html, "utf8") };
  }

  private fetchErrorMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
      const ax = err as AxiosError;
      if (ax.code === "ECONNABORTED") return "Timeout";
      if (ax.response) return `HTTP ${ax.response.status}`;
      if (ax.code) return ax.code;
    }
    return (err as Error)?.message?.slice(0, 200) || "Unknown fetch error";
  }

  // ── HTML → text ──────────────────────────────────────────────────────────

  /**
   * Strip HTML down to visible text. Not a full parser — we drop the elements
   * that never contribute useful content (script, style, nav, footer, header,
   * form, aside), then remove all remaining tags, then collapse whitespace.
   *
   * A proper DOM parser would be better but pulling in cheerio/jsdom for one
   * use is heavy; if extraction quality suffers we can upgrade later.
   */
  extractTextFromHtml(html: string): string {
    if (!html) return "";

    // 1. Drop noisy elements entirely, including their contents.
    const dropPattern =
      /<(script|style|noscript|nav|footer|header|form|aside|svg|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi;
    let stripped = html.replace(dropPattern, " ");

    // 2. Drop HTML comments.
    stripped = stripped.replace(/<!--[\s\S]*?-->/g, " ");

    // 3. Insert linebreaks around block-level tags so text doesn't smoosh.
    stripped = stripped.replace(
      /<\/(p|div|section|article|li|h[1-6]|br|tr|td|th)\b[^>]*>/gi,
      "\n",
    );
    stripped = stripped.replace(/<br\s*\/?\s*>/gi, "\n");

    // 4. Strip all remaining tags.
    stripped = stripped.replace(/<[^>]+>/g, " ");

    // 5. Decode a handful of common entities. Anything more exotic can stay.
    stripped = stripped
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/gi, "'");

    // 6. Collapse whitespace: multiple spaces → one, ≥ 2 blank lines → 1.
    stripped = stripped.replace(/[ \t]+/g, " ");
    stripped = stripped.replace(/\n{2,}/g, "\n\n");
    stripped = stripped.replace(/^\s+|\s+$/gm, "");
    return stripped.trim();
  }

  // ── LLM extract ──────────────────────────────────────────────────────────

  private async summarizeText(text: string): Promise<{
    extract: WebsiteExtract;
    tokensUsed: number;
  }> {
    const systemPrompt = this.buildExtractPrompt();
    const completion = await llm.chatCompletion({
      model: EXTRACT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Website text:\n\n${text}` },
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    return {
      extract: this.parseAndClamp(raw),
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  }

  private buildExtractPrompt(): string {
    return `You extract compact, factual information from a business's own website.

Respond with ONLY a valid JSON object matching this exact schema:
{
  "aboutSummary": "<1-3 sentences describing what this business is or does. Max ${MAX_ABOUT_CHARS} chars. Omit if the site doesn't clearly say.>",
  "services": ["<a service or offering the business explicitly lists, ≤ ${MAX_LIST_ITEM_CHARS} chars>"],
  "hoursText": "<hours as published on the site, verbatim (e.g. 'Mon–Fri 9–5, Sat 10–2'). Omit if not published.>",
  "policies": ["<a policy the business states — returns, cancellations, dress code, age limits, deposit, tipping, etc.>"],
  "faqs": [ { "q": "<the question, ≤ ${MAX_FAQ_CHARS} chars>", "a": "<the answer, ≤ ${MAX_FAQ_CHARS} chars>" } ],
  "address": "<physical address the site publishes, if any>",
  "phone": "<phone the site publishes, if any>",
  "otherFacts": ["<a concrete, checkable fact the site states that doesn't fit the other buckets>"]
}

Rules:
- Extract ONLY facts the site actually states. Never invent, embellish, or infer.
- Prefer specific facts over marketing language. "Est. 1995" is a fact; "the best in town" is not.
- Deduplicate — don't repeat the same fact across services / policies / otherFacts.
- Caps: at most ${MAX_LIST_ITEMS} services, ${MAX_LIST_ITEMS} policies, ${MAX_FAQS} faqs, ${MAX_LIST_ITEMS} otherFacts. Trim to the highest-signal items.
- Every string ≤ ${MAX_LIST_ITEM_CHARS} chars (${MAX_FAQ_CHARS} for FAQ q/a, ${MAX_ABOUT_CHARS} for aboutSummary).
- If a field has no content, omit it (for strings) or use [] (for arrays). Never write placeholder text like "N/A" or "not available".
- The whole JSON object must stay well under 3 KB.`;
  }

  /**
   * Parse the LLM output and clamp to schema. Never throws — malformed
   * output degrades to an empty extract and the caller records "no_content".
   */
  private parseAndClamp(raw: string): WebsiteExtract {
    const empty: WebsiteExtract = {
      services: [],
      policies: [],
      faqs: [],
      otherFacts: [],
    };

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return empty;
    }
    if (!parsed || typeof parsed !== "object") return empty;

    const trimStr = (v: unknown, cap: number): string | undefined => {
      if (typeof v !== "string") return undefined;
      const trimmed = v.trim();
      if (trimmed.length === 0) return undefined;
      return trimmed.slice(0, cap);
    };

    const clampStrList = (v: unknown): string[] => {
      if (!Array.isArray(v)) return [];
      return v
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter((s) => s.length > 0)
        .slice(0, MAX_LIST_ITEMS)
        .map((s) => s.slice(0, MAX_LIST_ITEM_CHARS));
    };

    const clampFaqs = (v: unknown): IWebsiteFaq[] => {
      if (!Array.isArray(v)) return [];
      const out: IWebsiteFaq[] = [];
      for (const item of v) {
        if (!item || typeof item !== "object") continue;
        const q = trimStr((item as any).q, MAX_FAQ_CHARS);
        const a = trimStr((item as any).a, MAX_FAQ_CHARS);
        if (!q || !a) continue;
        out.push({ q, a });
        if (out.length >= MAX_FAQS) break;
      }
      return out;
    };

    return {
      aboutSummary: trimStr(parsed.aboutSummary, MAX_ABOUT_CHARS),
      services: clampStrList(parsed.services),
      hoursText: trimStr(parsed.hoursText, MAX_LIST_ITEM_CHARS),
      policies: clampStrList(parsed.policies),
      faqs: clampFaqs(parsed.faqs),
      address: trimStr(parsed.address, MAX_LIST_ITEM_CHARS),
      phone: trimStr(parsed.phone, 40),
      otherFacts: clampStrList(parsed.otherFacts),
    };
  }

  private isEmptyExtract(e: WebsiteExtract): boolean {
    return (
      !e.aboutSummary &&
      e.services.length === 0 &&
      !e.hoursText &&
      e.policies.length === 0 &&
      e.faqs.length === 0 &&
      !e.address &&
      !e.phone &&
      e.otherFacts.length === 0
    );
  }

  // ── Failure writes ───────────────────────────────────────────────────────

  private async upsertFailure(
    businessId: mongoose.Types.ObjectId,
    sourceUrl: string,
    status: WebsiteSummaryStatus,
    errorMessage: string,
    contentBytes?: number,
  ): Promise<IWebsiteSummary> {
    logger.warn(
      {
        businessId: String(businessId),
        sourceUrl,
        status,
        errorMessage,
      },
      "Website summary generation failed",
    );

    const doc = await WebsiteSummaryModel.findOneAndUpdate(
      { business: businessId },
      {
        $set: {
          business: businessId,
          sourceUrl,
          extractedAt: new Date(),
          status,
          errorMessage: errorMessage.slice(0, 500),
          contentBytes,
          // Wipe stale extract fields so a downgrade from ok → failed doesn't
          // leave misleading data behind.
          aboutSummary: undefined,
          services: [],
          hoursText: undefined,
          policies: [],
          faqs: [],
          address: undefined,
          phone: undefined,
          otherFacts: [],
          modelUsed: undefined,
          tokensUsed: undefined,
        },
      },
      { upsert: true, new: true },
    ).lean();

    return doc as unknown as IWebsiteSummary;
  }
}

export const websiteSummaryService = new WebsiteSummaryService();
