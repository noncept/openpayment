import assert from "node:assert/strict";
import test from "node:test";

import { create } from "../dist/index.js";
import { buildPaymentUrl } from "../dist/lib/buildPaymentUrl.js";
import { getCliConfig, getDefaultConfig } from "../dist/lib/config.js";
import { createWithConfig } from "../dist/lib/create.js";
import { createPayment } from "../dist/lib/createPayment.js";
import { normalizePrice, validateCreateInput } from "../dist/lib/validation.js";

const VALID_INPUT = {
  type: "SINGLE_USE",
  price: "0.001",
  payTo: "0x1111111111111111111111111111111111111111",
  network: "eip155:84532",
  description: "test payment",
};

const originalFetch = globalThis.fetch;
const originalAbortSignalTimeout = AbortSignal.timeout;
const originalApiEnv = process.env.OPENPAYMENT_API_URL;
const originalSiteEnv = process.env.OPENPAYMENT_SITE_URL;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  AbortSignal.timeout = originalAbortSignalTimeout;
  process.env.OPENPAYMENT_API_URL = originalApiEnv;
  process.env.OPENPAYMENT_SITE_URL = originalSiteEnv;
});

test("createWithConfig posts payload and returns paymentId + /pay/ url", async () => {
  let calledUrl = "";
  let calledInit;

  globalThis.fetch = async (input, init) => {
    calledUrl = String(input);
    calledInit = init;

    return {
      ok: true,
      status: 200,
      json: async () => ({ paymentId: "123e4567-e89b-12d3-a456-426614174000" }),
    };
  };

  const result = await createWithConfig(VALID_INPUT, {
    apiUrl: "https://api.example.test///",
    siteUrl: "https://site.example.test/app",
  });

  assert.equal(calledUrl, "https://api.example.test/x-payments");
  assert.equal(calledInit.method, "POST");
  assert.deepEqual(JSON.parse(calledInit.body), VALID_INPUT);
  assert.ok(calledInit.signal instanceof AbortSignal);
  assert.equal(result.paymentId, "123e4567-e89b-12d3-a456-426614174000");
  assert.equal(
    result.url,
    "https://site.example.test/app/pay/?paymentId=123e4567-e89b-12d3-a456-426614174000",
  );
});

test("create uses SDK defaults and ignores env overrides", async () => {
  process.env.OPENPAYMENT_API_URL = "http://localhost:9999/dev";
  process.env.OPENPAYMENT_SITE_URL = "http://localhost:3000";

  let calledUrl = "";
  globalThis.fetch = async (input) => {
    calledUrl = String(input);
    return {
      ok: true,
      status: 200,
      json: async () => ({ paymentId: "123e4567-e89b-12d3-a456-426614174000" }),
    };
  };

  const result = await create(VALID_INPUT);

  assert.equal(calledUrl, "https://api.openpayment.link/x-payments");
  assert.equal(
    result.url,
    "https://openpayment.link/pay/?paymentId=123e4567-e89b-12d3-a456-426614174000",
  );
});

test("createPayment throws when fetch is unavailable", async () => {
  globalThis.fetch = undefined;

  await assert.rejects(
    () => createPayment(VALID_INPUT, "https://api.openpayment.link"),
    /Fetch API is not available/,
  );
});

test("createPayment sends undefined signal when AbortSignal.timeout is unavailable", async () => {
  AbortSignal.timeout = undefined;

  let calledInit;
  globalThis.fetch = async (_input, init) => {
    calledInit = init;
    return {
      ok: true,
      status: 200,
      json: async () => ({ paymentId: "123e4567-e89b-12d3-a456-426614174000" }),
    };
  };

  await createPayment(VALID_INPUT, "https://api.openpayment.link");

  assert.equal(calledInit.signal, undefined);
});

test("createPayment maps API errors from message field", async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ message: "Missing payment type." }),
  });

  await assert.rejects(
    () => createPayment(VALID_INPUT, "https://api.openpayment.link"),
    /Missing payment type/,
  );
});

test("createPayment maps API errors from error field", async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({ error: "Validation Error" }),
  });

  await assert.rejects(
    () => createPayment(VALID_INPUT, "https://api.openpayment.link"),
    /Validation Error/,
  );
});

test("createPayment maps API errors with fallback status text", async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 502,
    json: async () => ({}),
  });

  await assert.rejects(
    () => createPayment(VALID_INPUT, "https://api.openpayment.link"),
    /status 502/,
  );
});

test("createPayment throws when API returns non-JSON", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 500,
    json: async () => {
      throw new Error("invalid json");
    },
  });

  await assert.rejects(
    () => createPayment(VALID_INPUT, "https://api.openpayment.link"),
    /non-JSON response \(500\)/,
  );
});

test("createPayment throws when response paymentId is invalid", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ paymentId: 123 }),
  });

  await assert.rejects(
    () => createPayment(VALID_INPUT, "https://api.openpayment.link"),
    /does not include a valid paymentId/,
  );
});

test("validation accepts valid input and normalizes numbers", () => {
  validateCreateInput(VALID_INPUT);
  assert.equal(normalizePrice("1.5"), "1.5");
  assert.equal(normalizePrice(1.5), "1.5");
});

test("validation rejects unsupported type", () => {
  assert.throws(
    () => validateCreateInput({ ...VALID_INPUT, type: "WRONG" }),
    /Invalid type/,
  );
});

test("validation rejects invalid price", () => {
  assert.throws(
    () => validateCreateInput({ ...VALID_INPUT, price: "-1" }),
    /Invalid price/,
  );
});

test("validation rejects invalid payTo", () => {
  assert.throws(
    () => validateCreateInput({ ...VALID_INPUT, payTo: "0x123" }),
    /Invalid payTo/,
  );
});

test("validation rejects unsupported network", () => {
  assert.throws(
    () => validateCreateInput({ ...VALID_INPUT, network: "eip155:1" }),
    /Invalid network/,
  );
});

test("validation rejects non-string description", () => {
  assert.throws(
    () => validateCreateInput({ ...VALID_INPUT, description: 10 }),
    /Invalid description\. Expected a string/,
  );
});

test("validation rejects too long description", () => {
  assert.throws(
    () => validateCreateInput({ ...VALID_INPUT, description: "a".repeat(501) }),
    /Maximum length is 500/,
  );
});

test("buildPaymentUrl normalizes path and keeps existing query", () => {
  assert.equal(
    buildPaymentUrl("p1", "https://openpayment.link/shop?x=1"),
    "https://openpayment.link/shop/pay/?x=1&paymentId=p1",
  );

  assert.equal(
    buildPaymentUrl("p2", "https://openpayment.link/pay"),
    "https://openpayment.link/pay/?paymentId=p2",
  );
});

test("buildPaymentUrl uses fallback for invalid base URL", () => {
  assert.equal(buildPaymentUrl("p1", "not-a-url"), "not-a-url/pay/?paymentId=p1");
  assert.equal(buildPaymentUrl("p2", "not-a-url?x=1"), "not-a-url?x=1/pay/&paymentId=p2");
});

test("buildPaymentUrl rejects invalid paymentId", () => {
  assert.throws(() => buildPaymentUrl("", "https://openpayment.link"), /paymentId/);
});

test("config exposes expected defaults", () => {
  assert.deepEqual(getDefaultConfig(), {
    apiUrl: "https://api.openpayment.link",
    siteUrl: "https://openpayment.link",
  });
});

test("getCliConfig uses env overrides and trims whitespace", () => {
  process.env.OPENPAYMENT_API_URL = "  https://api.example.test/v1  ";
  process.env.OPENPAYMENT_SITE_URL = "  https://site.example.test/app/  ";

  assert.deepEqual(getCliConfig(), {
    apiUrl: "https://api.example.test/v1",
    siteUrl: "https://site.example.test/app/",
  });
});

test("getCliConfig falls back to defaults for empty env values", () => {
  process.env.OPENPAYMENT_API_URL = "   ";
  process.env.OPENPAYMENT_SITE_URL = "\n";

  assert.deepEqual(getCliConfig(), {
    apiUrl: "https://api.openpayment.link/",
    siteUrl: "https://openpayment.link/",
  });
});

test("getCliConfig rejects invalid URL and protocol", () => {
  process.env.OPENPAYMENT_API_URL = "not a url";
  assert.throws(() => getCliConfig(), /Invalid OPENPAYMENT_API_URL value/);

  process.env.OPENPAYMENT_API_URL = "https://api.openpayment.link";
  process.env.OPENPAYMENT_SITE_URL = "file:///tmp/x";
  assert.throws(() => getCliConfig(), /Invalid OPENPAYMENT_SITE_URL protocol/);
});
