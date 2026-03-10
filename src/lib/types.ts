/**
 * Supported payment types for OpenPayment create endpoint.
 */
export type PaymentType = "SINGLE_USE" | "MULTI_USE" | "VARIABLE" | "PROXY";

/**
 * Input payload for payment creation.
 */
export interface CreatePaymentInput {
  type: PaymentType;
  price: string | number;
  payTo: string;
  network: string;
  description?: string;
  resourceUrl?: string;
}

/**
 * Raw API response for successful payment creation.
 */
export interface CreatePaymentApiResponse {
  paymentId: string;
}

/**
 * SDK/CLI output with payment identifier and generated payment URL.
 */
export interface CreatePaymentResult {
  paymentId: string;
  url: string;
}
