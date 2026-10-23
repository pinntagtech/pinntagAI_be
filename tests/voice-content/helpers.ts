import type { ChatCompletion } from "openai/resources/chat/completions";
import { VoiceContentRequest, VoiceContentRequestSchema } from "../../src/api/services/voiceContent/request.js";

export const DOWNTOWN = "66f0c1a2b3d4e5f601234567";
export const MIDTOWN = "66f0c1a2b3d4e5f601234568";

export function makeRequest(overrides: Record<string, unknown> = {}): VoiceContentRequest {
  return VoiceContentRequestSchema.parse({
    requestId: "6719f0c2a1b2c3d4e5f60718",
    contentType: "offer",
    text: "happy hour this friday from 5 to 8 two drinks for 10 dollars at our downtown location",
    locale: "en-US",
    nowIso: "2026-10-23T14:00:00.000Z",
    business: { name: "Joe's Tavern", industry: "Food & Drink", isFoodAndDrink: true, verified: false },
    outlets: [
      {
        id: DOWNTOWN,
        name: "Downtown",
        address: "12 Peachtree St, Atlanta, GA",
        city: "Atlanta",
        timezone: "America/New_York",
        localDate: "2026-10-23",
        localWeekday: "fri",
      },
      {
        id: MIDTOWN,
        name: "Midtown",
        address: "900 Peachtree St NE, Atlanta, GA",
        city: "Atlanta",
        timezone: "America/New_York",
        localDate: "2026-10-23",
        localWeekday: "fri",
      },
    ],
    allowedDiscountTypes: ["% Off", "$ Off", "BOGO", "Happy Hour", "Combo/Bundle", "Custom Deal"],
    maxDaysAhead: 7,
    recurringAllowed: true,
    maxTags: 5,
    ...overrides,
  });
}

export function offerOutput(draftOverrides: Record<string, unknown> = {}, top: Record<string, unknown> = {}) {
  return {
    status: "ok",
    language: "en",
    draft: {
      title: "Happy Hour: 2 Drinks for $10",
      description:
        "Unwind at our Downtown location this Friday evening with two drinks for just $10, from 5 to 8 PM.",
      tags: ["happy hour", "drinks"],
      terms: null,
      dayPart: "DINNER",
      outletIds: [DOWNTOWN],
      schedule: {
        type: "fixed",
        fixed: [{ date: "2026-10-23", start: "17:00", end: "20:00" }],
        recurring: null,
      },
      discountType: "Happy Hour",
      discountValue: null,
      ...draftOverrides,
    },
    ...top,
  };
}

export function completion(content: unknown, extra: Partial<ChatCompletion["choices"][number]> = {}): ChatCompletion {
  return {
    id: "chatcmpl-test",
    object: "chat.completion",
    created: 0,
    model: "gpt-4o-mini-2024-07-18",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        logprobs: null,
        message: {
          role: "assistant",
          content: typeof content === "string" ? content : JSON.stringify(content),
          refusal: null,
        },
        ...extra,
      },
    ],
    usage: { prompt_tokens: 1000, completion_tokens: 200, total_tokens: 1200 },
  } as ChatCompletion;
}
