# AI Agent Guidelines for integrating OpenPayment SDK and CLI

OpenPayment lets you create x402 stablecoin payment links that settle in USDC on Base.
Links are hosted at [https://openpayment.link](https://openpayment.link).

## Install

```bash
npm install openpayment                                 # SDK
npm install -g openpayment                              # CLI (global)
npx skills add https://github.com/noncept/openpayment   # SKILL
```

## CLI

Create a payment link from the terminal:

```bash
openpayment create \
  --type "<PAYMENT_TYPE>" \
  --price "<AMOUNT>" \
  --payTo "<EVM_ADDRESS>" \
  --network "<NETWORK>" \
  [--resourceUrl "<HTTPS_URL_FOR_PROXY>"] \
  --description "<DESCRIPTION>"
```

Example:

```bash
openpayment create \
  --type "SINGLE_USE" \
  --price "10" \
  --payTo "0xYourWalletAddress" \
  --network "eip155:8453"
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

**Use `--json` for machine-readable output:**

```bash
openpayment create \
  --type "SINGLE_USE" \
  --price "25" \
  --payTo "0xYourWalletAddress" \
  --network "eip155:8453" \
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

### CLI flags

| Flag            | Required    | Description                                                         |
| --------------- | ----------- | ------------------------------------------------------------------- |
| `--type`        | Yes         | `SINGLE_USE`, `MULTI_USE`, `VARIABLE`, or `PROXY`                   |
| `--price`       | Yes         | Amount in USDC, e.g. `10` or `0.50`                                 |
| `--payTo`       | Yes         | Recipient EVM address (`0x` + 40 hex chars)                         |
| `--network`     | Yes         | CAIP-2 network ID                                                   |
| `--resourceUrl` | Conditional | Required when `--type` is `PROXY`; upstream API URL (`https://...`) |
| `--description` | No          | Payment description, max 500 chars                                  |
| `--json`        | No          | Print JSON output only                                              |

## SDK

```ts
import { create } from "openpayment";

const result = await create({
  type: "SINGLE_USE",
  price: "10",
  payTo: "0xYourWalletAddress",
  network: "eip155:8453",
  description: "Payment for order #123",
});

console.log(result.paymentId); // "ed5b8e83-607b-4853-90c6-f4f3ba821424"
console.log(result.url); // "https://openpayment.link/pay/?paymentId=ed5b8e83-607b-4853-90c6-f4f3ba821424"
```

The `create()` function validates input locally before making any network call and throws an `Error` with a descriptive message on invalid input or API failure.

### Input fields

| Field         | Type               | Required    | Description                                                     |
| ------------- | ------------------ | ----------- | --------------------------------------------------------------- |
| `type`        | `string`           | Yes         | `SINGLE_USE`, `MULTI_USE`, `VARIABLE`, or `PROXY`               |
| `price`       | `string \| number` | Yes         | Positive USDC amount, e.g. `"10"` or `10`                       |
| `payTo`       | `string`           | Yes         | Recipient EVM address                                           |
| `network`     | `string`           | Yes         | CAIP-2 network ID                                               |
| `description` | `string`           | No          | Payment description, max 500 chars                              |
| `resourceUrl` | `string`           | Conditional | Required when `type` is `PROXY`; must be a valid `https://` URL |

### Return value

```ts
{
  paymentId: string; // UUID of the created payment
  url: string; // Shareable payment page URL
}
```

## Payment types

| Type         | Use case                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `SINGLE_USE` | One-time payment with fixed price (e.g., a specific order, invoice)                             |
| `MULTI_USE`  | Fixed price, can be paid multiple times (e.g., recurring product)                               |
| `VARIABLE`   | Reusable link; payer chooses amount per payment (e.g., tips, donations)                         |
| `PROXY`      | Fixed-price multi-use payment; after settlement, OpenPayment fetches a private upstream API URL |

## Networks

| Name         | CAIP-2 network ID | Notes                 |
| ------------ | ----------------- | --------------------- |
| Base Mainnet | `eip155:8453`     | Production, real USDC |
| Base Sepolia | `eip155:84532`    | Testnet, test USDC    |

## Currency

The default currency is **USDC**.

- Base Mainnet USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

Support for custom ERC-20 tokens will be added soon.

## Learn More

- Website: https://openpayment.link
- GitHub: https://github.com/noncept/openpayment
- SKILL: [SKILL.md](./skills/openpayment/SKILL.md)
