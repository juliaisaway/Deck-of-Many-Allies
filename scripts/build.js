import fs from "fs";
import path from "path";
import matter from "gray-matter";

// ===== LOAD FILES =====

function loadFiles(dir) {
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

function loadDictionary(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Missing dictionary folder: ${dir}`);
    return {};
  }

  const files = fs.readdirSync(dir);
  const dict = {};

  files.forEach((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data } = matter(raw);

    if (!data.id || !data.name) {
      console.warn(`⚠️ Invalid dictionary entry: ${file}`);
      return;
    }

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
    console.warn(`⚠️ ${name} has multiple ${fieldName}, expected single value`);
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

// ===== BUILD FUNCTION =====

function build(locale) {
  const basePath = "data";

  // ===== LOAD DATA =====

  const basicRules = loadFiles(`${basePath}/rules/${locale}/basic-rules`).sort(
    sortByOrder,
  );
  const optionalRules = loadFiles(
    `${basePath}/rules/${locale}/optional-rules`,
  ).sort(sortByOrder);
  const keywords = loadFiles(`${basePath}/rules/${locale}/keywords`).sort(
    sortByTitle,
  );
  const allies = loadFiles(`${basePath}/allies/${locale}`).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // ===== DICTIONARIES =====

  const ancestriesDict = loadDictionary(`${basePath}/ancestries/${locale}`);
  const communitiesDict = loadDictionary(`${basePath}/communities/${locale}`);
  const rolesDict = loadDictionary(`${basePath}/roles/${locale}`);

  // ===== LABELS =====

  const labels = {
    pt_br: {
      lang: "PT-BR",
      basic: "Regras Básicas",
      optional: "Regras Opcionais",
      keywords: "Keywords",
      allies: "Aliados",
      rulesTitle: "Regras",
    },
    en_us: {
      lang: "EN-US",
      basic: "Basic Rules",
      optional: "Optional Rules",
      keywords: "Keywords",
      allies: "Allies",
      rulesTitle: "Rules",
    },
  };

  const t = labels[locale];

  // ===== RENDER ALLIES =====

  function renderAllies(allies) {
    const content = allies.map((a) => {
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

      // ✨ NOVO FORMATO
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

  const rulesBuild = `# Deck of Many Allies — ${t.rulesTitle} (${t.lang})

${renderSection(t.basic, basicRules)}

---

${renderSection(t.optional, optionalRules)}

---

${renderSection(t.keywords, keywords)}
`;

  const alliesBuild = `# Deck of Many Allies — ${t.allies} (${t.lang})

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

build("pt_br");
build("en_us");

console.log("✅ Builds generated!");
