# VGCenter Repo Conventions

This file is read automatically by AI coding agents (Codex reads `AGENTS.md`, Claude Code reads `CLAUDE.md` — both files are kept byte-identical). Follow these conventions for every change you make in this repo.

## Project at a glance

VGCenter is a hub of tools for competitive Pokémon (VGC) players. The first sub-project is a **Damage Calculator** targeting Pokémon Champions, Regulation M-A (April 8 – June 17, 2026). The full plan is in `PLAN.md` at the repo root — read it before starting any milestone.

## Tech stack

- **Backend:** Java 21 (LTS), Spring Boot 3.x, Maven. Root package: `com.vgcenter.damagecalc`.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand for shared state.
- **Testing (BE):** JUnit 5, AssertJ, Mockito, ArchUnit, jqwik (property-based tests for the damage formula), MockMvc for web slices.
- **Testing (FE):** Vitest, React Testing Library.
- **Linting / formatting (BE):** Spotless (Palantir Java Format) + Checkstyle.
- **Linting / formatting (FE):** ESLint + Prettier + `tsc --noEmit`.
- **CI:** GitHub Actions.
- **Coverage:** JaCoCo; fail the build if line coverage on `com.vgcenter.damagecalc.domain` or `.application` drops below 85%.

## Clean architecture — enforced by ArchUnit

Dependencies must flow inward only. An ArchUnit test enforces these rules and fails CI on violation.

- `domain` — pure Java value objects, the damage formula, field conditions. **No** Spring, **no** Jackson, **no** HTTP client imports.
- `application` — use cases + outbound `port` interfaces. Depends only on `domain`.
- `infrastructure` — implements `application.port` interfaces; may use Spring, Jackson, HTTP.
- `web` — REST controllers and DTOs. Depends on `application` and its own `web.dto`. **Never** returns domain types from controllers.

## TDD discipline (non-negotiable)

Write a failing test before every new behavior. Red → green → refactor.

- Never weaken or delete a test to make it pass. If a test is wrong, explain why in the commit message and fix the test; if the production code is wrong, fix the production code.
- New public behavior requires a golden-set or slice test that exercises it end to end within its layer.
- The damage formula has a golden-set test file that must grow with every new modifier.

## Commits

- Use **Conventional Commits** style: `feat(scope): …`, `fix(scope): …`, `chore: …`, `test: …`, `refactor: …`, `docs: …`, `ci: …`. Subject ≤ 70 chars, imperative mood, no trailing period.
- One milestone per PR during the v1 build.
- Always run tests before committing. Never use `--no-verify`.
- Before committing Java changes: `./mvnw spotless:apply` then `./mvnw verify`.
- Before committing frontend changes: `pnpm lint && pnpm typecheck && pnpm test`.

## Git branching & release workflow (gitflow-lite)

**Long-lived branches**

- `main` — production. Protected. Only `release/*` and `hotfix/*` PRs merge here. Every merge creates a tag (`v0.x.y`).
- `develop` — integration / staging. Protected. Feature branches merge here first.

**Short-lived branches (always branched from `develop` unless noted)**

- `feature/<slug>` — general work.
- `m{N}-<slug>` — milestone work from PLAN.md (e.g. `m3-modifier-chain`).
- `codex/<slug>` and `claude/<slug>` — when it helps identify which agent authored the branch.
- `release/v<x.y.z>` — cut from `develop` when preparing a release. Only bug fixes and docs allowed.
- `hotfix/<slug>` — cut from `main` for urgent prod fixes. Must merge to both `main` AND `develop`.

**Daily loop for AI agents**

1. `git checkout develop && git pull --ff-only`.
2. `git checkout -b m{N}-<slug>` (or `feature/<slug>`).
3. TDD work, commit frequently.
4. `git push -u origin <branch>`.
5. Open a PR **targeting `develop`** using the template at `.github/pull_request_template.md`.
6. Wait for CI (backend-ci + frontend-ci) to go green.
7. Request a squash-merge. Never force-merge; never merge your own PR without passing checks.
8. Delete the remote branch after merge.

**Release loop (human-driven, never let an AI agent merge to `main`)**

1. From a stable `develop`: `git checkout develop && git pull && git checkout -b release/v<x.y.z>`.
2. Bump version numbers, finalize CHANGELOG, final bug fixes only.
3. Open PR `release/v<x.y.z>` → `main`. Requires: `backend-ci`, `frontend-ci`, and `main-ci-smoke` green, plus manual approval.
4. Merge (squash) into `main`. Tag `v<x.y.z>` on main.
5. Back-merge: open PR `release/v<x.y.z>` → `develop` to propagate any fixes.

**Hotfix loop**

1. `git checkout main && git checkout -b hotfix/<slug>`.
2. Fix + test + commit.
3. PR → `main` (same gates as release).
4. After merge, open a second PR with the same commits targeting `develop`.

## Rules for AI agents on git

- **Never** push directly to `main` or `develop`.
- **Never** open a PR targeting `main` unless it comes from `release/*` or `hotfix/*`.
- **Never** merge a PR without all required status checks green.
- **Never** rewrite history on `main` or `develop` (no rebase, no force-push).
- Before opening a PR: `git fetch origin && git rebase origin/develop` (or `main` for hotfixes) so the branch is up to date.
- If a PR is blocked on CI failures, fix the code; never retry-merge to bypass.
- Tags (`v0.x.y`) are created only on `main`, only by the human maintainer.

## What NOT to do

- Do not leak domain types through web DTOs — always map.
- Do not add dependencies on Spring, Jackson, or any HTTP client inside `domain`.
- Do not hardcode Pokémon data inside Java code — the JSON dataset under `backend/src/main/resources/data/` is the source of truth.
- Do not commit without running the full test suite for the side you changed.
- Do not skip Git hooks (`--no-verify`).
- Do not mix unrelated changes in the same commit.

## Milestone workflow for AI agents

`PLAN.md` defines milestones M0 through M10. When asked to execute a milestone:

1. Quote the milestone heading from `PLAN.md` to confirm scope.
2. Branch off `develop`: `git checkout develop && git pull --ff-only && git checkout -b m{N}-<slug>`.
3. Write failing tests first.
4. Implement the minimum to make them pass.
5. Refactor.
6. Run `./mvnw verify` (backend) and/or `pnpm test` (frontend) until green.
7. Run `./mvnw spotless:apply` (backend) / `pnpm format` (frontend) before staging.
8. Commit with a Conventional Commits subject.
9. `git push -u origin m{N}-<slug>` and open a PR **targeting `develop`** using the PR template.
10. Stop and report. Do not start the next milestone, and do not merge the PR, without explicit human confirmation.

## Data sourcing policy

- All Pokémon, move, ability, item, and nature data lives in `backend/src/main/resources/data/regulation-m-a/` as JSON.
- Schema is validated at application startup via `DatasetHealthCheck`; any dangling reference (e.g., a Pokémon's ability that isn't in `abilities.json`) must fail startup loudly.
- Regulation M-A roster: the explicit Pokémon Champions launch roster captured in `backend/src/main/resources/data/regulation-m-a/` (the corrected curated list spanning Venusaur through Hydrapple, plus the legal Mega roster), not a Paldea Pokédex range rule.
- Legal non-Mega alternate forms are stored as distinct Pokédex entries when Regulation M-A exposes them separately.
- `items.json` is the global legal item pool for Regulation M-A. Do not model item legality as per-species lists in `pokedex.json`.
- SP (0–32) replaces EVs. Assume all Pokémon have max-equivalent IVs. HP and stat formulas are documented in `PLAN.md` under the "Damage Formula Reference" / "Dataset Sourcing" sections.

## Definitions of "done" per milestone

A milestone is done only when all of these hold:

- New and existing tests pass.
- JaCoCo coverage on `domain` and `application` remains ≥ 85%.
- Spotless, Checkstyle, and ArchUnit are green.
- The change is committed with a Conventional Commits message.
- A PR has been opened targeting `develop` and CI has passed.
- Any user-facing behavior is documented in `README.md`.
- The human maintainer has reviewed and merged the PR.

## Completed work (reference)

- **M0–M10**: damage formula, dataset pipeline, all core calculator features — done.
- **Corrections Pass**: reactive damage, stat table, portal fix, sprites — done.
- **Sub-project 2 — Preview Coach** (Phases A–D): `/preview` page, Lead Lab, Team Plan, BO3 Notebook — done.
- **Speed tier unification**: single sorted list, mega highlight when stone held — done (merged to develop).
- **URL-share state**: base64url codec, Share Link button, round-trip tests — done (merged to develop).
- **Calc history**: session ring buffer (N=10), `HistoryPanel`, `useCalcHistorySync` — done (merged to develop).
- **Spread library**: `useSpreadLibraryStore` (localStorage), `SpreadLibraryDropdown` in PokemonPanel — done (merged to develop).

## Active work — v1.1 Wishlist (3 items remaining)

Three wishlist items are not yet started. Each gets its own feature branch off `develop` and its own PR. Do not mix them in a single branch.

**Item 6 — Side-by-side defender spread compare** (`feature/spread-compare`)

New collapsible panel below `EvOptimizerPanel` that lets the user pin up to 4 defender builds and compare damage intake side-by-side from the current attacker.

- New store: `frontend/src/features/calculator/store/useCompareStore.ts` — session-only (no persist), max 4 `PinnedDefender = { id, label, build: CombatantBuild }`. Pattern: copy from `usePinStore.ts`.
- New component: `frontend/src/features/calculator/components/SpreadComparePanel.tsx` — collapsible, "Pin current defender" snapshots the active defender build. Each column calls `calculateDamage` (damageApi), shows `minPct–maxPct`, `koChance`, reuses `DamageBar`.
- Wire into `CalculatorPage.tsx` below `<EvOptimizerPanel />`.
- Tests: `tests/unit/store/useCompareStore.test.ts`, `tests/component/calculator/SpreadComparePanel.test.tsx`.
- **Zustand selector gotcha**: never use `?? []` inline in a selector — use a module-level `const EMPTY: T[] = []` constant, or Zustand will see a new reference every render and loop infinitely. This bug was already fixed in `SpreadLibraryDropdown`; apply the same pattern here.

**Item 7 — Discord text + PNG export** (`feature/share-export`)

Two new header buttons alongside the existing Share Link button.

- Add dep: `pnpm add html-to-image` (frontend only, no backend changes).
- New module: `frontend/src/features/calculator/share/exportDiscord.ts` — pure `formatDiscordReport(...)` function, no DOM. Outputs a Discord code-block with attacker→defender heading, move rows (name, min%–max%, KO%), 16 rolls. Null move slots are skipped.
- New module: `frontend/src/features/calculator/share/exportImage.ts` — `exportResultImage(el: HTMLElement): Promise<void>`. Uses `toPng` from html-to-image, copies via `ClipboardItem`; download fallback if clipboard API unavailable. Fires `useToastStore` toast.
- `CalculatorPage.tsx`: add `ref` to `data-testid="detailed-result-span"` div; pass `onExportDiscord` and `onExportPng` to `CompactHeader`; buttons use `arena-button` class.
- Tests: `tests/unit/exportDiscord.test.ts` (pure formatter — no DOM mocks needed). Skip `exportImage` unit test (DOM capture unreliable in happy-dom; note in commit body).

**Item 8 — Mobile / tablet responsive pass** (`feature/mobile-pass`)

Makes `CalculatorPage`, `SpeedTierPage`, and `PreviewPage` usable at 375px–767px. No horizontal page scroll, no functionality cuts, tap targets ≥ 44px.

- `CalculatorPage.tsx`: add `min-h-[44px]` to Share Link, export buttons, import modal triggers. Verify `SavedPokemonRail` stacking doesn't push content below fold on narrow screens.
- `SpeedTierPage.tsx`: wrap speed list in `overflow-x-auto` if missing; sprite column must not overflow at 375px.
- `PreviewPage` panels: verify stacking under `sm:` breakpoints.
- CSS-only responsive changes; no new JS; no motion added on mobile.
- Tests: viewport-width snapshot — render `CalculatorPage` in a 375px container, assert no horizontal overflow.
- Skip overdrive skill on this item (motion is a liability on mobile). Use impeccable → polish only.

**Rules for all three items:**
- Branch from `develop`. Target `develop`. Never push directly.
- TDD: write failing tests first, then implement, then run `pnpm lint && pnpm typecheck && pnpm test` from `frontend/`.
- Conventional Commits. Never `--no-verify`.
- Skills per frontend commit: `impeccable → overdrive → polish` (skip overdrive on mobile-pass).
- One PR per item. Stop after each PR is opened and CI is green; do not self-merge.
