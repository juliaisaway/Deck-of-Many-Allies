import { assert, assertNonEmptyArray } from "./assert.js";

function isKebabCaseKeyword(value) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

export function validateKeywords(keywords, validKeywordIds, itemLabel, locale) {
  assertNonEmptyArray(keywords, "keywords", itemLabel, locale);

  const seen = new Set();

  keywords.forEach((keyword) => {
    assert(
      typeof keyword === "string",
      `[${locale}] ${itemLabel} keyword must be a string: ${JSON.stringify(keyword)}`,
    );

    assert(
      isKebabCaseKeyword(keyword),
      `[${locale}] ${itemLabel} keyword must be kebab-case: ${keyword}`,
    );

    assert(
      !seen.has(keyword),
      `[${locale}] ${itemLabel} has duplicate keyword: ${keyword}`,
    );
    seen.add(keyword);

    if (validKeywordIds) {
      assert(
        validKeywordIds.has(keyword),
        `[${locale}] ${itemLabel} unknown keyword: ${keyword}`,
      );
    }
  });
}
