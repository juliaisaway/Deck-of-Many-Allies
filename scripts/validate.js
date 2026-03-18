import fs from "fs";
import path from "path";
import matter from "gray-matter";

// ===== CONFIG =====

const LOCALES = ["pt_br", "en_us"];
const BASE_LOCALE = "pt_br";

// ===== LOAD FILES =====

function loadFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Missing directory: ${dir}`);
    return [];
  }

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

// ===== ASSERT =====

function assert(condition, message) {
  if (!condition) {
    console.error("❌ " + message);
    process.exit(1);
  }
}

// ===== HELPERS =====

function validateList(value, validSet, fieldName, file, locale) {
  const values = Array.isArray(value) ? value : [value];

  values.forEach((v) => {
    assert(
      validSet.has(v),
      `[${locale}] ${file} has invalid ${fieldName}: ${v}`,
    );
  });
}

// ===== VALIDATE PER LOCALE =====

function validateLocale(locale) {
  const basePath = "data";

  const allies = loadFiles(`${basePath}/allies/${locale}`);
  const keywords = loadFiles(`${basePath}/rules/${locale}/keywords`);

  const ancestries = loadIds(`${basePath}/ancestries/${locale}`);
  const communities = loadIds(`${basePath}/communities/${locale}`);
  const roles = loadIds(`${basePath}/roles/${locale}`);

  // ===== KEYWORDS =====

  const keywordIds = new Set();

  keywords.forEach(({ file, data }) => {
    assert(data.id, `[${locale}] ${file} missing keyword id`);
    assert(data.title, `[${locale}] ${file} missing keyword title`);

    keywordIds.add(data.id);
  });

  // ===== ALLIES =====

  const allyIds = new Set();

  allies.forEach(({ file, data }) => {
    assert(data.id, `[${locale}] ${file} missing id`);
    assert(data.name, `[${locale}] ${file} missing name`);
    assert(data.role, `[${locale}] ${file} missing role`);
    assert(data.ancestry, `[${locale}] ${file} missing ancestry`);
    assert(data.community, `[${locale}] ${file} missing community`);

    // duplicate id
    if (allyIds.has(data.id)) {
      assert(false, `[${locale}] duplicate id: ${data.id}`);
    }
    allyIds.add(data.id);

    // ===== STRUCTURE RULES =====

    // community MUST be single
    assert(
      !Array.isArray(data.community),
      `[${locale}] ${file} community must be a single value`,
    );

    // ===== DICTIONARY VALIDATION =====

    validateList(data.ancestry, ancestries, "ancestry", file, locale);

    validateList(data.role, roles, "role", file, locale);

    assert(
      communities.has(data.community),
      `[${locale}] ${file} has invalid community: ${data.community}`,
    );

    // ===== KEYWORDS =====

    (data.keywords || []).forEach((k) => {
      assert(
        keywordIds.has(k),
        `[${locale}] ${file} uses unknown keyword: ${k}`,
      );
    });
  });

  return {
    allies: allyIds,
    keywords: keywordIds,
    ancestries,
    communities,
    roles,
  };
}

// ===== CROSS-LOCALE VALIDATION =====

function validateCrossLocale(results) {
  const base = results[BASE_LOCALE];

  Object.entries(results).forEach(([locale, data]) => {
    if (locale === BASE_LOCALE) return;

    // ===== ALLIES =====

    base.allies.forEach((id) => {
      assert(data.allies.has(id), `[i18n] Missing ally in ${locale}: ${id}`);
    });

    data.allies.forEach((id) => {
      assert(base.allies.has(id), `[i18n] Extra ally in ${locale}: ${id}`);
    });

    // ===== KEYWORDS =====

    base.keywords.forEach((id) => {
      assert(
        data.keywords.has(id),
        `[i18n] Missing keyword in ${locale}: ${id}`,
      );
    });

    data.keywords.forEach((id) => {
      assert(base.keywords.has(id), `[i18n] Extra keyword in ${locale}: ${id}`);
    });

    // ===== ANCESTRIES =====

    base.ancestries.forEach((id) => {
      assert(
        data.ancestries.has(id),
        `[i18n] Missing ancestry in ${locale}: ${id}`,
      );
    });

    data.ancestries.forEach((id) => {
      assert(
        base.ancestries.has(id),
        `[i18n] Extra ancestry in ${locale}: ${id}`,
      );
    });

    // ===== COMMUNITIES =====

    base.communities.forEach((id) => {
      assert(
        data.communities.has(id),
        `[i18n] Missing community in ${locale}: ${id}`,
      );
    });

    data.communities.forEach((id) => {
      assert(
        base.communities.has(id),
        `[i18n] Extra community in ${locale}: ${id}`,
      );
    });

    // ===== ROLES =====

    base.roles.forEach((id) => {
      assert(data.roles.has(id), `[i18n] Missing role in ${locale}: ${id}`);
    });

    data.roles.forEach((id) => {
      assert(base.roles.has(id), `[i18n] Extra role in ${locale}: ${id}`);
    });
  });
}

// ===== RUN =====

const results = {};

LOCALES.forEach((locale) => {
  results[locale] = validateLocale(locale);
});

validateCrossLocale(results);

console.log("✅ Validation passed for all locales!");
