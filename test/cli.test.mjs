import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_PATH = path.resolve(__dirname, "../dist/cli.js");
const FETCH_MOCK_PATH = path.resolve(__dirname, "./helpers/mock-fetch-cli.mjs");

function runCli(args, env = {}, options = {}) {
  return new Promise((resolve) => {
    const spawnArgs = [];

    if (options.mockFetch) {
      spawnArgs.push("--import", FETCH_MOCK_PATH);
    }

    spawnArgs.push(CLI_PATH, ...args);

    const child = spawn(process.execPath, spawnArgs, {
      env: {
        ...process.env,
        ...env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

const DEFAULT_ENV = {
  OPENPAYMENT_API_URL: "https://api.example.test",
  OPENPAYMENT_SITE_URL: "https://openpayment.link",
};

test("cli shows top-level help", async () => {
  const result = await runCli(["--help"]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /openpayment CLI/);
  assert.match(result.stdout, /Usage:/);
});

test("cli shows create help", async () => {
  const result = await runCli(["create", "--help"]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /Options:/);
});

test("cli rejects unknown command", async () => {
  const result = await runCli(["unknown"]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Unknown command: unknown/);
});

test("cli validates required flags", async () => {
  const result = await runCli([
    "create",
    "--type",
    "SINGLE_USE",
    "--network",
    "eip155:84532",
  ]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Missing required flag --price/);
});

test("cli validates missing --type", async () => {
  const result = await runCli([
    "create",
    "--price",
    "0.001",
    "--payTo",
    "0x1111111111111111111111111111111111111111",
    "--network",
    "eip155:84532",
  ]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Missing required flag --type/);
});

test("cli validates missing --network", async () => {
  const result = await runCli([
    "create",
    "--type",
    "SINGLE_USE",
    "--price",
    "0.001",
    "--payTo",
    "0x1111111111111111111111111111111111111111",
  ]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Missing required flag --network/);
});

test("cli validates missing --payTo", async () => {
  const result = await runCli([
    "create",
    "--type",
    "SINGLE_USE",
    "--price",
    "0.001",
    "--network",
    "eip155:84532",
  ]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Missing required flag --payTo/);
});

test("cli prints validation hints for invalid type", async () => {
  const result = await runCli(
    [
      "create",
      "--type",
      "SINGLE_USE",
      "--price",
      "0.001",
      "--payTo",
      "0x1111111111111111111111111111111111111111",
      "--network",
      "eip155:84532",
    ],
    {
      ...DEFAULT_ENV,
      OPENPAYMENT_TEST_SCENARIO: "invalid_flag_hint",
    },
    { mockFetch: true },
  );

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Error: Invalid --type test hint/);
});

test("cli prints validation hints for local type validation errors", async () => {
  const result = await runCli([
    "create",
    "--type",
    "WRONG",
    "--price",
    "0.001",
    "--payTo",
    "0x1111111111111111111111111111111111111111",
    "--network",
    "eip155:84532",
  ]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Error: Invalid type/);
});

test("cli create prints human-friendly output", async () => {
  const outputFile = path.resolve(__dirname, "./.cli-fetch-call.json");

  const result = await runCli(
    [
      "create",
      "--type",
      "SINGLE_USE",
      "--price",
      " 0.001 ",
      "--payTo",
      " 0x1111111111111111111111111111111111111111 ",
      "--network",
      " eip155:84532 ",
      "--description",
      "test payment",
    ],
    {
      ...DEFAULT_ENV,
      OPENPAYMENT_TEST_SCENARIO: "success",
      OPENPAYMENT_TEST_OUTPUT: outputFile,
    },
    { mockFetch: true },
  );

  assert.equal(result.code, 0);
  assert.match(result.stdout, /Payment created successfully/);
  assert.match(result.stdout, /paymentId: 123e4567-e89b-12d3-a456-426614174000/);
  assert.match(result.stdout, /https:\/\/openpayment\.link\/pay\/\?paymentId=/);

  const fetchCall = JSON.parse(fs.readFileSync(outputFile, "utf8"));
  assert.equal(fetchCall.url, "https://api.example.test/x-payments");
  assert.equal(fetchCall.init.method, "POST");
  assert.deepEqual(JSON.parse(fetchCall.init.body), {
    type: "SINGLE_USE",
    price: "0.001",
    payTo: "0x1111111111111111111111111111111111111111",
    network: "eip155:84532",
    description: "test payment",
  });

  fs.rmSync(outputFile, { force: true });
});

test("cli create PROXY passes resource payload", async () => {
  const outputFile = path.resolve(__dirname, "./.cli-fetch-call-proxy.json");

  const result = await runCli(
    [
      "create",
      "--type",
      "PROXY",
      "--price",
      "1",
      "--payTo",
      "0x1111111111111111111111111111111111111111",
      "--network",
      "eip155:84532",
      "--resourceUrl",
      "https://private-api.example.com/endpoint",
    ],
    {
      ...DEFAULT_ENV,
      OPENPAYMENT_TEST_SCENARIO: "success",
      OPENPAYMENT_TEST_OUTPUT: outputFile,
    },
    { mockFetch: true },
  );

  assert.equal(result.code, 0);

  const fetchCall = JSON.parse(fs.readFileSync(outputFile, "utf8"));
  assert.deepEqual(JSON.parse(fetchCall.init.body), {
    type: "PROXY",
    price: "1",
    payTo: "0x1111111111111111111111111111111111111111",
    network: "eip155:84532",
    resource: {
      type: "API",
      url: "https://private-api.example.com/endpoint",
    },
  });

  fs.rmSync(outputFile, { force: true });
});

test("cli create PROXY requires --resourceUrl", async () => {
  const result = await runCli([
    "create",
    "--type",
    "PROXY",
    "--price",
    "1",
    "--payTo",
    "0x1111111111111111111111111111111111111111",
    "--network",
    "eip155:84532",
  ]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Missing required flag --resourceUrl when --type is PROXY/);
});

test("cli create --json prints JSON only", async () => {
  const result = await runCli(
    [
      "create",
      "--type",
      "SINGLE_USE",
      "--price",
      "0.001",
      "--payTo",
      "0x1111111111111111111111111111111111111111",
      "--network",
      "eip155:84532",
      "--json",
    ],
    {
      ...DEFAULT_ENV,
      OPENPAYMENT_TEST_SCENARIO: "success",
    },
    { mockFetch: true },
  );

  assert.equal(result.code, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.paymentId, "123e4567-e89b-12d3-a456-426614174000");
  assert.equal(
    parsed.url,
    "https://openpayment.link/pay/?paymentId=123e4567-e89b-12d3-a456-426614174000",
  );
});

test("cli maps API errors", async () => {
  const result = await runCli(
    [
      "create",
      "--type",
      "SINGLE_USE",
      "--price",
      "0.001",
      "--payTo",
      "0x1111111111111111111111111111111111111111",
      "--network",
      "eip155:84532",
    ],
    {
      ...DEFAULT_ENV,
      OPENPAYMENT_TEST_SCENARIO: "api_message_error",
    },
    { mockFetch: true },
  );

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Error: Missing payment type/);
});

test("cli handles non-Error throwables", async () => {
  const result = await runCli(
    [
      "create",
      "--type",
      "SINGLE_USE",
      "--price",
      "0.001",
      "--payTo",
      "0x1111111111111111111111111111111111111111",
      "--network",
      "eip155:84532",
    ],
    {
      ...DEFAULT_ENV,
      OPENPAYMENT_TEST_SCENARIO: "throw_string",
    },
    { mockFetch: true },
  );

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Error: Unexpected error/);
});
