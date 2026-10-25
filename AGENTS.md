# AGENTS.md — Developer & AI Agent Context Map

Welcome to **Ration**. This document is the primary onboarding map and invariant specification for AI coding agents and human developers. Read this completely before creating or modifying files.

---

## 1. Golden Rules & Invariants

1. **NEVER REINVENT TYPES:**  
   Always check `packages/types/src/index.ts` first. All domain entities and Zod schemas live there. Do not declare duplicate interfaces.

2. **NEVER HARDCODE ARBITRARY COLORS / STYLES:**  
   In mobile and web UI, use design tokens from `src/theme/tokens.ts`.

3. **MAINTAIN MONOREPO BOUNDARIES:**
   - Mobile client logic stays in `apps/mobile/`
   - Web client logic stays in `apps/web/`
   - Shared data contracts stay in `packages/types/`

4. **RUN BIOME AND INVARIANT CHECKS BEFORE COMPLETION:**  
   All code must pass `npm run check` (Biome linter and invariant verifier) with zero errors.

5. **CONVENTIONAL COMMITS REQUIRED:**  
   All commit messages must adhere to conventional commits (`feat(...)`, `fix(...)`, `chore(...)`, `docs(...)`).

6. **ISOLATE FEATURE BRANCHES:**  
   Always start new feature branches from `origin/develop` (or `origin/master`). Feature PRs target `develop`, and release PRs target `master`.

7. **NO EMOJIS ANYWHERE:**  
   Do not use emojis in UI components, code, comments, commit messages, pull requests, or documentation. Use clean typography, text badges, or vector icons (Lucide) instead.

8. **SELF-DOCUMENTING CODE (NO REDUNDANT COMMENTS):**  
   Code must be self-explanatory through expressive naming and clean architecture. Non-directive comments are blocked by `scripts/verify-invariants.js`. Only necessary tooling directives (e.g. `// biome-ignore`) are permitted.

9. **ZERO UNTRANSLATED UI STRINGS:**  
   All user-facing UI text in components must use the typed `t(...)` translation hook. Direct string literals in `<Text>` or placeholder attributes are blocked by invariant verifiers.

---

## 2. Directory Layout & Import Map

| Package / App    | Purpose                            | Import Alias     | Entry Point    |
| ---------------- | ---------------------------------- | ---------------- | -------------- |
| `apps/mobile`    | Expo React Native POS / Mobile App | `@ration/mobile` | `src/App.tsx`  |
| `apps/web`       | Web Dashboard / POS App            | `@ration/web`    | `src/main.tsx` |
| `packages/types` | Shared Zod schemas & types         | `@ration/types`  | `src/index.ts` |

---

## 3. "Check First" Catalog

Before planning or writing any code, consult this inventory:

### Domain Types & Schemas (`@ration/types`)

- `LocaleSchema`, `type Locale` (`en`, `id`)
- `UserRoleSchema`, `type UserRole` (`admin`, `manager`, `employee`)
- `EntityIdSchema` (UUID validation)
- `RationItemSchema`, `CreateRationItemSchema`, `UpdateRationItemSchema`, `type RationItem`, `type CreateRationItemDto`
- `DistributionRecordSchema`, `CreateDistributionRecordSchema`, `type DistributionRecord`, `type CreateDistributionRecordDto`
- `MoneyCycleSchema`, `CreateMoneyCycleSchema`, `type MoneyCycle`, `type CreateMoneyCycleDto`
- `SpendTransactionSchema`, `CreateSpendTransactionSchema`, `type SpendTransaction`, `type CreateSpendTransactionDto`
- `DailyAllocationSchema`, `type DailyAllocation`

### Official Design System

- `TOKENS` (`src/theme/tokens.ts` in `apps/mobile` and `apps/web`): Canvas `#0a0a0b`, signal yellow `#ffe500`, surface `#141416`, surfaceElevated `#1c1c20`, 18px card radius, `textOnPrimary` `#0a0a0b`.

### Localization Engine (`src/i18n/`)

- `I18nProvider`, `useI18n`: Zero-dependency typed localization engine with parameter interpolation.
- `en`, `id`: Bilingual dictionaries with 100% key parity enforced by automated audit tests.

### Developer & Agent Tooling (`.pi/extensions`)

- `/plan` (`Ctrl+Alt+P`): Read-only exploration mode disabling write tools with a strict file inspection prompt before code changes.
- `/todos`: Plan execution tracker supporting autonomous tag parsing (`[DONE:n]`, comma lists, ranges, markdown checkmarks), auto-reconciliation on git commit, and manual overrides (`/todos done <steps>`, `/todos done all`).
- `/discuss`: Read-only conversational partner for architectural discussions, library comparisons, and UX evaluation.
- `/audit`: Autonomous forensic resilience sweeps (`/audit [domain]`, `/audit sync`) evaluating subsystem integrity and generating test suites.
- `/pr`: Autonomous rebase, conventional commit title analysis, template generation, and pull request creation.

### CI/CD Infrastructure

- `.github/workflows/ci.yml`: Pull request quality gate workflow running Biome lint, invariant checks, and Vitest audit sweeps.
- `.github/workflows/build-apk.yml`: Automated Android release compilation workflow compiling, signing, and attaching `.apk` assets to GitHub Releases.
- `scripts/verify-invariants.js`: AST & regex verification blocking emojis, non-directive comments, and untranslated string literals.

---

## 4. Agent Workflow Checklist

When working on a feature:
1. **Discuss First (Optional):**  
   Use `/discuss` for open-ended brainstorming, architecture discussions, or UI/UX design choices.
2. **Audit Domains (Optional / Diagnostic):**  
   Use `/audit` to trigger autonomous forensic sweeps on system domains (contracts, i18n, all) with live test assertions, or `/audit sync` to discover uncovered features and scaffold missing domain audit suites.
3. **Inspect Before Planning (MANDATORY):**  
   Before proposing any plan, read the relevant existing files (`packages/types`, components, utilities). Never plan in a vacuum.
4. **Plan First:** Use `/plan` to map out changes. Follow up execution with autonomous step tracking or `/todos done <steps>` / `/todos done all` manual overrides.
5. **Cite Inventory:** Explicitly state in the plan which existing types or components will be reused.
6. **Keep Edits Minimal:** Make surgical changes without overwriting unrelated code.
7. **Document Architecture (MANDATORY):**  
   If you created new schemas, design tokens, or endpoints, update `AGENTS.md` ("Check First" Catalog) and `ARCHITECTURE.md` before committing.
8. **Format & Lint:** Run `npm run check` (Biome + invariant checker).
9. **Commit:** Commit with Conventional Commit formatting.
