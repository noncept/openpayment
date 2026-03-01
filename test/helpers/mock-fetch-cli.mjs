import fs from "node:fs";

const scenario = process.env.OPENPAYMENT_TEST_SCENARIO ?? "success";
const outputFile = process.env.OPENPAYMENT_TEST_OUTPUT;

function recordCall(input, init) {
  if (!outputFile) {
    return;
  }

  fs.writeFileSync(
    outputFile,
    JSON.stringify({
      url: String(input),
      init,
    }),
  );
}

globalThis.fetch = async (input, init) => {
  recordCall(input, init);

  if (scenario === "throw_string") {
    throw "boom";
  }

  if (scenario === "invalid_flag_hint") {
    throw new Error("Invalid --type test hint");
  }

  if (scenario === "api_message_error") {
    return {
      ok: false,
      status: 400,
      json: async () => ({ message: "Missing payment type." }),
    };
  }

  return {
    ok: true,
    status: 200,
    json: async () => ({ paymentId: "123e4567-e89b-12d3-a456-426614174000" }),
  };
};
