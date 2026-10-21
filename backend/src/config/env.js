import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanFromEnv = z
  .enum(["true", "false"])
  .optional()
  .transform((value) => value === "true");

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  ALLOWED_ORIGINS: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  CLIENT_URL: z.string().optional(),
  DNS_SERVERS: z.string().optional(),
  WHATSAPP_BUSINESS_NUMBER: z
    .string()
    .regex(/^\d{8,15}$/)
    .optional(),
  COD_ADVANCE_PAYMENT_PROVIDER: z.string().trim().max(80).optional(),
  COD_ADVANCE_PAYMENT_ACCOUNT_TITLE: z.string().trim().max(120).optional(),
  COD_ADVANCE_PAYMENT_ACCOUNT_NUMBER: z.string().trim().max(100).optional(),
  COD_ADVANCE_PAYMENT_IBAN: z.string().trim().max(100).optional(),
  PAYMENT_EASYPAISA_ACCOUNT_TITLE: z.string().trim().max(120).optional(),
  PAYMENT_EASYPAISA_ACCOUNT_NUMBER: z.string().trim().max(100).optional(),
  PAYMENT_JAZZCASH_ACCOUNT_TITLE: z.string().trim().max(120).optional(),
  PAYMENT_JAZZCASH_ACCOUNT_NUMBER: z.string().trim().max(100).optional(),
  PAYMENT_BANK_NAME: z.string().trim().max(120).optional(),
  PAYMENT_BANK_ACCOUNT_TITLE: z.string().trim().max(120).optional(),
  PAYMENT_BANK_ACCOUNT_NUMBER: z.string().trim().max(100).optional(),
  PAYMENT_BANK_IBAN: z.string().trim().max(100).optional(),
  COOKIE_SECURE: booleanFromEnv.default(false),
  ENABLE_DEMO_CONTENT: booleanFromEnv.default(false),
  DELIVERY_CHARGE_PKR: z.coerce.number().min(0).default(0),
  ADMIN_NAME: z.string().min(1).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const errors = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${errors}`);
}

const parseAllowedOrigins = (values) =>
  values.flatMap((value) =>
    (value || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map((origin) => {
        let url;
        try {
          url = new URL(origin);
        } catch {
          throw new Error("Invalid CORS origin in ALLOWED_ORIGINS, FRONTEND_URL, or CLIENT_URL");
        }
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.username ||
          url.password ||
          url.pathname !== "/" ||
          url.search ||
          url.hash
        ) {
          throw new Error("CORS origins must be HTTP(S) origins without paths in ALLOWED_ORIGINS, FRONTEND_URL, or CLIENT_URL");
        }
        return url.origin;
      }),
  );

const productionOrigins = [
  "https://quettabikesclub.com",
  "https://www.quettabikesclub.com",
];
const configuredOriginValues = parsed.data.ALLOWED_ORIGINS !== undefined
  ? [parsed.data.ALLOWED_ORIGINS]
  : [parsed.data.FRONTEND_URL, parsed.data.CLIENT_URL];
const configuredOrigins = parseAllowedOrigins([
  ...configuredOriginValues,
]);

export const env = Object.freeze({
  ...parsed.data,
  allowedOrigins: [
    ...new Set([
      ...productionOrigins,
      ...configuredOrigins.filter(
        (origin) =>
          parsed.data.NODE_ENV !== "production" ||
          !["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname),
      ),
      ...(parsed.data.NODE_ENV === "production"
        ? []
        : ["http://localhost:5173", "http://127.0.0.1:5173"]),
    ]),
  ],
  dnsServers:
    parsed.data.DNS_SERVERS?.split(",")
      .map((server) => server.trim())
      .filter(Boolean) || [],
});
