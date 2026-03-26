import assert from "node:assert/strict";
import path from "path";
import test from "node:test";
import { listMarkdownFiles, loadMarkdownFiles } from "../scripts/lib/markdown.js";
import { createTempDir, writeFile } from "./helpers/temp-dir.js";

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

