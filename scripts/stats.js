import fs from "fs";
import path from "path";
import matter from "gray-matter";

// ===== CONFIG =====

const BASE_LOCALE = "en_us";
const BASE_PATH = "data";

// ===== HELPERS =====

function loadFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data } = matter(raw);
      return { file, data };
    });
}

function getLocales() {
  const dir = `${BASE_PATH}/allies`;

  return fs.readdirSync(dir).filter((name) => {
    const full = path.join(dir, name);
    return fs.statSync(full).isDirectory() && /^[a-z]{2}_[a-z]{2}$/.test(name);
  });
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

    out += `### ${source} (${uniqueCount})\n\n`;

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
    stats.ids.add(data.id);

    addToMap(stats.ancestry, data.ancestry);
    addToMap(stats.community, data.community);
    addToMap(stats.role, data.role);

    (data.keywords || []).forEach((k) => addToMap(stats.keywords, k));
    (data.tags || []).forEach((t) => addToMap(stats.tags, t));
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

  md += renderSourceMap(
    "🧝 Ancestries by Source",
    base.ancestrySources,
    BASE_LOCALE,
  );
  md += renderSourceMap(
    "🏠 Communities by Source",
    base.communitySources,
    BASE_LOCALE,
  );

  md += renderMap("🧙 Roles", base.role, BASE_LOCALE);
  md += renderMap("🔍 Keywords", base.keywords, BASE_LOCALE);
  md += renderMap("🏷️ Tags", base.tags, BASE_LOCALE);

  md += `## ⚠️ i18n Report\n\n`;
  md += generateI18nReport(results);

  return md;
}

// ===== RUN =====

function run() {
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

run();
