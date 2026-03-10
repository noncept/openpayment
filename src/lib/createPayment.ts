import type { CreatePaymentApiResponse, CreatePaymentInput } from "./types.ts";
import { normalizeCreateInput } from "./validation.ts";

interface ApiErrorBody {
  message?: string;
  error?: string;
}

/**
 * Normalizes API base URL by removing trailing slashes.
 */
function normalizeApiUrl(apiUrl: string): string {
  return apiUrl.replace(/\/+$/, "");
}

/**
 * Extracts the most useful API error message from a response body.
 */
function parseApiError(status: number, body: unknown): string {
  if (typeof body === "object" && body !== null) {
    const typed = body as ApiErrorBody;
    if (typeof typed.message === "string" && typed.message.trim().length > 0) {
      return typed.message;
    }
    if (typeof typed.error === "string" && typed.error.trim().length > 0) {
      return typed.error;
    }
  }

  return `OpenPayment API request failed with status ${status}.`;
}

/**
 * Creates a timeout signal when supported by the runtime.
 */
function createRequestSignal(timeoutMs: number): AbortSignal | undefined {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }

  return undefined;
}

/**
 * Executes the create payment API call against the provided API base URL.
 */
export async function createPayment(
  input: CreatePaymentInput,
  apiBaseUrl: string,
): Promise<CreatePaymentApiResponse> {
  const normalizedInput = normalizeCreateInput(input);

  const fetchImpl = globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("Fetch API is not available in this runtime.");
  }

  const payload = {
    type: normalizedInput.type,
    price: normalizedInput.price,
    payTo: normalizedInput.payTo,
    network: normalizedInput.network,
    description: normalizedInput.description,
    resource:
      normalizedInput.type === "PROXY"
        ? {
            type: "API",
            url: normalizedInput.resourceUrl,
          }
        : undefined,
  };

  const response = await fetchImpl(`${normalizeApiUrl(apiBaseUrl)}/x-payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: createRequestSignal(15000),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(`OpenPayment API returned a non-JSON response (${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(parseApiError(response.status, data));
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("paymentId" in data) ||
    typeof (data as { paymentId: unknown }).paymentId !== "string"
  ) {
    throw new Error("OpenPayment API response does not include a valid paymentId.");
  }

  return {
    paymentId: (data as { paymentId: string }).paymentId,
  };
}
