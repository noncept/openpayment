import type { PaymentType } from "./types.ts";

/**
 * Default API base URL used by the SDK.
 */
export const DEFAULT_API_URL = "https://api.openpayment.link";

/**
 * Default site base URL used to build payment page links.
 */
export const DEFAULT_SITE_URL = "https://openpayment.link";

/**
 * Allowed payment types for create requests.
 */
export const SUPPORTED_TYPES: ReadonlySet<PaymentType> = new Set([
  "SINGLE_USE",
  "MULTI_USE",
  "VARIABLE",
]);

/**
 * Allowed CAIP-2 network IDs for create requests.
 */
export const SUPPORTED_NETWORKS: ReadonlySet<string> = new Set([
  "eip155:8453",
  "eip155:84532",
]);

/**
 * Maximum accepted description length.
 */
export const MAX_DESCRIPTION_LENGTH = 500;
