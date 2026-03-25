import assert from "node:assert/strict";

export async function expectValidationFailure(fn, expectedMessage) {
  const originalExit = process.exit;
  const originalError = console.error;
  const messages = [];

  process.exit = ((code) => {
    throw new Error(`process.exit:${code}`);
  });

  console.error = (...args) => {
    messages.push(args.join(" "));
  };

  try {
    assert.throws(() => fn(), /process\.exit:1/);
    assert(
      messages.some((message) => message.includes(expectedMessage)),
      `Expected an error message including "${expectedMessage}", got: ${messages.join("\n")}`,
    );
  } finally {
    process.exit = originalExit;
    console.error = originalError;
  }
}
