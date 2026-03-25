import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import test from "node:test";
import { getLocales } from "../scripts/lib/locales.js";
import { createTempDir } from "./helpers/temp-dir.js";

test("getLocales returns only locale-shaped directories", () => {
  const root = createTempDir("locales-");
  const alliesDir = path.join(root, "data", "allies");

  fs.mkdirSync(path.join(alliesDir, "en_us"), { recursive: true });
  fs.mkdirSync(path.join(alliesDir, "pt_br"), { recursive: true });
  fs.mkdirSync(path.join(alliesDir, "en"), { recursive: true });
  fs.mkdirSync(path.join(alliesDir, "_draft"), { recursive: true });
  fs.writeFileSync(path.join(alliesDir, "notes.txt"), "ignore me");

  assert.deepEqual(getLocales(alliesDir), ["en_us", "pt_br"]);
});

test("getLocales returns an empty list when the base directory is missing", () => {
  const root = createTempDir("locales-missing-");
  const missingDir = path.join(root, "does-not-exist");

  assert.deepEqual(getLocales(missingDir), []);
});
