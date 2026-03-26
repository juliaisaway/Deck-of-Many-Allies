import assert from "node:assert/strict";
import test from "node:test";
import { run as runValidate } from "../scripts/validate.js";
import { expectValidationFailure } from "./helpers/assertions.js";
import { createFixtureProject, fs, path, withCwd } from "./helpers/fixture-project.js";

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

