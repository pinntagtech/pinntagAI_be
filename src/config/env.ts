import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(4001),
  BACKEND_MONGODB_URI: z
    .string()
    .nonempty()
    .url()
    .or(z.string().nonempty().startsWith("mongodb://")),
  MONGODB_URI: z
    .string()
    .nonempty()
    .url()
    .or(z.string().nonempty().startsWith("mongodb://")),
  ETL_BASE_URL: z.string().nonempty().url().or(z.string().startsWith("http")),
  ETL_API_KEY: z.string().min(1),
  ENFORCE_INTERNAL_API_KEY: z.coerce.boolean().default(false),
  PINNTAG_BACKEND_TO_AI_KEY: z.string().optional(),
  HTTP_TIMEOUT_MS: z.coerce.number().default(15000),
  HTTP_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  ETL_API_KEY_HEADER_NAME: z.string().min(1).default("X-API-Key"),
  // Inbound auth config
  AUTH_REQUIRE_API_KEY: z.coerce.boolean().default(false),
  AUTH_REQUIRE_BEARER: z.coerce.boolean().default(false),
  AUTH_REQUIRE_BOTH: z.coerce.boolean().default(false),
  AUTH_API_KEY_HEADER_NAME: z.string().min(1).default("x-api-key"),
  AUTH_STATIC_API_KEY: z.string().optional(),
  AUTH_BEARER_TOKEN: z.string().optional(),
  AUTH_BEARER_TOKENS: z
    .preprocess(
      (v) => (typeof v === "string" ? v : undefined),
      z.string().optional()
    )
    .transform((s) =>
      s
        ? s
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : []
    ),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
