import assert from "node:assert/strict";
import test from "node:test";
import { run as runBuild } from "../scripts/build.js";
import { createFixtureProject, fs, path, withCwd } from "./helpers/fixture-project.js";

test("build generates compiled markdown files in dist", () => {
  const fixtureRoot = createFixtureProject();

  withCwd(fixtureRoot, () => runBuild());

  assert.equal(fs.existsSync(path.join(fixtureRoot, "dist", "en-us", "allies.md")), true);
  assert.equal(fs.existsSync(path.join(fixtureRoot, "dist", "pt-br", "rules.md")), true);

  const alliesOutput = fs.readFileSync(path.join(fixtureRoot, "dist", "en-us", "allies.md"), "utf-8");
  assert.match(alliesOutput, /Test Ally/);
});

test("build falls back to base locale content when a localized keyword file is missing", () => {
  const fixtureRoot = createFixtureProject();
  fs.rmSync(path.join(fixtureRoot, "data", "rules", "pt_br", "keywords", "track.md"));

  withCwd(fixtureRoot, () => runBuild());

  const rulesOutput = fs.readFileSync(path.join(fixtureRoot, "dist", "pt-br", "rules.md"), "utf-8");
  assert.match(rulesOutput, /Track is used here as a minimal integration-test keyword/);
});


test("build ignores underscore-prefixed markdown files in the full build flow", () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { extraAllyFile: `---
id: invalid-draft
rarity: common
---

# Invalid Draft
` },
  });

  fs.renameSync(path.join(fixtureRoot, "data", "allies", "pt_br", "extra-ally.md"), path.join(fixtureRoot, "data", "allies", "pt_br", "_draft.md"));

  withCwd(fixtureRoot, () => runBuild());

  const alliesOutput = fs.readFileSync(path.join(fixtureRoot, "dist", "pt-br", "allies.md"), "utf-8");
  assert.doesNotMatch(alliesOutput, /Invalid Draft/);
});

