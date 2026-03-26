import assert from "node:assert/strict";
import test from "node:test";
import { run as runValidate } from "../scripts/validate.js";
import { expectValidationFailure } from "./helpers/assertions.js";
import { createFixtureProject, withCwd } from "./helpers/fixture-project.js";

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


