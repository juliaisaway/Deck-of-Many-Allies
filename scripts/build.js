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

const ancestriesDict = loadDictionary("data/ancestries/pt_br");
const communitiesDict = loadDictionary("data/communities/pt_br");
const rolesDict = loadDictionary("data/roles/pt_br");

// ===== RENDERERS =====

function renderSection(title, items) {
  const content = items.map((item) => {
    const header = item.title ? `### ${item.title}\n\n` : "";
    const body = shiftHeadings(item.content, 1);
    return `${header}${body}`;
  });

  return `## ${title}\n\n${content.join("\n\n---\n\n")}`;
}

function renderAllies(allies) {
  const content = allies.map((a) => {
    const bodyWithoutTitle = a.content.replace(/^# .*\n?/, "").trim();

    const body = shiftHeadings(bodyWithoutTitle, 2);

    const name = `### ${a.name}`;
    const ancestry = ancestriesDict[a.ancestry] || a.ancestry;
    const community = communitiesDict[a.community] || a.community;
    const role = rolesDict[a.role] || a.role;

    const meta = `#### ${ancestry} - ${community} - ${role}`;

    return `${name}\n\n${meta}\n\n${body}`;
  });

  return `## Aliados\n\n${content.join("\n\n---\n\n")}`;
}

// ===== LOAD DATA =====

const basicRules = loadFiles("data/rules/pt_br/basic-rules").sort(sortByOrder);
const optionalRules = loadFiles("data/rules/pt_br/optional-rules").sort(
  sortByOrder,
);
const keywords = loadFiles("data/rules/pt_br/keywords").sort(sortByTitle);
const allies = loadFiles("data/allies/pt_br").sort((a, b) =>
  a.name.localeCompare(b.name),
);

// ===== BUILD CONTENT =====

// FULL BUILD
const fullBuild = `# Deck of Many Allies (PT-BR)

${renderSection("Regras Básicas", basicRules)}

---

${renderSection("Regras Opcionais", optionalRules)}

---

${renderSection("Keywords", keywords)}

---

${renderAllies(allies)}
`;

// RULES ONLY
const rulesBuild = `# Deck of Many Allies — Regras (PT-BR)

${renderSection("Regras Básicas", basicRules)}

---

${renderSection("Regras Opcionais", optionalRules)}

---

${renderSection("Keywords", keywords)}
`;

// ALLIES ONLY
const alliesBuild = `# Deck of Many Allies — Aliados (PT-BR)

${renderAllies(allies)}
`;

// ===== WRITE =====

fs.mkdirSync("dist", { recursive: true });
fs.mkdirSync("dist/pt-br", { recursive: true });

fs.writeFileSync("dist/pt-br/deck-of-many-allies-complete.md", fullBuild);
fs.writeFileSync("dist/pt-br/rules.md", rulesBuild);
fs.writeFileSync("dist/pt-br/allies.md", alliesBuild);

console.log("✅ Builds gerados com sucesso!");
