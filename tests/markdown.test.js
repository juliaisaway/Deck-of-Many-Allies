import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import test from "node:test";
import { run as runBuild } from "../scripts/build.js";
import { run as runClean } from "../scripts/clean.js";
import { listMarkdownFiles, loadMarkdownFiles } from "../scripts/lib/markdown.js";
import { run as runStats } from "../scripts/stats.js";
import { run as runValidate } from "../scripts/validate.js";
import { expectValidationFailure } from "./helpers/assertions.js";
import { createTempDir, writeFile } from "./helpers/temp-dir.js";

function writeLocaleFixture(root, locale, options = {}) {
  const allyFrontmatter = options.allyFrontmatter || `---
id: test-ally
name: ${options.allyName || "Test Ally"}
ancestry: ${options.allyAncestry || "human"}
community: ${options.allyCommunity || "wanderborne"}
role: ${options.allyRole || "performer"}
keywords: ${options.allyKeywords || "[track]"}
tags: ${options.allyTags || "[support, melee]"}
---`;
  const allyHeading = options.allyHeading || `# ${options.allyName || "Test Ally"}`;

  const keywordFiles = options.keywordFiles || {
    "track.md": `---
id: track
title: Track
type: trigger
---

> Whenever an ally deals damage to an adversary, place 1 token on this card.

Track is used here as a minimal integration-test keyword.
`,
    "aim.md": `---
id: aim
title: Aim
type: passive
---

> A secondary keyword used to test i18n mismatches.

Aim is used here only for validation tests.
`,
  };

  const roleFiles = options.roleFiles || {
    "performer.md": `---
id: performer
name: Performer
---
`,
    "scholar.md": `---
id: scholar
name: Scholar
---
`,
  };

  const ancestryFiles = options.ancestryFiles || {
    "human.md": `---
id: human
name: Human
source: daggerheart-srd
---

# Human

**Adaptable:** A minimal ancestry entry for tests.
`,
    "elf.md": `---
id: elf
name: Elf
source: daggerheart-srd
---

# Elf

**Graceful:** A minimal ancestry entry for tests.
`,
  };

  const communityFiles = options.communityFiles || {
    "wanderborne.md": `---
id: wanderborne
name: Wanderborne
source: daggerheart-srd
---

# Wanderborne

**Nomadic Pack:** A minimal community entry for tests.
`,
    "ridgeborne.md": `---
id: ridgeborne
name: Ridgeborne
source: daggerheart-srd
---

# Ridgeborne

**Stonewise:** A minimal community entry for tests.
`,
  };

  writeFile(
    path.join(root, "data", "allies", locale, "test-ally.md"),
    `${allyFrontmatter}

${allyHeading}

> A compact ally used for automated tests.

**Track:** Whenever an ally deals damage to an adversary, place 1 token on this card.

**Test Ability:** Spend 1 token to deal 1d6 physical damage to a target within Melee range.
`,
  );

  if (options.extraAllyFile) {
    writeFile(path.join(root, "data", "allies", locale, "extra-ally.md"), options.extraAllyFile);
  }

  Object.entries(keywordFiles).forEach(([fileName, content]) => {
    writeFile(path.join(root, "data", "rules", locale, "keywords", fileName), content);
  });

  Object.entries(roleFiles).forEach(([fileName, content]) => {
    writeFile(path.join(root, "data", "roles", locale, fileName), content);
  });

  Object.entries(ancestryFiles).forEach(([fileName, content]) => {
    writeFile(path.join(root, "data", "ancestries", locale, fileName), content);
  });

  Object.entries(communityFiles).forEach(([fileName, content]) => {
    writeFile(path.join(root, "data", "communities", locale, fileName), content);
  });

  writeFile(
    path.join(root, "data", "rules", locale, "basic-rules", "00-intro.md"),
    `---
order: 0
title: Intro
---

Basic rules intro for ${locale}.
`,
  );

  writeFile(
    path.join(root, "data", "rules", locale, "optional-rules", "00-optional.md"),
    `---
order: 0
title: Optional
---

Optional rules intro for ${locale}.
`,
  );
}

function createFixtureProject(options = {}) {
  const root = createTempDir("deck-of-many-allies-integration-");

  writeLocaleFixture(root, "en_us", options.en_us);
  writeLocaleFixture(root, "pt_br", options.pt_br);

  return root;
}

function withCwd(nextCwd, fn) {
  const previousCwd = process.cwd();
  process.chdir(nextCwd);

  try {
    return fn();
  } finally {
    process.chdir(previousCwd);
  }
}

test("listMarkdownFiles only includes markdown files that do not start with underscore", () => {
  const root = createTempDir("markdown-list-");

  writeFile(path.join(root, "ally.md"), "# Ally\n");
  writeFile(path.join(root, "_partial.md"), "# Partial\n");
  writeFile(path.join(root, "notes.txt"), "ignore");

  assert.deepEqual(listMarkdownFiles(root), ["ally.md"]);
});

test("loadMarkdownFiles parses frontmatter and body content", () => {
  const root = createTempDir("markdown-load-");

  writeFile(
    path.join(root, "track.md"),
    `---
id: track
title: Track
---

> Rules text.

Flavor text.
`,
  );

  const [file] = loadMarkdownFiles(root);

  assert.equal(file.file, "track.md");
  assert.equal(file.data.id, "track");
  assert.equal(file.data.title, "Track");
  assert.match(file.content, /Rules text/);
  assert.match(file.content, /Flavor text/);
});

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

test("validate fails when a keyword uses an invalid type", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { keywordFiles: { "track.md": `---
id: track
title: Track
type: resource
---

> Invalid keyword type for tests.
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "invalid keyword type: resource");
});

test("validate fails when a keyword requires a parameter but none is provided", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { keywordFiles: { "track.md": `---
id: track
title: Track
type: scaling
has_parameter: true
---

> Missing parameter for tests.
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "missing parameter");
});

test("validate fails when a keyword provides a parameter without enabling has_parameter", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { keywordFiles: { "track.md": `---
id: track
title: Track
type: scaling
parameter: X
---

> Unexpected parameter for tests.
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "should not have parameter");
});

test("validate fails when a keyword filename does not match its id", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { keywordFiles: { "wrong-name.md": `---
id: track
title: Track
type: trigger
---

> Filename mismatch for tests.
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "filename must match id");
});

test("validate fails when keyword title is missing", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { keywordFiles: { "track.md": `---
id: track
type: trigger
---

> Missing title for tests.
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "missing keyword title");
});

test("validate fails when keyword id is not kebab-case", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { keywordFiles: { "track.md": `---
id: Track
title: Track
type: trigger
---

> Invalid keyword id casing for tests.
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "id must be kebab-case");
});

test("validate fails when keyword has an unknown field", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { keywordFiles: { "track.md": `---
id: track
title: Track
type: trigger
rarity: common
---

> Unknown keyword field for tests.
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "has unknown field: rarity");
});

test("validate warns when an ally is missing in a non-base locale", () => {
  const fixtureRoot = createFixtureProject();
  fs.rmSync(path.join(fixtureRoot, "data", "allies", "pt_br", "test-ally.md"));

  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));

  try {
    withCwd(fixtureRoot, () => runValidate());
  } finally {
    console.warn = originalWarn;
  }

  assert(warnings.some((message) => message.includes("Missing ally in pt_br: test-ally")));
});

test("validate warns when a keyword is missing in a non-base locale", () => {
  const fixtureRoot = createFixtureProject();
  fs.rmSync(path.join(fixtureRoot, "data", "rules", "pt_br", "keywords", "aim.md"));

  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));

  try {
    withCwd(fixtureRoot, () => runValidate());
  } finally {
    console.warn = originalWarn;
  }

  assert(warnings.some((message) => message.includes("Missing keyword in pt_br: aim")));
});

test("validate fails when an extra ally exists in a non-base locale", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { extraAllyFile: `---
id: extra-ally
name: Extra Ally
ancestry: human
community: wanderborne
role: performer
keywords: [track]
tags: [support, melee]
---

# Extra Ally

> Extra ally for i18n tests.

**Track:** Whenever an ally deals damage to an adversary, place 1 token on this card.
` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "Extra ally in pt_br: extra-ally");
});

test("validate fails when an extra keyword exists in a non-base locale", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: {
      keywordFiles: {
        "track.md": `---
id: track
title: Track
type: trigger
---

> Base keyword for tests.
`,
        "aim.md": `---
id: aim
title: Aim
type: passive
---

> Shared keyword for tests.
`,
        "extra-keyword.md": `---
id: extra-keyword
title: Extra Keyword
type: passive
---

> Extra keyword for i18n tests.
`,
      },
    },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "Extra keyword in pt_br: extra-keyword");
});

test("validate fails when i18n ancestry differs between locales", async () => {
  const fixtureRoot = createFixtureProject({ pt_br: { allyAncestry: "elf" } });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), 'Structural mismatch in pt_br for ally "test-ally" field "ancestry"');
});

test("validate fails when i18n community differs between locales", async () => {
  const fixtureRoot = createFixtureProject({ pt_br: { allyCommunity: "ridgeborne" } });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), 'Structural mismatch in pt_br for ally "test-ally" field "community"');
});

test("validate fails when i18n role differs between locales", async () => {
  const fixtureRoot = createFixtureProject({ pt_br: { allyRole: "scholar" } });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), 'Structural mismatch in pt_br for ally "test-ally" field "role"');
});

test("validate fails when i18n keywords differ between locales", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: [track, aim]
tags: [support, melee]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), 'Keyword mismatch in pt_br for ally "test-ally"');
});

test("validate fails when i18n tags differ between locales", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { allyFrontmatter: `---
id: test-ally
name: Test Ally
ancestry: human
community: wanderborne
role: performer
keywords: [track]
tags: [support, ranged]
---` },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), 'Tags mismatch in pt_br for ally "test-ally"');
});

test("validate fails when an ancestry has an invalid source", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { ancestryFiles: { "human.md": `---
id: human
name: Human
source: homebrew
---

# Human

**Adaptable:** Invalid source for tests.
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "invalid source: homebrew");
});

test("validate fails when a community is missing source", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { communityFiles: { "wanderborne.md": `---
id: wanderborne
name: Wanderborne
---

# Wanderborne

**Nomadic Pack:** Missing source for tests.
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "missing source");
});

test("validate fails when a role id is not kebab-case", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { roleFiles: { "performer.md": `---
id: Performer
name: Performer
---
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "id must be kebab-case");
});

test("validate fails when an ancestry filename does not match id", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { ancestryFiles: { "wrong-name.md": `---
id: human
name: Human
source: daggerheart-srd
---

# Human

**Adaptable:** Filename mismatch for tests.
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "filename must match id");
});

test("validate fails when a community has an unknown field", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { communityFiles: { "wanderborne.md": `---
id: wanderborne
name: Wanderborne
source: daggerheart-srd
rarity: common
---

# Wanderborne

**Nomadic Pack:** Unknown field for tests.
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "has unknown field: rarity");
});

test("validate fails when a role is missing name", async () => {
  const fixtureRoot = createFixtureProject({
    pt_br: { roleFiles: { "performer.md": `---
id: performer
---
` } },
  });

  await expectValidationFailure(() => withCwd(fixtureRoot, () => runValidate()), "missing name");
});

test("validate warns when content uses The Void sources without failing", () => {
  const fixtureRoot = createFixtureProject({
    pt_br: {
      ancestryFiles: {
        "human.md": `---
id: human
name: Human
source: the-void-playtest
---

# Human

**Voidbound:** A minimal The Void ancestry entry for tests.
`,
      },
    },
  });

  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));

  try {
    withCwd(fixtureRoot, () => runValidate());
  } finally {
    console.warn = originalWarn;
  }

  assert(warnings.some((message) => message.includes('Materials from "The Void" are playtest-only')));
  assert(warnings.some((message) => message.includes('uses The Void content')));
});

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
