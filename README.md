# <img src="./logo.png" alt="OpenPayment" height="40px">

[![NPM Package](https://img.shields.io/npm/v/openpayment.svg?style=flat-square)](https://www.npmjs.org/package/openpayment)
[![CI](https://github.com/noncept/openpayment/actions/workflows/ci.yml/badge.svg)](https://github.com/noncept/openpayment/actions/workflows/ci.yml)
[![MIT licensed](https://img.shields.io/github/license/noncept/openpayment)](https://github.com/noncept/openpayment/blob/main/LICENSE)

## OpenPayment SDK + CLI

SDK and CLI for creating x402 stablecoin payment links that settle in USDC on Base.

Powered by OpenPayment and x402.

## About OpenPayment

OpenPayment lets merchants, creators, developers, and AI agents accept USDC payments with shareable payment links and APIs. 0% platform fees, instant settlement to recipient wallet, and no sign-up required. Powered by x402.

Discover more about [OpenPayment](https://openpayment.link).

## Features

- Public SDK method: `create(...)`
- CLI command: `openpayment create ...`
- Strict input validation before network calls
- Zero runtime dependencies

## Install

```bash
npm i openpayment
```

Global CLI:

```bash
npm i -g openpayment
```

Install [SKILL](./skills/openpayment/SKILL.md):

```bash
# OpenCode, Claude Code, Codex, Cursor...
npx skills add https://github.com/noncept/openpayment
```

```bash
# OpenClaw
clawhub install openpayment
```

> If you are an AI Agent, check [AGENTS.md](./AGENTS.md).

## SDK Usage

```ts
import { create } from "openpayment";

const result = await create({
  type: "SINGLE_USE",
  price: "10",
  payTo: "0xYourWalletAddress",
  network: "eip155:8453",
  description: "Example payment",
});

console.log(result.paymentId); // "ed5b8e83-607b-4853-90c6-f4f3ba821424"
console.log(result.url); // "https://openpayment.link/pay/?paymentId=ed5b8e83-607b-4853-90c6-f4f3ba821424"
```

### SDK API

`create(input)` returns:

```ts
{
  paymentId: string;
  url: string;
}
```

## CLI Usage

### Default

```bash
openpayment create \
  --type "SINGLE_USE" \
  --price "10" \
  --payTo "0xYourWalletAddress" \
  --network "eip155:8453" \
  --description "Example payment"
```

Output:

```text
Payment created successfully
paymentId: <paymentId>
url: <paymentUrl>
```

Example:

```text
Payment created successfully
paymentId: ed5b8e83-607b-4853-90c6-f4f3ba821424
url: https://openpayment.link/pay/?paymentId=ed5b8e83-607b-4853-90c6-f4f3ba821424
```

### Json

```bash
openpayment create \
  --type "SINGLE_USE" \
  --price "10" \
  --payTo "0xYourWalletAddress" \
  --network "eip155:8453" \
  --description "Example payment" \
  --json
```

Output:

```json
{
  "paymentId": "<paymentId>",
  "url": "<paymentUrl>"
}
```

Example:

```json
{
  "paymentId": "ed5b8e83-607b-4853-90c6-f4f3ba821424",
  "url": "https://openpayment.link/pay/?paymentId=ed5b8e83-607b-4853-90c6-f4f3ba821424"
}
```

## Validation Rules

- `type`:
  - `SINGLE_USE` (one-time)
  - `MULTI_USE` (reusable fixed amount)
  - `VARIABLE` (reusable custom amount)
  - `PROXY` (reusable fixed amount + upstream API proxy call after settlement)
- `price`: positive decimal string/number (example: `10`, `0.01`)
- `payTo`: EVM address (`0x` + 40 hex chars)
- `network`: `eip155:8453` or `eip155:84532`
- `description`: optional string, max 500 chars
- `resourceUrl`: required only for `PROXY` (`https://...`)

## Links:

- [OpenPayment website](https://openpayment.link/)
- [AGENTS.md](./AGENTS.md)
- [SKILL.md](./skills/openpayment/SKILL.md)

## License

OpenPayment is released under the MIT License.
