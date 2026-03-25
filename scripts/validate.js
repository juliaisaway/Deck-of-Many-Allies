import fs from "fs";
import { assert, assertNonEmptyArray } from "./lib/assert.js";
import { validateKeywords } from "./lib/keywords.js";
import { getLocales } from "./lib/locales.js";
import { loadMarkdownFiles } from "./lib/markdown.js";
import { pathToFileURL } from "node:url";
import { validateTags } from "./lib/tags.js";

// ===== CONFIG =====

const BASE_LOCALE = "en_us";

// ===== SCHEMAS =====

const ALLY_SCHEMA = [
  "id",
  "name",
  "ancestry",
  "community",
  "role",
  "keywords",
  "tags",
  "author",
];

const KEYWORD_SCHEMA = [
  "id",
  "title",
  "type",
  "has_parameter",
  "parameter",
  "author",
];

const VALID_KEYWORD_TYPES = ["passive", "trigger", "active", "scaling"];

const ANCESTRY_SCHEMA = ["id", "name", "source", "author"];
const COMMUNITY_SCHEMA = ["id", "name", "source", "author"];
const ROLE_SCHEMA = ["id", "name", "author"];

const VALID_SOURCES = ["daggerheart-srd", "the-void-playtest", "custom"];

// ===== HELPERS =====

function warn(message) {
  console.warn("⚠️ " + message);
}

function loadFiles(dir) {
  return loadMarkdownFiles(dir);
}

function isKebabCase(str) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function validateSchema(data, schema, file, locale) {
  Object.keys(data).forEach((key) => {
    if (!schema.includes(key)) {
      assert(false, `[${locale}] ${file} has unknown field: ${key}`);
    }
  });
}

function validateList(value, validSet, fieldName, file, locale) {
  const values = Array.isArray(value) ? value : [value];

  values.forEach((v) => {
    assert(
      validSet.has(v),
      `[${locale}] ${file} has invalid ${fieldName}: ${v}`,
    );
  });
}

// ===== LOAD VOID SOURCES =====

function loadVoidSources(dir, schema) {
  const items = loadFiles(dir);
  const set = new Set();

  items.forEach(({ data }) => {
    if (schema.includes("source") && data.source === "the-void-playtest") {
      set.add(data.id);
    }
  });

  return set;
}

// ===== DICTIONARY =====

function validateDictionary(dir, label, locale, schema) {
  const items = loadFiles(dir);
  const ids = new Set();

  items.forEach(({ file, data }) => {
    const filename = file.replace(".md", "");

    validateSchema(data, schema, `${label}/${file}`, locale);

    assert(data.id, `[${locale}] ${label}/${file} missing id`);
    assert(data.name, `[${locale}] ${label}/${file} missing name`);

    if (schema.includes("source")) {
      assert(data.source, `[${locale}] ${label}/${file} missing source`);

      assert(
        VALID_SOURCES.includes(data.source),
        `[${locale}] ${label}/${file} invalid source: ${data.source}`,
      );
    }

    assert(
      isKebabCase(data.id),
      `[${locale}] ${label}/${file} id must be kebab-case`,
    );

    assert(
      data.id === filename,
      `[${locale}] ${label}/${file} filename must match id`,
    );

    if (ids.has(data.id)) {
      assert(false, `[${locale}] duplicate ${label} id: ${data.id}`);
    }

    ids.add(data.id);
  });

  return ids;
}

// ===== VALIDATE PER LOCALE =====

function validateLocale(locale) {
  const basePath = "data";

  const allies = loadFiles(`${basePath}/allies/${locale}`);
  const keywords = loadFiles(`${basePath}/rules/${locale}/keywords`);

  const ancestries = validateDictionary(
    `${basePath}/ancestries/${locale}`,
    "ancestry",
    locale,
    ANCESTRY_SCHEMA,
  );

  const communities = validateDictionary(
    `${basePath}/communities/${locale}`,
    "community",
    locale,
    COMMUNITY_SCHEMA,
  );

  const roles = validateDictionary(
    `${basePath}/roles/${locale}`,
    "role",
    locale,
    ROLE_SCHEMA,
  );

  // ===== VOID SOURCES =====

  const voidAncestries = loadVoidSources(
    `${basePath}/ancestries/${locale}`,
    ANCESTRY_SCHEMA,
  );

  const voidCommunities = loadVoidSources(
    `${basePath}/communities/${locale}`,
    COMMUNITY_SCHEMA,
  );

  let warnedVoidGlobal = false;

  // ===== KEYWORDS =====

  const keywordIds = new Set();

  keywords.forEach(({ file, data }) => {
    const filename = file.replace(".md", "");

    validateSchema(data, KEYWORD_SCHEMA, file, locale);

    assert(data.id, `[${locale}] ${file} missing keyword id`);
    assert(data.title, `[${locale}] ${file} missing keyword title`);
    assert(data.type, `[${locale}] ${file} missing keyword type`);

    assert(
      VALID_KEYWORD_TYPES.includes(data.type),
      `[${locale}] ${file} invalid keyword type: ${data.type}`,
    );

    if (data.has_parameter) {
      assert(data.parameter, `[${locale}] ${file} missing parameter`);
    } else {
      assert(!data.parameter, `[${locale}] ${file} should not have parameter`);
    }

    assert(isKebabCase(data.id), `[${locale}] ${file} id must be kebab-case`);

    assert(data.id === filename, `[${locale}] ${file} filename must match id`);

    if (keywordIds.has(data.id)) {
      assert(false, `[${locale}] duplicate keyword id: ${data.id}`);
    }

    keywordIds.add(data.id);
  });

  // ===== ALLIES =====

  const allyIds = new Set();

  allies.forEach(({ file, data, content }) => {
    const filename = file.replace(".md", "");

    validateSchema(data, ALLY_SCHEMA, file, locale);

    assert(data.id, `[${locale}] ${file} missing id`);
    assert(data.name, `[${locale}] ${file} missing name`);
    assert(data.ancestry, `[${locale}] ${file} missing ancestry`);
    assert(data.role, `[${locale}] ${file} missing role`);
    assert(data.community, `[${locale}] ${file} missing community`);
    validateKeywords(data.keywords, keywordIds, file, locale);
    validateTags(data.tags, file, locale);

    const title = extractTitle(content);

    assert(title, `[${locale}] ${file} missing H1`);
    assert(title === data.name, `[${locale}] ${file} title mismatch`);

    assert(isKebabCase(data.id), `[${locale}] ${file} id must be kebab-case`);
    assert(data.id === filename, `[${locale}] ${file} filename must match id`);

    if (allyIds.has(data.id)) {
      assert(false, `[${locale}] duplicate id: ${data.id}`);
    }

    allyIds.add(data.id);

    assert(
      !Array.isArray(data.community),
      `[${locale}] ${file} community must be single`,
    );

    validateList(data.ancestry, ancestries, "ancestry", file, locale);
    validateList(data.role, roles, "role", file, locale);

    assert(
      communities.has(data.community),
      `[${locale}] ${file} invalid community`,
    );

    // ===== VOID CHECK =====

    const ancestriesList = Array.isArray(data.ancestry)
      ? data.ancestry
      : [data.ancestry];

    const usesVoid =
      ancestriesList.some((a) => voidAncestries.has(a)) ||
      voidCommunities.has(data.community);

    if (usesVoid) {
      if (!warnedVoidGlobal) {
        warn(
          `Materials from "The Void" are playtest-only and cannot be used in commercial products under the DPCGL.`,
        );
        warnedVoidGlobal = true;
      }

      warn(`[${locale}] ${data.name} (${file}) uses The Void content`);
    }

    // ===== KEYWORDS =====
  });

  return {
    allies: allyIds,
    keywords: keywordIds,
    ancestries,
    communities,
    roles,
  };
}

// ===== CROSS LOCALE =====

function normalize(value) {
  if (Array.isArray(value)) {
    return [...value].sort();
  }
  return value;
}

function isEqual(a, b) {
  const na = normalize(a);
  const nb = normalize(b);

  return JSON.stringify(na) === JSON.stringify(nb);
}

function validateCrossLocale(results) {
  const baseLocale = BASE_LOCALE;
  const baseAllies = loadFiles(`data/allies/${baseLocale}`);
  const baseKeywords = loadFiles(`data/rules/${baseLocale}/keywords`);

  const baseMap = {};
  const baseKeywordMap = {};

  baseAllies.forEach(({ data }) => {
    baseMap[data.id] = data;
  });

  baseKeywords.forEach(({ data }) => {
    baseKeywordMap[data.id] = data;
  });

  Object.entries(results).forEach(([locale]) => {
    if (locale === baseLocale) return;

    const compareAllies = loadFiles(`data/allies/${locale}`);

    const compareMap = {};
    compareAllies.forEach(({ data }) => {
      compareMap[data.id] = data;
    });

    // ===== EXISTENCE =====

    Object.keys(baseMap).forEach((id) => {
      if (!compareMap[id]) {
        console.warn(`⚠️ [i18n] Missing ally in ${locale}: ${id}`);
      }
    });

    Object.keys(compareMap).forEach((id) => {
      assert(baseMap[id], `[i18n] Extra ally in ${locale}: ${id}`);
    });

    const compareKeywords = loadFiles(`data/rules/${locale}/keywords`);
    const compareKeywordMap = {};
    compareKeywords.forEach(({ data }) => {
      compareKeywordMap[data.id] = data;
    });

    Object.keys(baseKeywordMap).forEach((id) => {
      if (!compareKeywordMap[id]) {
        console.warn(`⚠️ [i18n] Missing keyword in ${locale}: ${id}`);
      }
    });

    Object.keys(compareKeywordMap).forEach((id) => {
      assert(baseKeywordMap[id], `[i18n] Extra keyword in ${locale}: ${id}`);
    });

    // ===== STRUCTURAL VALIDATION =====

    Object.keys(baseMap).forEach((id) => {
      const base = baseMap[id];
      const other = compareMap[id];

      if (!other) return;

      const fields = ["ancestry", "community", "role"];

      fields.forEach((field) => {
        if (!isEqual(base[field], other[field])) {
          assert(
            false,
            `[i18n] Structural mismatch in ${locale} for ally "${id}" field "${field}"
base (${baseLocale}): ${JSON.stringify(base[field])}
other (${locale}): ${JSON.stringify(other[field])}`,
          );
        }
      });

      // ===== KEYWORDS =====

      if (!isEqual(base.keywords, other.keywords)) {
        assert(
          false,
          `[i18n] Keyword mismatch in ${locale} for ally "${id}"
base (${baseLocale}): ${JSON.stringify(base.keywords)}
other (${locale}): ${JSON.stringify(other.keywords)}`,
        );
      }

      // ===== TAGS =====

      if (!isEqual(base.tags, other.tags)) {
        assert(
          false,
          `[i18n] Tags mismatch in ${locale} for ally "${id}"
base (${baseLocale}): ${JSON.stringify(base.tags)}
other (${locale}): ${JSON.stringify(other.tags)}`,
        );
      }
    });
  });
}

// ===== RUN =====

export function run() {
  const locales = getLocales();
  const results = {};

  locales.forEach((locale) => {
    results[locale] = validateLocale(locale);
  });

  validateCrossLocale(results);

  console.log("✅ Validation passed for all locales!");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run();
}
