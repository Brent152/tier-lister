---
name: catalog-scrape-skill
description: A tested personal skill exists for scraping any paginated web catalog into a tier-lister JSON list
metadata:
  type: reference
---

When the user wants to build a tier-lister list by scraping an online store/catalog (dozens–hundreds of paginated products, each needing a scraped description/image), use the personal skill `scraping-catalog-to-tier-list` at `~/.claude/skills/scraping-catalog-to-tier-list/SKILL.md`.

It encodes the proven manifest → chunk → parallel-Haiku-enrich → merge pipeline and the two hard-won failure modes (listing pages lazy-load so per-product fetch is mandatory; subagents must write files + return a one-line summary or they overflow the 32k output limit and silently lose everything). Built and validated on the Bulk Apothecary fragrance-oil run (683 items, 0 missing). Scratch lives in gitignored `tmp/`.
