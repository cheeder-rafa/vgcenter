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

## Active work after M10 — Damage Calculator Corrections Pass

M0 → M10 are complete. The next work item is the **Damage Calculator Corrections Pass** defined in `PLAN.md` under the section "Corrections Pass (post-M10) — Damage Calculator UX Overhaul". Read that section before starting any task in this phase.

Scope summary (full details in `PLAN.md`):

1. Import modal popups render *under* the calculator — fix with `createPortal` to `document.body`.
2. Remove the "Calculate Damage" button; damage must update reactively (debounced ~200 ms) on any input change.
3. Result readout must show min–max range + HP% + KO chance *and* the 16 rolls simultaneously — no toggle.
4. Species-first inputs: pick a Reg M-A species, auto-populate types/base stats/legal abilities/legal moves. User distributes SP (0–32) + nature; UI shows `Base → SP → Final`. **Level is locked to 50** — no level input in the UI. Four move slots per side with inline per-move damage; both sides are full combatants.
5. Bundle sprites under `frontend/public/sprites/` via a one-off download script (PokéAPI official-artwork). Legends Z-A Mega sprites are manually placed.
6. Widen the container (`max-w-[1600px]`), slim the header (≤ 80 px) so the first calculation fits above the fold at 1080p.

**Reference**: `/nerd-calc.png` at the repo root illustrates the target two-way, inline-per-move readout. Do not copy the visual styling — keep the existing `arena-*` Tailwind theme.

**Rules for this pass:**
- Branch from `develop` as `feature/calc-corrections` (or split into `feature/calc-ux-corrections` + `feature/calc-sprites` if the diff grows large). Target `develop`.
- Do **not** modify the damage formula, the dataset JSON (`backend/src/main/resources/data/regulation-m-a/`), the clean-architecture boundaries, or the existing golden tests.
- Backend gets one new endpoint: `POST /api/v1/dataset/build-stats` that reuses `Stats.toBattleStats(Sp, Nature, level)`. Do not duplicate the SP formula in TypeScript.
- TDD applies: write tests first for `BuildStatsUseCase`, `useReactiveDamage`, `StatTable`, and the portal regression.
- Execute the plan in four bounded sessions (Phase A backend → Phase B+D data layer + modal portal → Phase C UI rewrite → Phase E sprites). After each, run the verification commands, commit per concern with Conventional Commits, and stop for review.
- Ready-to-paste prompts for each phase are at the end of `PLAN.md`'s Corrections Pass section.

## Active work after the Corrections Pass — Sub-project 2: Preview Coach

The rejected **Gameplan Lab** experiment is deprecated. Ignore it as product direction, and delete `/gameplan` in Phase A of the new plan. The next work item is **Sub-project 2 — Preview Coach**, defined in `PLAN.md` under that section. Read it before starting any task in this phase.

Preview Coach helps VGC players choose which 4 of 6 Pokémon to bring, which 2 to lead, what each plan pressures, what each plan risks, and how to adapt in a best-of-3 set. It must reuse exact calculator damage and stats; it must not become a turn simulator.

Scope summary (full details in `PLAN.md`):

1. Replace `/gameplan` with `/preview`. Preserve only reusable shell/navigation/team-store work that still serves the calculator and future tools.
2. Phase A removes the rejected Gameplan implementation and adds a themed `/preview` placeholder.
3. Phase B builds **Lead Lab**: selected lead pair versus all 15 opponent lead pairs, with KO/2HKO pressure, double-up pressure, incoming danger, speed comparison, must-react labels, and turn-1 annotations.
4. Phase C builds **Team Preview Coach**: bring-4 + lead-order recommendations explained as arguments, including covered modes, risky modes, left-out Pokémon rationale, win-condition support, and prediction burden.
5. Phase D builds **BO3 Adaptation Notebook**: game notes, revealed information, adjustment guidance, and markdown/JSON export.

**Rules for this sub-project:**
- Branch from `develop` as `feature/preview-<slug>`. Target `develop`. Never push directly; never target `main`.
- `/gameplan` is deprecated and should be deleted in Phase A. Do not add new behavior to it.
- `/preview` replaces `/gameplan` for all new Preview Coach work.
- Do **not** modify the damage formula, dataset JSON (`backend/src/main/resources/data/regulation-m-a/`), clean-architecture boundaries, or existing golden tests.
- All damage must flow through existing calculator use cases and APIs. Do not add inline damage math in frontend code.
- Frontend work must keep the existing calculator theme and design language: `arena-*` Tailwind tokens, compact VGC workflow density, and readable damage evidence.
- TDD applies: write failing tests first for every new behavior, then implement, then refactor.
- Execute in **four bounded sessions** (Phase A remove Gameplan → Phase B Lead Lab → Phase C Team Preview Coach → Phase D BO3 Notebook). After each, run verification (`./mvnw verify` / `pnpm lint && pnpm typecheck && pnpm test` as applicable), commit per concern with Conventional Commits, and stop for review.
- Ready-to-paste prompts for each phase are at the end of `PLAN.md`'s Sub-project 2 section.
