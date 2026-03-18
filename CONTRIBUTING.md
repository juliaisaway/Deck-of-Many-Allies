# Contributing

Thank you for your interest in contributing!

By submitting a contribution to this repository, you agree that:

- Your contributions will be licensed under the same license as the project (CC BY 4.0)
- The project maintainer (Júlia Alberto) may use, modify, and distribute your contributions in both open and commercial versions of the project

This ensures the project can remain open while also supporting its continued development.

## Adding a new Ally

> Use the templates in `/templates` as a starting point to create new content.

1. Create a file in:
   data/allies/{locale}/your-ally.md

2. Follow the frontmatter structure:

- id must be unique
- keywords must exist
- ancestry/community/role must exist

1. Run:

npm run validate
npm run build
