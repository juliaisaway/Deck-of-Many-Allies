import { assert, assertNonEmptyArray } from "./assert.js";

function isKebabCaseTag(value) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

export function validateTags(tags, itemLabel, locale) {
  assertNonEmptyArray(tags, "tags", itemLabel, locale);

  const seen = new Set();

  tags.forEach((tag) => {
    assert(
      typeof tag === "string",
      `[${locale}] ${itemLabel} tag must be a string: ${JSON.stringify(tag)}`,
    );

    assert(
      isKebabCaseTag(tag),
      `[${locale}] ${itemLabel} tag must be kebab-case: ${tag}`,
    );

    assert(!seen.has(tag), `[${locale}] ${itemLabel} has duplicate tag: ${tag}`);
    seen.add(tag);
  });
}
