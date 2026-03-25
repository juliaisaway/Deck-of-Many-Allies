import test from "node:test";
import { validateKeywords } from "../scripts/lib/keywords.js";
import { expectValidationFailure } from "./helpers/assertions.js";

const validKeywordIds = new Set(["track", "prepared", "battle-plan"]);

test("validateKeywords accepts a non-empty keyword array from the locale vocabulary", () => {
  validateKeywords(["track", "battle-plan"], validKeywordIds, "ally.md", "en_us");
});

test("validateKeywords rejects duplicate keywords", async () => {
  await expectValidationFailure(
    () => validateKeywords(["track", "track"], validKeywordIds, "ally.md", "en_us"),
    "duplicate keyword",
  );
});

test("validateKeywords rejects non-kebab-case keywords", async () => {
  await expectValidationFailure(
    () => validateKeywords(["Track"], validKeywordIds, "ally.md", "en_us"),
    "keyword must be kebab-case",
  );
});

test("validateKeywords rejects keywords outside the locale vocabulary", async () => {
  await expectValidationFailure(
    () => validateKeywords(["missing-keyword"], validKeywordIds, "ally.md", "en_us"),
    "unknown keyword",
  );
});

test("validateKeywords rejects empty keyword arrays", async () => {
  await expectValidationFailure(
    () => validateKeywords([], validKeywordIds, "ally.md", "en_us"),
    "keywords must not be empty",
  );
});
