export function assert(condition, message) {
  if (!condition) {
    console.error("❌ " + message);
    process.exit(1);
  }
}

export function assertNonEmptyArray(value, field, file, locale) {
  assert(value, `[${locale}] ${file} missing ${field}`);
  assert(Array.isArray(value), `[${locale}] ${file} ${field} must be an array`);
  assert(value.length > 0, `[${locale}] ${file} ${field} must not be empty`);
}
