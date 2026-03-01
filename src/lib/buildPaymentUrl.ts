/**
 * Ensures generated links point to the `/pay/` route.
 */
function normalizePayPath(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "");
  return clean.endsWith("/pay") ? "/pay/" : `${clean}/pay/`;
}

/**
 * Builds a payment page URL from payment ID and site base URL.
 */
export function buildPaymentUrl(paymentId: string, siteBaseUrl: string): string {
  if (!paymentId || typeof paymentId !== "string") {
    throw new Error("A valid paymentId string is required.");
  }

  try {
    const url = new URL(siteBaseUrl);
    url.pathname = normalizePayPath(url.pathname);
    url.searchParams.set("paymentId", paymentId);
    return url.toString();
  } catch {
    const trimmed = siteBaseUrl.replace(/\/+$/, "");
    const separator = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}/pay/${separator}paymentId=${encodeURIComponent(paymentId)}`;
  }
}
