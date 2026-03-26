import fs from "fs";
import path from "path";
import { createTempDir, writeFile } from "./temp-dir.js";

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

export function createFixtureProject(options = {}) {
  const root = createTempDir("deck-of-many-allies-integration-");

  writeLocaleFixture(root, "en_us", options.en_us);
  writeLocaleFixture(root, "pt_br", options.pt_br);

  return root;
}

export function withCwd(nextCwd, fn) {
  const previousCwd = process.cwd();
  process.chdir(nextCwd);

  try {
    return fn();
  } finally {
    process.chdir(previousCwd);
  }
}

export { fs, path };
