import fs from "fs";
import { validateKeywords } from "./lib/keywords.js";
import { getLocales } from "./lib/locales.js";
import { loadMarkdownFiles } from "./lib/markdown.js";
import { pathToFileURL } from "node:url";
import { validateTags } from "./lib/tags.js";

// ===== CONFIG =====

const BASE_LOCALE = "en_us";
const BASE_PATH = "data";

// ===== HELPERS =====

function loadFiles(dir) {
  return loadMarkdownFiles(dir).map(({ file, data }) => ({ file, data }));
}

function countMap() {
  return new Map();
}

function addToMap(map, value) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((v) => addToMap(map, v));
    return;
  }

  map.set(value, (map.get(value) || 0) + 1);
}

function mapToSortedArray(map) {
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

// ===== SOURCE HELPERS =====

function loadSourceMap(dir) {
  const items = loadFiles(dir);
  const map = {};

  items.forEach(({ data }) => {
    map[data.id] = {
      source: data.source || "unknown",
      name: data.name || data.id,
    };
  });

  return map;
}

function countUsageBySource(allies, lookup, field) {
  const result = {};

  allies.forEach(({ data }) => {
    const raw = data[field];
    if (!raw) return;

    const values = Array.isArray(raw) ? raw : [raw];

    values.forEach((v) => {
      const entry = lookup[v];
      if (!entry) return;

      const { source, name } = entry;

      if (!result[source]) {
        result[source] = new Map();
      }

      const map = result[source];
      map.set(name, (map.get(name) || 0) + 1);
    });
  });

  return result;
}

// ===== RENDER =====

function renderSourceMap(title, sourceMap) {
  let out = `## ${title}\n\n`;

  Object.entries(sourceMap).forEach(([source, map]) => {
    const uniqueCount = map.size;
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);

    out += `${source}\n\n`;
    out += `> - Unique entries from this source: **${uniqueCount}**\n`;
    out += `> - Total ally references to this source: **${total}**\n\n`;

    const sorted = mapToSortedArray(map);

    sorted.forEach(([key, count]) => {
      out += `- ${key}: ${count}\n`;
    });

    out += `- Total: **(${total})**\n\n`;
  });

  out += "---\n\n";

  return out;
}

function renderMap(title, map) {
  const arr = mapToSortedArray(map);
  const total = arr.reduce((sum, [, count]) => sum + count, 0);

  let out = `## ${title}\n\n`;

  arr.forEach(([key, count]) => {
    out += `- ${key}: ${count}\n`;
  });

  out += `- Total: **(${total})**\n\n`;

  out += "---\n\n";

  return out;
}

// ===== STATS =====

function generateStats(locale) {
  const allies = loadFiles(`${BASE_PATH}/allies/${locale}`);
  const keywords = loadFiles(`${BASE_PATH}/rules/${locale}/keywords`);
  const keywordIds = new Set(keywords.map(({ data }) => data.id));

  const ancestryLookup = loadSourceMap(`${BASE_PATH}/ancestries/${locale}`);
  const communityLookup = loadSourceMap(`${BASE_PATH}/communities/${locale}`);
  const roleLookup = loadSourceMap(`${BASE_PATH}/roles/${locale}`);

  const stats = {
    total: allies.length,
    ancestry: countMap(),
    community: countMap(),
    role: countMap(),
    keywords: countMap(),
    tags: countMap(),
    ids: new Set(),

    ancestrySources: countUsageBySource(allies, ancestryLookup, "ancestry"),
    communitySources: countUsageBySource(allies, communityLookup, "community"),
  };

  allies.forEach(({ data }) => {
    validateKeywords(
      data.keywords,
      keywordIds,
      data.id || "unknown ally",
      locale,
    );
    validateTags(data.tags, data.id || "unknown ally", locale);

    stats.ids.add(data.id);

    addToMap(stats.ancestry, data.ancestry);
    addToMap(stats.community, data.community);
    addToMap(stats.role, data.role);

    data.keywords.forEach((k) => addToMap(stats.keywords, k));
    data.tags.forEach((t) => addToMap(stats.tags, t));
  });

  return stats;
}

// ===== I18N =====

function generateI18nReport(results) {
  const base = results[BASE_LOCALE];
  let output = "";

  Object.entries(results).forEach(([locale, data]) => {
    if (locale === BASE_LOCALE) return;

    const missing = [];
    const extra = [];

    base.ids.forEach((id) => {
      if (!data.ids.has(id)) missing.push(id);
    });

    data.ids.forEach((id) => {
      if (!base.ids.has(id)) extra.push(id);
    });

    if (missing.length || extra.length) {
      output += `### ${locale}\n\n`;

      if (missing.length) {
        output += `#### Missing (${missing.length})\n`;
        missing.forEach((id) => (output += `- ${id}\n`));
        output += "\n";
      }

      if (extra.length) {
        output += `#### Extra (${extra.length})\n`;
        extra.forEach((id) => (output += `- ${id}\n`));
        output += "\n";
      }
    }
  });

  return output || "No i18n issues found ✅";
}

// ===== MARKDOWN =====

function generateMarkdown(results) {
  const base = results[BASE_LOCALE];

  let md = `# 📊 Stats for The Deck of Many Allies\n\n`;
  md += `- Total Allies: **${base.total}**\n\n`;
  md += `## How to read this report\n\n`;
  md += `- "Total Allies" counts unique ally entries in the base locale (\`${BASE_LOCALE}\`).\n`;
  md += `- Source sections show both how many unique ancestry/community entries come from a source and how many times allies reference them.\n`;
  md += `- Roles, Keywords, and Tags count assignments, not unique allies. Their totals can be higher than the ally count because one ally can have multiple roles or tags.\n\n`;
  md += `---\n\n`;

  md += renderSourceMap("🧝 Ancestries by Source", base.ancestrySources);
  md += renderSourceMap("🏠 Communities by Source", base.communitySources);

  md += renderMap("🧙 Roles", base.role);
  md += renderMap("🔍 Keywords", base.keywords);
  md += renderMap("🏷️ Tags", base.tags);

  md += `## ⚠️ i18n Report\n\n`;
  md += generateI18nReport(results);

  return md;
}

// ===== RUN =====

export function run() {
  const locales = getLocales();
  const results = {};

  locales.forEach((locale) => {
    results[locale] = generateStats(locale);
  });

  const md = generateMarkdown(results);

  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/stats.md", md.trimEnd() + "\n");

  console.log("📊 Stats generated at dist/stats.md");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run();
}
