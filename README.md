![Build](https://img.shields.io/badge/build-passing-green)
![License](https://img.shields.io/badge/license-CC%20BY%204.0-blue)

# Deck of Many Allies

A modular ally system for Daggerheart games.

**Deck of Many Allies** is an open, extensible system for creating and using companion characters in your games.  
Each ally is represented as a card with unique mechanics, designed to integrate seamlessly into the flow of play.

> ⚠️ This is a fan-made project and is not affiliated with or endorsed by Darrington Press or Critical Role.

---

## ✨ What is this?

This project provides:

- 🧩 A structured system for allies
- 🃏 Ready-to-use ally cards
- ⚙️ A keyword-driven mechanic system
- 🏷️ Required keyword and tag metadata for every ally
- 🌍 Full support for multiple languages (i18n)

All content is written in Markdown and compiled into ready-to-use documents.
Each ally entry includes validated metadata such as ancestry, community, role, keywords, and tags.
Keywords are defined in `data/rules/{locale}/keywords/`, and allies can only reference keywords documented there.

---

## 📦 Project Structure

`/data/`

- `/_templates/` → Example files for creating new content  
- `/allies/` → Individual allies  
- `/ancestries/` → Ancestry definitions  
- `/communities/` → Community definitions  
- `/roles/` → Role definitions  
- `/rules/` → Rules and keywords  

`/dist/`

- `/pt-br/` → Compiled Portuguese version  
- `/en-us/` → Compiled English version  
- `/stats.md` → Generated project statistics and i18n report  
  
---

## 🌍 Languages

This project currently supports:

- 🇺🇸 English (`en_us`)
- 🇧🇷 Portuguese (`pt_br`)

All content is fully localized and validated to ensure consistency across languages.

---

## 🛠️ Usage

Install dependencies first:

```bash
npm install
```

### Build the project

```bash
npm run build
```

This will:

- Validate all data
- Generate `dist/stats.md` with project statistics
- Generate compiled files in `dist/`

You can validate only:

```bash
npm run validate
```

You can run the automated test suite:

```bash
npm test
```

You can generate only the stats report:

```bash
npm run stats
```

You can remove generated output before rebuilding:

```bash
npm run clean
```

The stats report includes:

- Total ally count
- Ancestry and community usage grouped by source
- Role, keyword, and tag usage counts
- An i18n report showing missing or extra localized allies

The test suite includes unit and integration coverage for validation rules, locale handling, generated output, and build tooling.

If you only want to rebuild the final Markdown output without running validation or stats generation, you can use:

```bash
npm run build:only
```

---

## 🤝 Contributing

Contributions are welcome!

You can:

- Add new allies
- Improve translations
- Expand rules or keywords

Please ensure all contributions follow the existing structure and pass validation.

---

## 🧩 Templates

Use the templates in `data/_templates/` when creating new content:

- `ally.md`
- `keyword.md`
- `ancestry.md`
- `community.md`
- `role.md`

---

## 📜 License

This project is licensed under **Creative Commons Attribution 4.0 (CC BY 4.0)**.

You are free to:

- Use
- Modify
- Distribute
- Use commercially

As long as proper credit is given.

---

## ⚠️ Commercial Content

The following are NOT included under this license:

- Designed PDFs
- Printable card layouts
- Artwork and illustrations
- Visual identity and branding

These assets are part of the commercial version of the project (coming soon)

---

## ⚖️ Legal & Attribution

Darrington Press™ and the Darrington Press authorized work logo are trademarks of Critical Role, LLC and used with permission.

This product includes materials from the *Daggerheart System Reference Document 1.0* © Critical Role, LLC. All rights reserved.

This work is based on Public Game Content and is published under the terms of the Darrington Press Community Gaming License (DPCGL).
[https://www.darringtonpress.com/license/](https://www.darringtonpress.com/license/)

This product contains original content, adaptations, and modifications by the author.

No previous third-party modifications were used in this work.

This is a fan-made project and is not affiliated with or endorsed by Darrington Press or Critical Role.
