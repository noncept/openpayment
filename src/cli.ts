#!/usr/bin/env node

import { parseArgs } from "node:util";
import { getCliConfig } from "./lib/config.ts";
import { createWithConfig } from "./lib/create.ts";
import type { CreatePaymentInput, PaymentType } from "./lib/types.ts";
import { normalizePrice, validateCreateInput } from "./lib/validation.ts";

interface CreateCommandOptions {
  input: CreatePaymentInput;
  json: boolean;
}

/**
 * Prints CLI help output.
 */
function printHelp(): void {
  const config = getCliConfig();

  console.log(`openpayment CLI

Usage:
  openpayment create --type <SINGLE_USE|MULTI_USE|VARIABLE|PROXY> --price <amount> --payTo <address> --network <eip155:8453|eip155:84532> [--description <text>] [--resourceUrl <https://...>] [--json]

Example:
  openpayment create --type "SINGLE_USE" --price "0.001" --payTo "0xYourWalletAddress" --network "eip155:84532" --description "your description"

Options:
  --type             Payment type (required)
  --price            Positive amount string, e.g. 0.001 (required)
  --payTo            Recipient wallet address (required)
  --network          eip155:8453 or eip155:84532 (required)
  --description      Payment description
  --resourceUrl      Required when --type is PROXY. Upstream private API URL.
  --json             Print JSON output only
  --help             Show help

Environment variables:

  OPENPAYMENT_API_URL=${config.apiUrl}
  OPENPAYMENT_SITE_URL=${config.siteUrl}
`);
}

/**
 * Parses and validates `openpayment create` flags.
 */
function parseCreateFlags(args: string[]): CreateCommandOptions {
  const { values } = parseArgs({
    args,
    options: {
      type: { type: "string" },
      price: { type: "string" },
      payTo: { type: "string" },
      network: { type: "string" },
      description: { type: "string" },
      resourceUrl: { type: "string" },
      json: { type: "boolean" },
      help: { type: "boolean" },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (!values.type) {
    throw new Error("Missing required flag --type");
  }
  if (!values.price) {
    throw new Error("Missing required flag --price");
  }
  if (!values.network) {
    throw new Error("Missing required flag --network");
  }
  if (!values.payTo) {
    throw new Error("Missing required flag --payTo");
  }
  if (values.type === "PROXY" && !values.resourceUrl) {
    throw new Error("Missing required flag --resourceUrl when --type is PROXY");
  }

  const input: CreatePaymentInput = {
    type: values.type as PaymentType,
    price: normalizePrice(values.price),
    payTo: values.payTo,
    network: values.network,
    description: values.description,
    resourceUrl: values.type === "PROXY" ? values.resourceUrl : undefined,
  };

  validateCreateInput(input);

  return {
    input,
    json: values.json ?? false,
  };
}

/**
 * CLI entrypoint.
 */
async function main(): Promise<void> {
  const [command, ...rawArgs] = process.argv.slice(2);

  if (!command || command === "--help") {
    printHelp();
    process.exit(0);
  }

  if (command !== "create") {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }

  try {
    const { input, json } = parseCreateFlags(rawArgs);
    const result = await createWithConfig(input, getCliConfig());

    if (json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log("Payment created successfully");
    console.log(`paymentId: ${result.paymentId}`);
    console.log(`url: ${result.url}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error(`Error: ${message}`);

    process.exit(1);
  }
}

void main();
