import assert from "node:assert/strict";
import test from "node:test";
import { run as runBuild } from "../scripts/build.js";
import { run as runClean } from "../scripts/clean.js";
import { run as runStats } from "../scripts/stats.js";
import { createFixtureProject, fs, path, withCwd } from "./helpers/fixture-project.js";

test("stats generates a report with total allies", () => {
  const fixtureRoot = createFixtureProject();

  withCwd(fixtureRoot, () => runStats());

  const statsOutput = fs.readFileSync(path.join(fixtureRoot, "dist", "stats.md"), "utf-8");
  assert.match(statsOutput, /Total Allies: \*\*1\*\*/);
  assert.match(statsOutput, /No i18n issues found/);
});

test("clean removes dist output", () => {
  const fixtureRoot = createFixtureProject();

  withCwd(fixtureRoot, () => runBuild());
  assert.equal(fs.existsSync(path.join(fixtureRoot, "dist")), true);

  withCwd(fixtureRoot, () => runClean());
  assert.equal(fs.existsSync(path.join(fixtureRoot, "dist")), false);
});

test("clean succeeds even when dist does not exist", () => {
  const fixtureRoot = createFixtureProject();

  withCwd(fixtureRoot, () => runClean());
  assert.equal(fs.existsSync(path.join(fixtureRoot, "dist")), false);
});

