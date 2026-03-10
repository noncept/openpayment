import {
  MAX_DESCRIPTION_LENGTH,
  SUPPORTED_NETWORKS,
  SUPPORTED_TYPES,
} from "./constants.ts";
import type { CreatePaymentInput } from "./types.ts";

export interface NormalizedCreatePaymentInput {
  type: CreatePaymentInput["type"];
  price: string;
  payTo: string;
  network: string;
  description?: string;
  resourceUrl?: string;
}

/**
 * Validates EVM address shape.
 */
function isEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * Validates proxy resource URL shape and protocol.
 */
function isAllowedResourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates proxy resource URL payload.
 */
function validateProxyResourceUrl(resourceUrl: string | undefined): void {
  if (!resourceUrl) {
    throw new Error("Invalid resourceUrl. PROXY payments require a valid resourceUrl.");
  }

  if (!isAllowedResourceUrl(resourceUrl.trim())) {
    throw new Error("Invalid resourceUrl. Expected a valid https URL.");
  }
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
 * Normalizes and validates create request payload before network call.
 * Throws an Error with actionable text on invalid input.
 */
export function normalizeCreateInput(
  input: CreatePaymentInput,
): NormalizedCreatePaymentInput {
  const normalizedPrice = normalizePrice(input.price).trim();
  const normalizedPayTo = input.payTo.trim();
  const normalizedNetwork = input.network.trim();
  const normalizedResourceUrl = input.resourceUrl?.trim();

  if (!SUPPORTED_TYPES.has(input.type)) {
    throw new Error(
      'Invalid type. Allowed values: "SINGLE_USE", "MULTI_USE", "VARIABLE", "PROXY".',
    );
  }

  if (input.type === "PROXY") {
    validateProxyResourceUrl(normalizedResourceUrl);
  } else if (normalizedResourceUrl !== undefined) {
    throw new Error(
      "Invalid resourceUrl. resourceUrl is only supported when type is PROXY.",
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

  return {
    type: input.type,
    price: normalizedPrice,
    payTo: normalizedPayTo,
    network: normalizedNetwork,
    description: input.description,
    resourceUrl: normalizedResourceUrl,
  };
}

/**
 * Validates create request payload before network call.
 */
export function validateCreateInput(input: CreatePaymentInput): void {
  normalizeCreateInput(input);
}
