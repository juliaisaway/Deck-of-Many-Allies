import fs from "fs";
import path from "path";
import matter from "gray-matter";

// ===== LOAD FILES =====

function loadFiles(dir) {
  return fs.readdirSync(dir).map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data } = matter(raw);
    return { file, data };
  });
}

// ===== LOAD IDS FROM DICTIONARY =====

function loadIds(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Missing directory: ${dir}`);
    return new Set();
  }

  return new Set(fs.readdirSync(dir).map((file) => file.replace(".md", "")));
}

// ===== VALIDATIONS =====

function assert(condition, message) {
  if (!condition) {
    console.error("❌ " + message);
    process.exit(1);
  }
}

// ===== LOAD DATA =====

const allies = loadFiles("data/allies/pt_br");
const keywords = loadFiles("data/rules/pt_br/keywords");
const VALID_ANCESTRIES = loadIds("data/ancestries/pt_br");
const VALID_COMMUNITIES = loadIds("data/communities/pt_br");
const VALID_ROLES = loadIds("data/roles/pt_br");

// ===== KEYWORDS =====

const keywordIds = new Set();

keywords.forEach(({ file, data }) => {
  assert(data.id, `${file} missing keyword id`);
  assert(data.title, `${file} missing keyword title`);

  keywordIds.add(data.id);
});

// ===== ALLIES VALIDATION =====

const ids = new Set();

allies.forEach(({ file, data }) => {
  assert(data.id, `${file} missing id`);
  assert(data.name, `${file} missing name`);
  assert(data.role, `${file} missing role`);
  assert(data.ancestry, `${file} missing ancestry`);
  assert(data.community, `${file} missing community`);

  // diplicated ids
  if (ids.has(data.id)) {
    assert(false, `duplicate id: ${data.id}`);
  }
  ids.add(data.id);

  // validations against dictionary
  assert(
    VALID_COMMUNITIES.has(data.community),
    `${file} has invalid community: ${data.community}`,
  );

  assert(
    VALID_ANCESTRIES.has(data.ancestry),
    `${file} has invalid ancestry: ${data.ancestry}`,
  );

  assert(VALID_ROLES.has(data.role), `${file} has invalid role: ${data.role}`);

  // validate keywords
  (data.keywords || []).forEach((k) => {
    assert(keywordIds.has(k), `${file} uses unknown keyword: ${k}`);
  });
});

// ===== SUCCESS =====

console.log("✅ Validation passed!");
