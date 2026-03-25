import test from "node:test";
import { validateTags } from "../scripts/lib/tags.js";
import { expectValidationFailure } from "./helpers/assertions.js";

test("validateTags accepts a non-empty kebab-case tag array", () => {
  validateTags(["support", "anti-magic", "battle-control"], "ally.md", "en_us");
});

test("validateTags rejects duplicate tags", async () => {
  await expectValidationFailure(
    () => validateTags(["support", "support"], "ally.md", "en_us"),
    "duplicate tag",
  );
});

test("validateTags rejects non-kebab-case tags", async () => {
  await expectValidationFailure(
    () => validateTags(["Support"], "ally.md", "en_us"),
    "tag must be kebab-case",
  );
});

test("validateTags rejects empty tag arrays", async () => {
  await expectValidationFailure(
    () => validateTags([], "ally.md", "en_us"),
    "tags must not be empty",
  );
});
