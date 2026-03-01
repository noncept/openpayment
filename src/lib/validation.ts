import {
  MAX_DESCRIPTION_LENGTH,
  SUPPORTED_NETWORKS,
  SUPPORTED_TYPES,
} from "./constants.ts";
import type { CreatePaymentInput } from "./types.ts";

/**
 * Validates EVM address shape.
 */
function isEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * Validates positive decimal string input.
 */
function isPositiveNumberString(value: string): boolean {
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    return false;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

/**
 * Normalizes price input to string for consistent validation and transport.
 */
export function normalizePrice(price: string | number): string {
  return typeof price === "number" ? price.toString() : price;
}

/**
 * Validates create request payload before network call.
 * Throws an Error with actionable text on invalid input.
 */
export function validateCreateInput(input: CreatePaymentInput): void {
  const normalizedPrice = normalizePrice(input.price).trim();
  const normalizedPayTo = input.payTo.trim();
  const normalizedNetwork = input.network.trim();

  if (!SUPPORTED_TYPES.has(input.type)) {
    throw new Error(
      'Invalid type. Allowed values: "SINGLE_USE", "MULTI_USE", "VARIABLE".',
    );
  }

  if (!isPositiveNumberString(normalizedPrice)) {
    throw new Error("Invalid price. Use a positive number like 0.001.");
  }

  if (!isEvmAddress(normalizedPayTo)) {
    throw new Error("Invalid payTo. Expected a valid EVM address (0x...).");
  }

  if (!SUPPORTED_NETWORKS.has(normalizedNetwork)) {
    throw new Error('Invalid network. Allowed values: "eip155:8453", "eip155:84532".');
  }

  if (input.description !== undefined) {
    if (typeof input.description !== "string") {
      throw new Error("Invalid description. Expected a string.");
    }

    if (input.description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(
        `Invalid description. Maximum length is ${MAX_DESCRIPTION_LENGTH} characters.`,
      );
    }
  }
}
