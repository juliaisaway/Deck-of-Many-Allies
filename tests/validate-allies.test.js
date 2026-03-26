import test from "node:test";
import { run as runValidate } from "../scripts/validate.js";
import { expectValidationFailure } from "./helpers/assertions.js";
import { createFixtureProject, fs, path, withCwd } from "./helpers/fixture-project.js";

test("validate passes for a minimal valid fixture project", () => {
  const fixtureRoot = createFixtureProject();

  withCwd(fixtureRoot, () => runValidate());
});

test("validate fails when an ally references a missing keyword", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: [missing-keyword]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "unknown keyword: missing-keyword");
});

test("validate fails when ally keywords are missing", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "missing keywords");
});

test("validate fails when ally keywords are empty", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: []
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "keywords must not be empty");
});

test("validate fails when an ally is missing id", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: [track]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "missing id");
});

test("validate fails when an ally is missing ancestry", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
community: wanderborne
role: performer
keywords: [track]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "missing ancestry");
});

test("validate fails when an ally is missing community", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
role: performer
keywords: [track]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "missing community");
});

test("validate fails when an ally is missing role", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
keywords: [track]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "missing role");
});

test("validate fails when an ally community is an array", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: [wanderborne, ridgeborne]
role: performer
keywords: [track]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "community must be single");
});

test("validate fails when ally H1 does not match name", async () => {
  const fixtureRoot = createFixtureProject({ pt_br: { allyName: "Test Ally", allyHeading: "# Different Ally" } });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "title mismatch");
});

test("validate fails when ally keywords are duplicated", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: [track, track]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "duplicate keyword");
});

test("validate fails when ally keywords are not kebab-case", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: [Track]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "keyword must be kebab-case");
});

test("validate fails when ally tags are duplicated", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: [track]
tags: [support, support]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "duplicate tag");
});

test("validate fails when ally tags are not kebab-case", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: [track]
tags: [Support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "tag must be kebab-case");
});

test("validate fails when ally tags are missing", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: [track]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "missing tags");
});

test("validate fails when ally has an unknown frontmatter field", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: [track]
tags: [support, melee]
rarity: common
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "has unknown field: rarity");
});

test("validate fails when ally id is not kebab-case", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: Test-Ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: [track]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "id must be kebab-case");
});

test("validate fails when ally filename does not match id", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: {
      extraAllyFile: `---
id: mismatch-id
name: Mismatch Ally
ancestry: human
community: wanderborne
role: performer
keywords: [track]
tags: [support, melee]
---

# Mismatch Ally

> Filename mismatch for tests.
`,
    },
  });

  fs.rmSync(path.join(fixtureRoot, "data", "allies", "pt_br", "test-ally.md"));

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "filename must match id");
});

test("validate fails when ally ancestry does not exist", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: giantkin
community: wanderborne
role: performer
keywords: [track]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "invalid ancestry: giantkin");
});

test("validate fails when ally community does not exist", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: skyborne
role: performer
keywords: [track]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "invalid community");
});

test("validate fails when ally role does not exist", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: tactician
keywords: [track]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "invalid role: tactician");
});

test("validate ignores underscore-prefixed markdown files in the full validation flow", () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { extraAllyFile: `---
id: invalid-draft
rarity: common
---

# Invalid Draft
` },
  });

  fs.renameSync(path.join(fixtureRoot, "data", "allies", "pt_br", "extra-ally.md"), path.join(fixtureRoot, "data", "allies", "pt_br", "_draft.md"));

  withCwd(fixtureRoot, () => runValidate());
});

