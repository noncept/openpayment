import { DEFAULT_API_URL, DEFAULT_SITE_URL } from "./constants.ts";

export interface OpenPaymentConfig {
  apiUrl: string;
  siteUrl: string;
}

/**
 * Ensures URL has an allowed protocol for outbound requests and link generation.
 */
function validateHttpUrl(name: string, value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid ${name} value: ${value}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Invalid ${name} protocol: ${parsed.protocol}`);
  }

  return parsed.toString();
}

/**
 * SDK config: always use production defaults.
 */
export const getDefaultConfig = (): OpenPaymentConfig => ({
  apiUrl: DEFAULT_API_URL,
  siteUrl: DEFAULT_SITE_URL,
});

/**
 * CLI config: defaults, but allows env override when the process is started
 * with environment variables (for example via `node --env-file=.env ...`).
 */
export const getCliConfig = (): OpenPaymentConfig => {
  const apiUrl = process.env.OPENPAYMENT_API_URL?.trim() || DEFAULT_API_URL;
  const siteUrl = process.env.OPENPAYMENT_SITE_URL?.trim() || DEFAULT_SITE_URL;

  return {
    apiUrl: validateHttpUrl("OPENPAYMENT_API_URL", apiUrl),
    siteUrl: validateHttpUrl("OPENPAYMENT_SITE_URL", siteUrl),
  };
};
