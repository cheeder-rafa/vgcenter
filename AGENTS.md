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
- **Side-by-side spread compare**: `useCompareStore`, `SpreadComparePanel` — done (#74).
- **Discord + PNG export**: `share/exportDiscord.ts`, `share/exportImage.ts`, header buttons — done (#75, #77).
- **Mobile / tablet responsive pass**: 375px–767px viewports across calculator, speed tiers, preview — done (#76).

## Active work — v1.2 Meta Intelligence Suite (3 milestones)

Three new milestones close the gap vs Pikalytics / vgcmulticalc / Labmaus / frontier-delta by turning the calculator's per-matchup output into team-level and game-level insight. Each gets its own feature branch off `develop` and its own PR. Do not mix them in a single branch. Long-form spec lives in `PLAN.md` under `## Sub-project 3 — Meta Intelligence Suite (v1.2)`.

**M11 — Replay Autopsy** (split into M11a parser, M11b evaluator, M11c frontend)

Paste a Pokémon Showdown replay URL (or up to three for a BO3 match) → tool reconstructs each turn's board state, recomputes the rolls that actually happened, and produces a per-turn decision review using `CalculateDamageUseCase` to score the played line vs every legal alternative move pair. New `infrastructure/replay/`, `EvaluateReplayDecisionsUseCase`, `/api/v1/replay/{parse,evaluate}`, and a `/replay` page that reuses `DamageBar`/`RollHeatmap`/`SpriteBadge`. Reference replays committed as fixtures (single Reg-MA, plus BO3 game 1 → game 2). No competitor ships replay-driven feedback — this is the moat.

**M12 — Multi-Threat Spread Optimizer** (`feature/m12-multi-threat-optimizer`)

Generalises `OptimizeDefensiveSpreadService` from "minimise KO chance vs *one* attacker" to "minimise total expected HP loss vs a *list* of attackers", subject to the 66 SP cap. New `OptimizeAgainstThreatsUseCase`, endpoint `POST /api/v1/calc/optimize-against-threats`, configurable goal (`WORST_CASE_KO | EXPECTED_DAMAGE_SUM | SURVIVE_ALL`). Frontend extends `SpreadOptimizerPanel` with a Multi-threat tab plus a `usePinnedThreatsStore` mirroring `useCompareStore` (apply the EMPTY-array selector pattern documented above to avoid the Zustand re-render bug).

**M13 — Threat Matrix** (`feature/m13-threat-matrix`)

Paste two pokepastes → 6×6 damage heatmap; rows = your team, columns = opponent; cells = best-move min%/KO%. Toggle "damage I deal" / "damage I take". Click a cell → opens that matchup in `/calc` via the existing URL-share codec. Hover → full 16-roll distribution. New `BuildThreatMatrixUseCase`, `POST /api/v1/matchup/matrix`, `/matchup` route + feature slice. Performance budget: <500ms server-side for the full grid (asserted by a service test). Cell colouring must be colorblind-safe + AA contrast (verify via `web-design-guidelines` skill).

**Rules for all three milestones:**
- Branch from `develop`. Target `develop`. Never push directly.
- TDD: write failing tests first, then implement, then run `./mvnw verify` (backend) and/or `pnpm lint && pnpm typecheck && pnpm test` (frontend).
- Conventional Commits. Never `--no-verify`.
- Skills per frontend commit: `impeccable → vercel-react-best-practices → vercel-composition-patterns → web-design-guidelines → polish`.
- One PR per milestone (M11 splits into three sub-PRs: M11a → M11b → M11c, each targeting `develop`). Stop after each PR is opened and CI is green; do not self-merge.

## Sub-project 4 — Scoring Systems Hardening (v1.3)

Source of truth: `docs/scoring-systems.md` (system explainer) + `docs/scoring-systems-audit.md` (line-referenced audit with C/M/B IDs). Five milestones, each its own branch off `develop` and its own PR. The technical deep-dive doc (`docs/scoring-systems-technical.md`) is written **after** all five milestones land so it documents the post-fix behaviour, not the pre-fix behaviour.

**M14a — Accuracy & crit in the damage core** (`m14a-accuracy-crit-core`) — covers C3, M2. Thread move accuracy through `DamageFormula` / `CalculateDamageService`; weight rolls by `(23/24)·normal + (1/24)·crit` (override 1.0 for always-crit moves). Expose `expectedDamageWithAccuracy`, `koProbabilityWithCrit` on `CalculateDamageResult` without removing legacy fields. Property tests: `expected(acc<1) ≤ expected(acc=1)`, `koProbWithCrit ≥ koProbNoCrit`.

**M14b — Replay Autopsy correctness** (`m14b-replay-correctness`) — covers C1, C2, M4, M6, B3, B4. Wide/Quick Guard credit across both ally slots; `StatusMoveValueTable` so Tailwind/Trick Room/Helping Hand/Follow Me/Rage Powder/screens score non-zero; clamp `koProbability = 1 − ∏(1 − p_i)`; relative verdict thresholds (`delta / max(|best|, 1)`); switch as a candidate action with `−5` opportunity cost; recoil deducted from user HP.

**M14c — Multi-Threat Optimizer modelling** (`m14c-optimizer-modelling`) — covers M1, M7, B1. Rename `worstKoChance` → `ohkoProbability` (DTO mapped via `web.dto`, never leaked from domain); add `nearKoMargin`; `SURVIVE_ALL` lookahead = 4 tiers past first survivor; drop redundant `spHp + spDef + spSpd` tiebreaker.

**M14d — Preview Coach modelling** (`m14d-preview-modelling`) — covers M3, M5, B2, B5. `bestOutgoing/bestIncoming` score by `mean(rolls) × accuracy`, not `maxPct`; `koPressure` becomes probability-weighted (`koProb ≥ 0.5`); speed comparison reports `{faster, slower, tied}`; `RecommendPlansScoreWeightsTest` locks numeric weight outputs; `−4` mono-category penalty when ≥3/4 brought are physical-only or special-only.

**M14e — Cleanup, technical doc, audit closure** (`m14e-cleanup-and-tech-doc`) — remove deprecated fields from M14a–M14d once consumers are migrated; write `docs/scoring-systems-technical.md` (~600–800 lines, file:line-referenced, post-fix behaviour); update `docs/scoring-systems.md` and strike through resolved items in `docs/scoring-systems-audit.md` with a "resolved in v1.3" pointer to the merge commits; update `README.md` for any user-facing behaviour changes.

**Rules for all five milestones:**
- Branch from `develop`. Target `develop`. Never push directly.
- TDD: failing test first, then implement, then `./mvnw verify` (backend) and/or `pnpm lint && pnpm typecheck && pnpm test` (frontend).
- Conventional Commits. Never `--no-verify`.
- Skills per frontend commit: `impeccable → vercel-react-best-practices → vercel-composition-patterns → web-design-guidelines → polish`.
- One PR per milestone, targeting `develop`. Stop after each PR is opened and CI is green; do not self-merge.

### Codex kickoff prompt (paste verbatim into Codex CLI)

```
Read CLAUDE.md and AGENTS.md (identical). Then read, in order:
  docs/scoring-systems.md
  docs/scoring-systems-audit.md

Execute milestone M14a (accuracy & crit in the damage core) end-to-end:
  1. git checkout develop && git pull --ff-only && git checkout -b m14a-accuracy-crit-core
  2. TDD: write failing tests in DamageFormulaPropertiesTest first.
  3. Implement minimal changes in DamageFormula + CalculateDamageService + CalculateDamageResult.
  4. ./mvnw spotless:apply && ./mvnw verify until green; JaCoCo on domain/application stays ≥85%.
  5. Conventional Commits, never --no-verify.
  6. Push and open a PR targeting develop using the repo template.
  7. Stop and wait for human review. Do NOT start M14b.

When M14a is merged, ask the user before continuing; then repeat for M14b → M14c → M14d → M14e in order. Each milestone is its own branch off develop and its own PR. Never push to main or develop, never self-merge. M14e includes writing docs/scoring-systems-technical.md based on the post-fix behaviour.
```

## Active work — v1.4 Product Intelligence & Retention Suite

Source of truth: `PLAN.md` under `## Sub-project 5 — Product Intelligence & Retention Suite (v1.4)`. This work turns the calculator/prep surface into a repeat-use workflow: credited meta data, meta-aware defaults, team-vs-team matrix, counterfinder, replay findings, practice drills, and onboarding polish.

**Session 0 — Publish Team Prep + roadmap** (`feature/vgcenter-product-enhancements`) — includes `/prep` Team Prep, credited Meta Feed, FieldPanel active modifier summary + Reset Field, README updates, and this roadmap documentation. Commit everything together with `feat(prep): add team prep workspace and roadmap docs`; push and open a PR targeting `develop`; stop.

**Session 1 — Meta data pipeline** (`feature/meta-data-pipeline`) — replace static frontend Meta Feed data with generated credited snapshots. Limitless source: completed online VGC Regulation M-A tournaments from the last 4 weeks, filtered to `players >= 40`. Pikalytics source: Champions Tournaments usage. Snapshot must include `sourceName`, `sourceUrl`, `checkedOn`, and `filterPolicy`.

**Session 2 — Meta-aware defaults** (`feature/meta-aware-defaults`) — explicit `Use Meta Set` / `Apply Common Moves` actions in calculator setup. Use credited Pikalytics-derived common moves/items/abilities. Never silently overwrite user edits.

**Session 3 — Threat Matrix** (`feature/threat-matrix`) — backend `BuildThreatMatrixUseCase`, `POST /api/v1/matchup/matrix`, frontend `/matchup` route, 6x6 heatmap, damage direction toggle, hover/focus rolls, click-through to `/calc`, colorblind-safe AA cells, backend performance test under 500ms for representative 6x6.

**Session 4 — Counterfinder / Patch My Team** (`feature/counterfinder`) — explainable spread, tech move, and replacement recommendations from saved team + watched threats + meta snapshot + calculator/optimizer evidence.

**Session 5 — Replay findings into Team Prep** (`feature/replay-prep-findings`) — Replay Autopsy `Save to Team Prep`; persisted finding cards for turning points, missed KOs, risky lines, and adaptation notes.

**Session 6 — Practice Mode** (`feature/practice-mode`) — `/practice` route with drills generated from saved teams, watched threats, meta threats, and replay findings. Initial drill types: survival check, best KO move, safest lead. Answers must include calculator-backed explanations.

**Session 7 — Onboarding and UX polish** (`feature/onboarding-ux-polish`) — first-run import → Team Prep → Preview Coach → Calc flow, mobile single-matchup mode, keyboard shortcuts, final accessibility/design polish.

**Rules for all v1.4 sessions:**
- Branch from `develop`. Target `develop`. Never push directly to `develop` or `main`.
- TDD first. Public behavior needs unit/component/slice tests as appropriate.
- Source credit is mandatory for Limitless and Pikalytics data in UI/API/docs. No uncredited usage or tournament claims.
- Frontend sessions use: `impeccable → vercel-react-best-practices → vercel-composition-patterns → web-design-guidelines → polish`.
- Run applicable checks before committing: backend `./mvnw spotless:apply && ./mvnw verify`; frontend `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
- Conventional Commits. Never `--no-verify`.
- One PR per session, targeting `develop`. Stop after PR is opened; do not start the next session and do not self-merge.

### v1.4 source-crediting policy

Approved sources:
- Limitless Tournament Platform: `https://play.limitlesstcg.com/tournaments/completed?game=VGC&format=M-A&platform=all&type=online&time=4weeks`
- Pikalytics Champions Tournaments: `https://www.pikalytics.com/pokedex/championstournaments`

Limitless data must be filtered to completed online VGC Regulation M-A tournaments from the last 4 weeks with `players >= 40`. Any generated snapshot must preserve `sourceName`, `sourceUrl`, `checkedOn`, and `filterPolicy`.

### Session 0 kickoff prompt

```
Read AGENTS.md, CLAUDE.md, and PLAN.md. Finish Session 0 on the current branch feature/vgcenter-product-enhancements.

Scope:
- Keep the current Team Prep / Meta Feed implementation.
- Keep the FieldPanel Reset Field implementation.
- Include PLAN.md, AGENTS.md, and CLAUDE.md roadmap updates in the same commit.
- Do not create CODEX.md.

Verification:
  pnpm --dir frontend lint
  pnpm --dir frontend typecheck
  pnpm --dir frontend test
  pnpm --dir frontend build
  cmp AGENTS.md CLAUDE.md
  rg "Sub-project 5|Session 1|Limitless|Pikalytics" PLAN.md AGENTS.md CLAUDE.md

Commit with:
  feat(prep): add team prep workspace and roadmap docs

Push and open a PR targeting develop. Stop. Do not start Session 1.
```

### Session 1 kickoff prompt

```
Read AGENTS.md, CLAUDE.md, and PLAN.md Sub-project 5. Execute Session 1: Meta data pipeline.

Branch from develop:
  git checkout develop && git pull --ff-only && git checkout -b feature/meta-data-pipeline

TDD first. Add a generated, credited meta snapshot pipeline:
- Limitless source: https://play.limitlesstcg.com/tournaments/completed?game=VGC&format=M-A&platform=all&type=online&time=4weeks
- Filter Limitless tournaments to players >= 40.
- Pikalytics source: https://www.pikalytics.com/pokedex/championstournaments
- Preserve sourceName, sourceUrl, checkedOn, and filterPolicy.
- Team Prep consumes generated data and renders visible source credits.

Run full applicable verification. Conventional Commit. Push and open PR targeting develop. Stop.
```

### Session 2 kickoff prompt

```
Read AGENTS.md, CLAUDE.md, and PLAN.md Sub-project 5. Execute Session 2: Meta-aware defaults.

Branch from develop after Session 1 merges:
  git checkout develop && git pull --ff-only && git checkout -b feature/meta-aware-defaults

TDD first. Add explicit meta-set application in the calculator:
- Use credited Pikalytics-derived common moves/items/abilities.
- Add Use Meta Set / Apply Common Moves action.
- Never silently overwrite user edits without explicit action.
- Show source credit near the action.

Use frontend skills: impeccable -> vercel-react-best-practices -> vercel-composition-patterns -> web-design-guidelines -> polish.
Run frontend verification. Conventional Commit. Push and open PR targeting develop. Stop.
```

### Session 3 kickoff prompt

```
Read AGENTS.md, CLAUDE.md, and PLAN.md Sub-project 5. Execute Session 3: Threat Matrix.

Branch from develop:
  git checkout develop && git pull --ff-only && git checkout -b feature/threat-matrix

TDD first. Implement:
- Backend BuildThreatMatrixUseCase.
- POST /api/v1/matchup/matrix.
- Frontend /matchup route.
- 6x6 heatmap with damage I deal / damage I take toggle.
- Hover/focus roll tooltip.
- Click-through to /calc via URL-share codec.
- Colorblind-safe AA contrast cells.
- Representative backend 6x6 performance test under 500ms.

Run backend and frontend verification. Conventional Commit. Push and open PR targeting develop. Stop.
```

### Session 4 kickoff prompt

```
Read AGENTS.md, CLAUDE.md, and PLAN.md Sub-project 5. Execute Session 4: Counterfinder / Patch My Team.

Branch from develop:
  git checkout develop && git pull --ff-only && git checkout -b feature/counterfinder

TDD first. Implement explainable team repair recommendations:
- Inputs: saved team, watched threats, meta usage snapshot, optimizer/calculator evidence.
- Outputs: defensive spreads, tech moves, replacement candidates.
- Every recommendation includes a concise reason and evidence link/source.
- Avoid opaque scores without explanation.

Run full applicable verification. Conventional Commit. Push and open PR targeting develop. Stop.
```

### Session 5 kickoff prompt

```
Read AGENTS.md, CLAUDE.md, and PLAN.md Sub-project 5. Execute Session 5: Replay findings into Team Prep.

Branch from develop:
  git checkout develop && git pull --ff-only && git checkout -b feature/replay-prep-findings

TDD first. Implement:
- Replay Autopsy Save to Team Prep action.
- Persist findings in Team Prep notebook.
- Finding types: turning point, missed KO, risky line, adaptation note.
- Team Prep cards for saved replay findings.

Run full applicable verification. Conventional Commit. Push and open PR targeting develop. Stop.
```

### Session 6 kickoff prompt

```
Read AGENTS.md, CLAUDE.md, and PLAN.md Sub-project 5. Execute Session 6: Practice Mode.

Branch from develop:
  git checkout develop && git pull --ff-only && git checkout -b feature/practice-mode

TDD first. Add /practice:
- Generate drills from saved teams, watched threats, meta threats, and replay findings.
- Drill types: Does this survive? Which move has best KO odds? Which lead is safest?
- Show calculator-backed answer explanations.
- Store local practice history only.

Run frontend verification. Conventional Commit. Push and open PR targeting develop. Stop.
```

### Session 7 kickoff prompt

```
Read AGENTS.md, CLAUDE.md, and PLAN.md Sub-project 5. Execute Session 7: Onboarding and UX polish.

Branch from develop:
  git checkout develop && git pull --ff-only && git checkout -b feature/onboarding-ux-polish

TDD first. Implement:
- First-run flow: import Pokepaste -> Team Prep -> Preview Coach -> Calc.
- Mobile single-matchup calculator flow.
- Keyboard shortcuts for search, swap sides, reset field, copy report.
- Final accessibility/design polish.

Use frontend skills: impeccable -> vercel-react-best-practices -> vercel-composition-patterns -> web-design-guidelines -> polish.
Run frontend verification. Conventional Commit. Push and open PR targeting develop. Stop.
```
