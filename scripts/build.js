import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { validateKeywords } from "./lib/keywords.js";
import { getLocales } from "./lib/locales.js";
import { listMarkdownFiles, loadMarkdownFiles } from "./lib/markdown.js";
import { pathToFileURL } from "node:url";
import { validateTags } from "./lib/tags.js";

// ===== CONFIG =====

const BASE_LOCALE = "en_us";

// ===== LOAD FILES =====

function loadFiles(dir, fallbackDir = null) {
  const fileMap = new Map();

  if (fallbackDir && fs.existsSync(fallbackDir)) {
    loadMarkdownFiles(fallbackDir).forEach((file) => {
      fileMap.set(file.file, file);
    });
  }

  if (fs.existsSync(dir)) {
    loadMarkdownFiles(dir).forEach((file) => {
      fileMap.set(file.file, file);
    });
  } else if (fallbackDir && fs.existsSync(fallbackDir)) {
    console.warn(`⚠️ Fallback used: ${dir} → ${fallbackDir}`);
  }

  return Array.from(fileMap.values()).map(({ data, content }) => ({
    ...data,
    content: content.trim(),
  }));
}

// ===== SORT =====

function sortByOrder(a, b) {
  return (a.order || 0) - (b.order || 0);
}

function sortByTitle(a, b) {
  return a.title.localeCompare(b.title);
}

// ===== FIX HEADINGS =====

function shiftHeadings(content, level = 1) {
  return content.replace(/^(#{1,6})\s/gm, (match, hashes) => {
    return "#".repeat(hashes.length + level) + " ";
  });
}

// ===== LOAD DICTIONARY =====

function loadDictionary(dir, fallbackDir = null) {
  if (!fs.existsSync(dir)) {
    if (fallbackDir && fs.existsSync(fallbackDir)) {
      console.warn(`⚠️ Fallback dict: ${dir} → ${fallbackDir}`);
      dir = fallbackDir;
    } else {
      return {};
    }
  }

  const files = listMarkdownFiles(dir);
  const dict = {};

  files.forEach((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data } = matter(raw);

    if (!data.id || !data.name) return;

    dict[data.id] = data.name;
  });

  return dict;
}

// ===== HELPERS =====

function resolveList(value, dict) {
  if (Array.isArray(value)) {
    return value.map((v) => dict[v] || v).join(" / ");
  }
  return dict[value] || value;
}

function resolveSingle(value, dict, fieldName, name) {
  if (Array.isArray(value)) {
    console.warn(`⚠️ ${name} has multiple ${fieldName}`);
    return value.map((v) => dict[v] || v).join(" / ");
  }
  return dict[value] || value;
}

// ===== RENDERERS =====

function renderSection(title, items) {
  const content = items.map((item) => {
    const header = item.title ? `### ${item.title}\n\n` : "";
    const body = shiftHeadings(item.content, 1);
    return `${header}${body}`;
  });

  return `## ${title}\n\n${content.join("\n\n---\n\n")}`;
}

// ===== LABELS =====

const LABELS = {
  en_us: {
    lang: "en-us",
    basic: "Basic Rules",
    optional: "Optional Rules",
    keywords: "Keywords",
    allies: "Allies",
    rulesTitle: "Rules",
  },
  pt_br: {
    lang: "pt-br",
    basic: "Regras Básicas",
    optional: "Regras Opcionais",
    keywords: "Palavras-chave",
    allies: "Aliados",
    rulesTitle: "Regras",
  },
};

// ===== BUILD =====

function build(locale) {
  const basePath = "data";

  const fallback = BASE_LOCALE;

  // ===== LOAD DATA COM FALLBACK =====

  const basicRules = loadFiles(
    `${basePath}/rules/${locale}/basic-rules`,
    `${basePath}/rules/${fallback}/basic-rules`,
  ).sort(sortByOrder);

  const optionalRules = loadFiles(
    `${basePath}/rules/${locale}/optional-rules`,
    `${basePath}/rules/${fallback}/optional-rules`,
  ).sort(sortByOrder);

  const keywords = loadFiles(
    `${basePath}/rules/${locale}/keywords`,
    `${basePath}/rules/${fallback}/keywords`,
  ).sort(sortByTitle);

  const allies = loadFiles(
    `${basePath}/allies/${locale}`,
    `${basePath}/allies/${fallback}`,
  ).sort((a, b) => a.name.localeCompare(b.name));

  // ===== DICTS =====

  const ancestriesDict = loadDictionary(
    `${basePath}/ancestries/${locale}`,
    `${basePath}/ancestries/${fallback}`,
  );

  const communitiesDict = loadDictionary(
    `${basePath}/communities/${locale}`,
    `${basePath}/communities/${fallback}`,
  );

  const rolesDict = loadDictionary(
    `${basePath}/roles/${locale}`,
    `${basePath}/roles/${fallback}`,
  );

  const t = LABELS[locale] || LABELS[fallback];
  const keywordIds = new Set(keywords.map((keyword) => keyword.id));

  // ===== RENDER ALLIES =====

  function renderAllies(allies) {
    const content = allies.map((a) => {
      validateKeywords(a.keywords, keywordIds, a.name, locale);
      validateTags(a.tags, a.name, locale);

      const bodyWithoutTitle = a.content.replace(/^# .*\n?/, "").trim();
      const body = shiftHeadings(bodyWithoutTitle, 2);

      const name = `### ${a.name}`;

      const ancestry = resolveList(a.ancestry, ancestriesDict);
      const role = resolveList(a.role, rolesDict);
      const community = resolveSingle(
        a.community,
        communitiesDict,
        "community",
        a.name,
      );

      const meta = `#### ${ancestry} • ${community} • ${role}`;

      return `${name}\n\n${meta}\n\n${body}`;
    });

    return `## ${t.allies}\n\n${content.join("\n\n---\n\n")}`;
  }

  // ===== BUILD CONTENT =====

  const fullBuild = `# Deck of Many Allies (${t.lang})

${renderSection(t.basic, basicRules)}

---

${renderSection(t.optional, optionalRules)}

---

${renderSection(t.keywords, keywords)}

---

${renderAllies(allies)}
`;

  const rulesBuild = `# Deck of Many Allies - ${t.rulesTitle} (${t.lang})

${renderSection(t.basic, basicRules)}

---

${renderSection(t.optional, optionalRules)}

---

${renderSection(t.keywords, keywords)}
`;

  const alliesBuild = `# Deck of Many Allies - ${t.allies} (${t.lang})

${renderAllies(allies)}
`;

  // ===== WRITE =====

  const outputDir = `dist/${locale.replace("_", "-")}`;

  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(`${outputDir}/deck-of-many-allies-complete.md`, fullBuild);
  fs.writeFileSync(`${outputDir}/rules.md`, rulesBuild);
  fs.writeFileSync(`${outputDir}/allies.md`, alliesBuild);
}

function buildIndex(locales) {
  const entries = locales.map((locale) => {
    const t = LABELS[locale] || LABELS[BASE_LOCALE];
    const outputDir = `./${locale.replace("_", "-")}`;

    return `## ${t.lang}

- Start here: [${outputDir}/deck-of-many-allies-complete.md](${outputDir}/deck-of-many-allies-complete.md)
- Rules only: [${outputDir}/rules.md](${outputDir}/rules.md)
- Allies only: [${outputDir}/allies.md](${outputDir}/allies.md)

Use the complete document when you want the full rules reference in one file.
Use the split files when you want to separate the GM rules reference from ally handouts you may choose to share with players.`;
  });

  const index = `# 🃏 Deck of Many Allies

This folder contains the compiled Markdown delivery for each supported language.
It is designed primarily as a powerful GM-facing tool to support encounter prep, improvisation, and scene play at the table, rather than as a player-facing rules handout.

## Suggested use

1. Open the language you want.
2. Start with the complete document if you want the full material in one file.
3. Use the split files when you want to share only rules or only allies.

## Files

- \`deck-of-many-allies-complete.md\`: full reference with rules, keywords, and allies.
- \`rules.md\`: basic rules, optional rules, and keyword glossary.
- \`allies.md\`: ally entries only, ready to share at the table.
- \`stats.md\`: project stats and localization coverage report.

---

${entries.join("\n\n")}
`;

  fs.writeFileSync("dist/index.md", index);
}

// ===== EXECUTE =====

export function run() {
  const locales = getLocales();

  locales.forEach((locale) => {
    build(locale);
  });

  buildIndex(locales);

  console.log("✅ Builds generated for:", locales.join(", "));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run();
}
