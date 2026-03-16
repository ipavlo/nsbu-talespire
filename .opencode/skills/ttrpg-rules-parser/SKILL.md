---
name: ttrpg-rules-parser
description: Parse PDF files containing TTRPG rules and produce a comprehensive yet concise mechanics reference document
license: MIT
compatibility: opencode
metadata:
  audience: game-masters-and-players
  domain: tabletop-rpg
---

## Purpose

Parse one or more PDF files containing tabletop role-playing game (TTRPG) rules and synthesize them into a single, comprehensive reference document that captures every mechanical detail of the system in a concise, well-organized format.

## When to Use

Use this skill when the user:
- Provides PDF files of TTRPG rulebooks and wants a condensed mechanics summary
- Asks to extract and organize game rules from PDF source material
- Needs a quick-reference document for a TTRPG system
- Wants to compare or consolidate rules across multiple PDF supplements

## Workflow

### 1. Gather Input

- Ask the user to specify which PDF file(s) to parse. Use the `@` file picker or accept drag-and-dropped files.
- Ask what the TTRPG system is (e.g., D&D 5e, Pathfinder 2e, FATE, Savage Worlds, a homebrew system) if not obvious from the file names.
- Ask if there are specific sections or mechanics the user wants prioritized or excluded.

### 2. Read and Extract

- Read each PDF using the available tools.
- Extract all textual content, paying attention to:
  - Chapter/section headings and hierarchy
  - Tables (stat blocks, equipment lists, skill tables, etc.)
  - Sidebars and callout boxes (often contain important rule clarifications)
  - Page references and cross-references between sections
- Note any content that could not be extracted (images, complex layouts) and inform the user.

### 3. Identify and Categorize Mechanics

Organize extracted rules into the following canonical categories. Skip any category that does not exist in the source material. Add system-specific categories as needed.

1. **Core Resolution Mechanic** - The fundamental dice/card/token mechanic used to resolve actions (e.g., d20 + modifier vs DC, dice pools, percentile rolls).
2. **Character Creation** - Ancestry/race, class/archetype, backgrounds, ability scores/attributes, starting equipment, and step-by-step creation process.
3. **Attributes & Derived Stats** - Primary attributes, secondary/derived statistics, how they are calculated, and what they affect.
4. **Skills & Proficiencies** - Skill list, how proficiency works, skill checks, contested checks, passive scores.
5. **Combat & Tactical Rules** - Initiative, action economy (actions, bonus actions, reactions, free actions), attack rolls, damage, critical hits, conditions, death & dying, mounted combat, grappling, cover, opportunity attacks.
6. **Movement & Exploration** - Movement speeds, difficult terrain, travel pace, encumbrance, vision/light, stealth, environmental hazards.
7. **Magic & Spellcasting** - Spell slots/points/mana, spell lists by class, casting components, concentration, ritual casting, spell schools, cantrips, spell save DCs, spell attack rolls.
8. **Equipment & Economy** - Weapons, armor, adventuring gear, currency, trade goods, magic items, crafting rules.
9. **Health, Healing & Resting** - Hit points, hit dice, short/long rests, healing spells, death saves, exhaustion, recovery.
10. **Conditions & Status Effects** - Full list of conditions with their mechanical effects.
11. **Advancement & Leveling** - XP tables or milestone rules, what is gained per level, multiclassing rules.
12. **Social & Interaction Rules** - Persuasion, deception, intimidation, reputation, faction mechanics, downtime activities.
13. **Creature & NPC Rules** - Monster stat block format, challenge rating/threat level, encounter building, lair actions, legendary actions.
14. **Vehicles, Mounts & Special Systems** - Any rules for vehicles, ships, strongholds, mass combat, chase sequences, or other subsystems.
15. **GM/DM Tools & Guidelines** - Difficulty class guidelines, encounter balancing, treasure distribution, world-building rules, random tables.
16. **Optional & Variant Rules** - Any explicitly optional rules, variant mechanics, or house-rule suggestions from the source.

### 4. Write the Reference Document

Produce a single Markdown document with the following structure and conventions:

#### Document Conventions

- **Be comprehensive**: Every rule and mechanic from the source must be represented. Do not omit rules for brevity.
- **Be concise**: Use tight prose, bullet points, and tables. Eliminate flavor text, lore, and narrative examples unless they clarify a rule.
- **Use tables** for any data that is naturally tabular (level progression, equipment stats, condition effects, spell lists).
- **Bold key terms** on first use within each section.
- **Cross-reference** related sections with Markdown links (e.g., "see [Conditions](#conditions--status-effects)").
- **Include page references** to the original PDF where possible (e.g., `(PHB p.73)`).
- **Preserve exact numbers** - never paraphrase numerical values, DCs, ranges, durations, or damage dice.
- **Flag ambiguities** - if a rule is unclear or contradictory in the source, note it with a `> **Note:**` blockquote.

#### Document Template

```markdown
# [System Name] - Mechanics Reference

> Compiled from: [list source PDFs with page counts]
> Generated: [date]

## Table of Contents
<!-- auto-generated from headings -->

## 1. Core Resolution Mechanic
...

## 2. Character Creation
...

<!-- Continue for each applicable category -->

## Appendix A: Quick Reference Tables
<!-- Consolidated tables for the most frequently referenced data -->

## Appendix B: Glossary
<!-- Key terms and definitions -->

## Appendix C: Index of Rules by Source Page
<!-- Optional: page-number index back to original PDFs -->
```

### 5. Review and Validate

- After generating the document, do a self-review pass:
  - Verify no major sections from the PDF were missed by comparing against the PDF's own table of contents.
  - Check that all numerical values (DCs, damage, ranges, durations) are accurate.
  - Ensure internal cross-references resolve correctly.
- Present a brief summary to the user listing:
  - Total sections generated
  - Any content that could not be extracted or was ambiguous
  - Suggestions for further refinement

### 6. Output

- Write the final document to a file. Suggest a filename like `[system-name]-mechanics-reference.md` and confirm with the user before writing.
- If the document is very large, offer to split it into multiple files by category.

## Important Guidelines

- **Do NOT invent rules.** Only document what is explicitly stated in the source PDFs. If a rule is implied but not stated, flag it as an inference.
- **Respect copyright.** The output is a mechanical reference, not a reproduction of the book. Strip all flavor text, artwork descriptions, and narrative content. Focus solely on game mechanics.
- **Handle multiple sources.** If parsing multiple PDFs (e.g., core rules + supplements), clearly indicate which source each rule comes from. Note any conflicts between sources.
- **System-agnostic structure.** The category list above is a starting template. Adapt it to the actual system. For example, a PbtA game would not have "Spell Slots" but would have "Moves"; a FATE game would need "Aspects & Fate Points" instead of "Ability Scores."
