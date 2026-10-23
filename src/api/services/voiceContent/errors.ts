// Error codes the backend can act on. Only the two 422s are the merchant's to
// fix; everything else is shown as "Something went wrong" and refunded.

export type VoiceContentErrorCode =
  | "NO_CONTENT"
  | "NOT_RELEVANT"
  | "INVALID_REQUEST"
  | "TIMEOUT"
  | "PROVIDER_ERROR"
  | "SCHEMA_FAILURE"
  | "INTERNAL";

const STATUS: Record<VoiceContentErrorCode, number> = {
  NO_CONTENT: 422,
  NOT_RELEVANT: 422,
  INVALID_REQUEST: 400,
  TIMEOUT: 504,
  PROVIDER_ERROR: 502,
  SCHEMA_FAILURE: 502,
  INTERNAL: 500,
};

const MESSAGES: Record<VoiceContentErrorCode, string> = {
  NO_CONTENT: "We couldn't find enough detail. Try again.",
  NOT_RELEVANT: "Describe the deal or event, when it happens and where.",
  INVALID_REQUEST: "Invalid request.",
  TIMEOUT: "The draft took too long.",
  PROVIDER_ERROR: "The language model call failed.",
  SCHEMA_FAILURE: "The language model returned an invalid draft.",
  INTERNAL: "Something went wrong.",
};

export class VoiceContentError extends Error {
  readonly status: number;

  constructor(
    readonly code: VoiceContentErrorCode,
    message: string = MESSAGES[code],
  ) {
    super(message);
    this.name = "VoiceContentError";
    this.status = STATUS[code];
  }

  toBody() {
    return { code: this.code, message: this.message };
  }
}
