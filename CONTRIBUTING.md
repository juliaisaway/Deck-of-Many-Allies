# Contributing

Thank you for your interest in contributing!

By submitting a contribution to this repository, you agree that:

- Your contributions will be licensed under the same license as the project (CC BY 4.0)
- The project maintainer (Júlia Alberto) may use, modify, and distribute your contributions in both open and commercial versions of the project

This ensures the project can remain open while also supporting its continued development.

## 📦 Project Structure

All content is written in Markdown and organized by type:

- `data/allies/{locale}` → Allies  
- `data/ancestries/{locale}` → Ancestries  
- `data/communities/{locale}` → Communities  
- `data/roles/{locale}` → Roles  
- `data/rules/{locale}/keywords` → Keywords  

Templates are available in:

- `data/_templates`

---

## 🃏 Adding a New Ally

> Use the templates in `/data/_templates` as a starting point.

### 1. Create the file

```bash
data/allies/{locale}/your-ally-id.md
```

### 2. Follow the rules

- `id` must be unique and kebab-case
- filename must match the `id`
- `name` must match the `# heading` inside the file
- `ancestry`, `community`, and `role` must exist in their dictionaries
- `keywords` must exist
- `community` must be a single value
- `ancestry` and `role` can be multiple

### 3. Optional fields

- `author` → recommended for contributors

### 4. Validate before submitting

```bash
npm run validate
npm run build
```

---

## 🌍 Localization (i18n)

All content must exist in both supported languages:

- `en_us`
- `pt_br`

If you add content in one locale, you must add the equivalent file in the other.
IDs must match across languages.

---

## 🧩 Adding Other Content

You can also contribute:

- New Keywords
- New Ancestries
- New Communities
- New Roles

Please follow the corresponding template and ensure:

- IDs are consistent across locales
- All required fields are present
- Validation passes

---

## ✅ Validation Rules

The project enforces strict validation:

- No unknown fields allowed
- All IDs must be kebab-case
- Filenames must match IDs
- Cross-language consistency is required

If validation fails, the build will not run.

---

## 💡 Tips

- Keep names culturally respectful and avoid direct real-world names
- Prefer "fantasy-inspired" naming over real-world copies
- Keep mechanics clear and concise
- Reuse existing keywords whenever possible

---

Thank you for helping expand the Deck of Many Allies 💜
