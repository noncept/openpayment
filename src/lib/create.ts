import { buildPaymentUrl } from "./buildPaymentUrl.ts";
import type { OpenPaymentConfig } from "./config.ts";
import { getDefaultConfig } from "./config.ts";
import { createPayment } from "./createPayment.ts";
import type { CreatePaymentInput, CreatePaymentResult } from "./types.ts";

/**
 * Creates a payment using an explicit config (intended for CLI and tests).
 */
export async function createWithConfig(
  input: CreatePaymentInput,
  config: OpenPaymentConfig,
): Promise<CreatePaymentResult> {
  const { paymentId } = await createPayment(input, config.apiUrl);

  return {
    paymentId,
    url: buildPaymentUrl(paymentId, config.siteUrl),
  };
}

/**
 * Public SDK entry point for creating a payment.
 */
export async function create(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  return createWithConfig(input, getDefaultConfig());
}
