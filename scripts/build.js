import fs from "fs";
import path from "path";
import matter from "gray-matter";

// ===== CONFIG =====

const BASE_LOCALE = "en_us";

// ===== LOCALES (dinâmico) =====

function getLocales() {
  const alliesPath = "data/allies";

  if (!fs.existsSync(alliesPath)) return [];

  return fs.readdirSync(alliesPath).filter((name) => {
    const fullPath = path.join(alliesPath, name);

    return (
      fs.statSync(fullPath).isDirectory() && /^[a-z]{2}(_[a-z]{2})?$/.test(name)
    );
  });
}

// ===== LOAD FILES =====

function loadFiles(dir, fallbackDir = null) {
  if (!fs.existsSync(dir)) {
    if (fallbackDir && fs.existsSync(fallbackDir)) {
      console.warn(`⚠️ Fallback used: ${dir} → ${fallbackDir}`);
      dir = fallbackDir;
    } else {
      return [];
    }
  }

  const files = fs.readdirSync(dir);

  return files.map((file) => {
    const fullPath = path.join(dir, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(raw);

    return {
      ...data,
      content: content.trim(),
    };
  });
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

  const files = fs.readdirSync(dir);
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

function assert(condition, message) {
  if (!condition) {
    console.error("❌ " + message);
    process.exit(1);
  }
}

function assertNonEmptyArray(value, field, name, locale) {
  assert(value, `[${locale}] ${name} missing ${field}`);
  assert(Array.isArray(value), `[${locale}] ${name} ${field} must be an array`);
  assert(value.length > 0, `[${locale}] ${name} ${field} must not be empty`);
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
    lang: "EN-US",
    basic: "Basic Rules",
    optional: "Optional Rules",
    keywords: "Keywords",
    allies: "Allies",
    rulesTitle: "Rules",
  },
  pt_br: {
    lang: "PT-BR",
    basic: "Regras Básicas",
    optional: "Regras Opcionais",
    keywords: "Keywords",
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

  // ===== RENDER ALLIES =====

  function renderAllies(allies) {
    const content = allies.map((a) => {
      assertNonEmptyArray(a.keywords, "keywords", a.name, locale);
      assertNonEmptyArray(a.tags, "tags", a.name, locale);

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

// ===== EXECUTE =====

const locales = getLocales();

locales.forEach((locale) => {
  build(locale);
});

console.log("✅ Builds generated for:", locales.join(", "));
