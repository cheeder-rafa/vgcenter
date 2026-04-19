# VGCenter — Damage Calculator (Sub-project 1) — Implementation Plan

## Context

VGCenter is a planned hub of tools for competitive Pokémon (VGC) players. The long-term vision includes multiple features, but the first deliverable — a **battle turn simulator** — is too large for a single spec. It is therefore split into two sequential sub-projects:

1. **(This plan) Damage Calculator + Pokémon data foundation** — a standalone web tool that lets users configure an attacker, a defender, field conditions, and get damage results.
2. **Battle Turn Simulator** — a later sub-project that reuses the calculator as a library to evaluate moves/leads against the first two opposing Pokémon.

The damage calculator is useful on its own (players will use it directly to tune Pokémon builds) and establishes all the foundational infrastructure — Pokémon dataset, damage formula engine, repo layout, TDD harness, CI — that the simulator will build on.

**Regulation targeted in v1: M-A** (April 8 – June 17, 2026). Mechanics supported: **Mega Evolution** (user-confirmed scope; Terastallization is deferred).

## Scope

### In scope (v1)
- Curated static JSON dataset of Paldea Pokédex #001-375 and #388-392 (excluding Regulation M-A banned species), their base stats, types, abilities, movesets, and Mega forms.
- Move dataset (power, type, category, flags: spread/contact/sound/wind/punch/bite/etc.).
- Ability and item datasets, with effects relevant to damage.
- Damage formula per D'Awoblefet's dissertation, adapted to Pokémon Champions' SP system (no IVs; SP 0–32 replaces EVs, implicit max IVs).
- Field modifiers: spread-move reduction, screens (Reflect/Light Screen/Aurora Veil), weather (Sun/Rain/Sand/Snow), terrain (Grassy/Electric/Misty/Psychic), Trick Room, Wonder Room, Tailwind.
- Support effects: Friend Guard, Helping Hand, status conditions (burn halves physical Atk), ability effects on damage (Huge Power, Levitate, Intimidate, etc.), item effects on damage (Life Orb, Choice Band/Specs, Assault Vest, Eviolite, etc.).
- Mega Evolution mid-battle: toggle on either side; stats/type/ability flip to the Mega form when enabled.
- Result display: min–max range + HP% + KO probability, toggleable to a full 16-roll distribution.
- Import: manual form, Pokémon Showdown paste format, Pokepaste URL import.
- Frontend: single-page React app with an attacker panel, defender panel, field panel, result panel.
- Backend: Java 21 + Spring Boot 3 + Maven REST API.
- Test coverage: TDD throughout, JaCoCo >= 85% on domain + application.
- CI: GitHub Actions running tests + linters + type checks + coverage on every push.
- Docker: Dockerfile for backend and frontend, docker-compose.yml for local dev.

### Out of scope (for this sub-project)
- Battle turn simulator (own spec later).
- Terastallization (user elected Mega only in v1 per clarification).
- User accounts / persistence / database.
- Shareable-scenario URLs (defer to v1.1 if desired).
- Pokémon Champions regulation-switching UI (single regulation hardcoded in v1).
- Internationalization beyond English scaffold.
- Mobile-native app.

## Stack Summary (locked decisions)

| Area | Choice |
| --- | --- |
| Backend language/runtime | Java 21 (LTS) |
| Backend framework | Spring Boot 3.x |
| Build tool | Maven (single-module; package-based clean architecture enforced by ArchUnit) |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Frontend state | React hooks; Zustand for cross-component shared state |
| Repo layout | Monorepo: `/backend` and `/frontend` sibling folders |
| Deployment | Self-host with Docker; Dockerfile per side + root docker-compose.yml |
| Testing (BE) | JUnit 5 + AssertJ + Mockito + ArchUnit; MockMvc for web slices; jqwik for property-based tests on the damage formula |
| Testing (FE) | Vitest + Testing Library; Playwright deferred |
| Linting (BE) | Spotless (Palantir Java Format) + Checkstyle |
| Linting (FE) | ESLint + Prettier + `tsc --noEmit` |
| CI | GitHub Actions |
| Coverage | JaCoCo; fail below 85% in `domain`/`application` packages |
| Dataset approach | Curated JSON checked into `backend/src/main/resources/data/` |
| Language | English only (i18n-ready; all user-facing copy behind a `t()` helper) |
| Process discipline | TDD (red → green → refactor) for every new behavior |

## Repository Layout

```
vgcenter-3/
  README.md
  CLAUDE.md                 # shared conventions (Claude Code reads this)
  AGENTS.md                 # same content as CLAUDE.md (Codex reads this)
  docker-compose.yml
  .github/
    workflows/
      backend-ci.yml
      frontend-ci.yml
  .claude/
    settings.json           # Claude Code permissions + hooks
    commands/               # (optional) shared slash commands
    skills/                 # (optional) project-specific skills
  backend/
    pom.xml
    Dockerfile
    .mvn/
    src/
      main/
        java/com/vgcenter/damagecalc/
          DamageCalcApplication.java
          domain/
            model/          # Pokemon, Move, Ability, Item, Nature, Stat, Type, Gender, MoveCategory
            formula/        # DamageFormula, Modifier, ModifierChain
            field/          # Field, Weather, Terrain, Screen, Room
            mega/           # MegaEvolution, MegaForm
          application/
            usecase/        # CalculateDamageUseCase, ImportTeamUseCase
            port/           # PokedexRepository, MoveRepository, AbilityRepository, ItemRepository, TeamParser, PokepasteClient
          infrastructure/
            dataset/        # JsonPokedexRepository, JsonMoveRepository, ...
            importer/       # ShowdownTextParser, PokepasteHttpClient
          web/
            controller/     # DamageCalcController, ImportController, DatasetController
            dto/            # DamageRequestDto, DamageResponseDto, PokemonDto, ...
            mapper/         # DTO <-> domain mappers (MapStruct optional)
            error/          # @ControllerAdvice + ProblemDetails
        resources/
          data/
            regulation-m-a/
              pokedex.json
              moves.json
              abilities.json
              items.json
              mega-evolutions.json
              type-chart.json
              natures.json
          application.yml
      test/
        java/com/vgcenter/damagecalc/
          domain/...
          application/...
          infrastructure/...
          web/...
          architecture/     # ArchUnitTests
        resources/
  frontend/
    package.json
    Dockerfile
    vite.config.ts
    tsconfig.json
    tailwind.config.ts
    src/
      main.tsx
      App.tsx
      pages/
        CalculatorPage.tsx
      features/
        calculator/
          components/       # PokemonPanel, MoveSelector, FieldPanel, ResultPanel, RollDistribution
          hooks/            # useCalculator, usePokemonSearch
          store/            # Zustand store for calculator state
          api/              # typed API client
          types/            # TS types mirroring backend DTOs
        importer/
          ShowdownImportModal.tsx
          PokepasteImportModal.tsx
      lib/
        i18n.ts             # t() helper, English strings
        api-client.ts
      styles/
        tailwind.css
    tests/
      unit/
      component/
```

## Clean Architecture — Boundary Rules (enforced by ArchUnit)

- `domain` depends on nothing outside itself (no Spring, no Jackson, no infrastructure).
- `application` depends only on `domain` and its own `port` interfaces.
- `infrastructure` implements `application.port` interfaces; may use Spring, Jackson, HTTP clients.
- `web` depends on `application` (use cases) and maps between DTOs and domain.
- DTOs live in `web.dto`; domain objects never leak to HTTP.
- One ArchUnit test per rule; they must fail the build when violated.

## Core Domain Model (skeleton)

```java
// domain/model
record Pokemon(SpeciesId species, Form form, Type primaryType, Type secondaryType,
               Stats baseStats, Set<Ability> possibleAbilities, Set<MoveId> legalMoves,
               boolean canMega, MegaFormId megaForm) {}

record Stats(int hp, int atk, int def, int spAtk, int spDef, int speed) {}

// "Built" = after SP + nature + level applied
record BuiltPokemon(Pokemon base, Nature nature, Sp sp, int level,
                    MoveId chosenMove, AbilityId ability, ItemId item,
                    StatusCondition status, StatStages stages, boolean megaActive,
                    Gender gender) {}

record Move(MoveId id, Type type, MoveCategory category, int basePower, int accuracy,
            int priority, Set<MoveFlag> flags, MoveTarget target) {}

// domain/formula
interface Modifier {                       // represents a single multiplicative step
  long apply(long damage, DamageContext ctx);
}

final class DamageFormula {
  long calculate(DamageContext ctx);       // orchestrates the ordered modifier chain
  int[] rolls(DamageContext ctx);          // returns the 16 roll values
}

record DamageContext(BuiltPokemon attacker, BuiltPokemon defender,
                     Field field, boolean isCriticalHit) {}

// domain/field
record Field(Weather weather, Terrain terrain, Set<Room> rooms,
             SideConditions attackerSide, SideConditions defenderSide) {}

record SideConditions(boolean reflect, boolean lightScreen, boolean auroraVeil,
                      boolean tailwind, int friendGuardCount, boolean helpingHand) {}
```

## Damage Formula Reference

Primary reference: D'Awoblefet's Damage Dissertation (Trainer Tower, archived). Implement modifier order exactly as stated:

1. Base damage: `floor(floor(floor(floor(2·Level/5) + 2) · BP · A/D) / 50) + 2`
2. Targets modifier (×0.75 for spread on multiple targets)
3. Weather modifier (Sun ×1.5 for Fire / ×0.5 for Water; Rain mirrored; sand SpDef Rock boost; etc.)
4. Critical hit (×1.5)
5. Random factor (each of 16 rolls in range 85–100 / 100)
6. STAB (×1.5, or ×2.0 with Adaptability)
7. Type effectiveness (product of attacker-type vs each defender type)
8. Burn (×0.5 on physical, unless Guts or Facade)
9. Other multipliers (screens, items, abilities, Friend Guard, Helping Hand, Solid Rock / Filter, Expert Belt, Life Orb, Tinted Lens, Sniper, Neuroforce, Fluffy, Multiscale, etc.)

Each numbered step is its own pure function. The chain is ordered but trivially unit-testable in isolation. Represent field/ability/item effects as `Modifier` implementations so extending the calculator later (new moves, new items, new regulation quirks) doesn't require touching the core algorithm.

## API Design

`POST /api/v1/damage/calculate`
- Body: full scenario (attacker, defender, field, move, `isCriticalHit`)
- Response: `{ rolls:int[16], min:int, max:int, minPct:number, maxPct:number, koChance:{ description:string, probability:number, hits:int } }`

`GET /api/v1/dataset/pokedex?regulation=M-A` — returns the legal roster with base stats, abilities, legal moves.
`GET /api/v1/dataset/moves?regulation=M-A`
`GET /api/v1/dataset/abilities`
`GET /api/v1/dataset/items`
`GET /api/v1/dataset/natures`

`POST /api/v1/import/showdown` — body: `{ text:string }` → `{ team:BuiltPokemonDto[] }`
`POST /api/v1/import/pokepaste` — body: `{ url:string }` → `{ team:BuiltPokemonDto[] }`

All responses use `application/json`. Errors use RFC 7807 Problem Details via `@ControllerAdvice`. Validation via Jakarta Bean Validation annotations on DTOs.

## Dataset Sourcing & Maintenance

1. Seed from Gen 9 Scarlet/Violet (base stats, moves, types, abilities, items never change mechanically).
2. Apply Regulation M-A filter: exclude Paradox, Treasures of Ruin, Koraidon, Miraidon, non-Paldean variants, non-Fancy Vivillon.
3. SP system: replace EV (0–252) with SP (0–32). Stat formula adjusted: `stat = floor((2·base + SP) · level / 100) + 5` (then nature multiplier). HP uses `floor((2·base + SP) · level / 100) + level + 10`. (Assume 31 IVs equivalent baked into base or documented in formula.)
4. Mega evolutions: separate entries keyed by `(speciesId, megaFormId)` with their own stats/type/ability.
5. JSON schemas live alongside data; validated at application startup via a `DatasetHealthCheck` bean. Startup fails loudly if any referenced move/ability/item is missing.

Data updates when a new regulation drops: a maintainer updates the JSON under a new `regulation-<letter>/` folder; the old folder remains for historical scenarios.

## Frontend Layout (text mockup)

```
┌──────────────────────────────── VGCenter · Damage Calc ──────────────────────────────────┐
│  [ Import: Showdown | Pokepaste ]                            [ Regulation: M-A ▼ ]       │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  ATTACKER                       │  FIELD                     │   DEFENDER                 │
│  Species [search ▼]             │  Weather [None ▼]          │   Species [search ▼]       │
│  Ability [ ▼ ] Item [ ▼ ]       │  Terrain [None ▼]          │   Ability [ ▼ ] Item [ ▼ ] │
│  Nature [ ▼ ]                   │  Rooms: ☐ Trick ☐ Wonder  │   Nature [ ▼ ]              │
│  Stats  HP ☐ / Atk ☐ / ...      │  ☐ Tailwind (atk side)     │   Stats  HP ☐ / ...        │
│  Status: [None ▼]               │  Screens on def side:      │   Status: [None ▼]         │
│  Stat stages  +/-               │    ☐ Reflect  ☐ LS  ☐ AV  │   Stat stages +/-          │
│  ☐ Mega active                  │  ☐ Helping Hand            │   ☐ Mega active            │
│  Move [ ▼ ]                     │  # Friend Guards [0 ▼]     │                            │
│  ☐ Critical hit                 │  Targets: ☐ spread (2 tgts)│                            │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  RESULT                                                                                  │
│   168 – 200 dmg   (87.0% – 103.6% HP)   Possible OHKO (68.75%)                           │
│   [ toggle: full 16-roll distribution ]                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

## Testing Strategy

- **TDD end-to-end**. Every new behavior starts with a failing test.
- **Domain layer** (highest rigor):
  - JUnit 5 + AssertJ + jqwik for the formula. Golden-set tests: ~40 known VGC damage calcs vetted against Showdown's Gen 9 calc, adjusted for SP. Every modifier function has unit tests for on/off and edge values.
  - Pure Java; no Spring context.
- **Application layer**: use-case tests with Mockito-mocked ports.
- **Infrastructure layer**: loads real JSON; validates schema and counts; round-trip tests for Showdown parser.
- **Web layer**: `@WebMvcTest` slice tests for controllers; full happy path + validation errors.
- **Architecture**: `ArchUnit` test file asserts package dependencies (`domain` → nothing; `application` → `domain`; `infrastructure` → `application.port` + `domain`; `web` → `application` + `web.dto`).
- **Frontend**: Vitest + Testing Library for components and hooks. Mock the API client in unit tests. At least one full-render test of `CalculatorPage` with a seeded store.
- **Coverage gate**: JaCoCo fails CI if `com.vgcenter.damagecalc.domain` or `.application` coverage drops below 85% line coverage.

## CI / Code Quality

`.github/workflows/backend-ci.yml` — on PR + push to `develop`/`main`:
1. Setup Java 21
2. `./mvnw -B verify` (runs tests, Spotless check, Checkstyle, ArchUnit, JaCoCo report)
3. Upload coverage report artifact

`.github/workflows/frontend-ci.yml` — on PR + push to `develop`/`main`:
1. Setup Node 20 + pnpm 9
2. `pnpm install --frozen-lockfile`
3. `pnpm lint && pnpm typecheck && pnpm test`

`.github/workflows/main-ci-smoke.yml` — only on PRs targeting `main` (added at M10):
1. `docker compose build && up -d`
2. Health-check `http://localhost:8080/actuator/health`

`.github/workflows/release.yml` — fires on tags `v*.*.*` pushed to `main`:
1. Build backend jar and Docker images for both sides
2. Create a GitHub Release with auto-generated notes

Local pre-commit: `husky + lint-staged` on the frontend; `./mvnw spotless:check` locally recommended. No `--no-verify` shortcuts.

Full manual GitHub configuration (branch protection, environments, release process) lives in **`GITHUB_SETUP.md`** at the repo root.

## Git Branching & Release Process (gitflow-lite)

Two long-lived branches:

- **`main`** — production. Protected. Only `release/*` and `hotfix/*` PRs merge here. Every merge is tagged `v<x.y.z>`.
- **`develop`** — integration / staging. Protected. Feature branches merge here first.

Short-lived branches (all branched from `develop`, except hotfixes from `main`):

- `feature/<slug>`, `m{N}-<slug>`, `codex/<slug>`, `claude/<slug>` — work branches.
- `release/v<x.y.z>` — cut from `develop` when preparing a release. Bug fixes + docs only.
- `hotfix/<slug>` — cut from `main` for urgent prod fixes. Merges to both `main` and `develop`.

**Milestone PR flow**: work-branch → PR into `develop` → CI green → human squash-merges.

**Release flow** (human-only; AI agents never merge to `main`):
1. Cut `release/v<x.y.z>` from `develop`.
2. Stabilize + bump version + update `CHANGELOG.md`.
3. PR into `main`; all CI plus `main-ci-smoke` must pass + manual approval.
4. Squash-merge; tag `v<x.y.z>` on `main`; the `release.yml` workflow ships the artifacts.
5. Back-merge the release branch into `develop`.

**Hotfix flow**: branch from `main`, fix, PR to `main` (same gates), then PR the same commits to `develop`.

**Rules hard-coded for AI agents** (also in `AGENTS.md` / `CLAUDE.md`):

- Never push to `main` or `develop`.
- Never target `main` except from `release/*` or `hotfix/*`.
- Never merge without all status checks green.
- Never rewrite history on protected branches.
- Always rebase the work branch on `develop` before opening the PR.
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).

Use `.github/pull_request_template.md` for every PR — it enforces the checklist (rebased, tests green, no new ArchUnit violations, coverage ≥ 85%, no domain-leak, etc.).

## Implementation Milestones (ordered)

Each milestone ends with: all tests green, ArchUnit happy, CI green, commit made.

1. **M0 Repo bootstrap**
   - `backend/` Maven skeleton: `pom.xml`, `DamageCalcApplication`, baseline dependencies.
   - `frontend/` Vite+React+TS+Tailwind skeleton.
   - Root `README.md`, `CLAUDE.md`, `AGENTS.md`, `.gitignore`, `docker-compose.yml` (empty services).
   - CI skeletons (no-op passing).

2. **M1 Domain core — formula, no ecosystem**
   - Stats / Type / Nature / MoveCategory / Sp value objects.
   - `DamageFormula.calculate()` covering only steps 1–7 of the modifier chain.
   - ~15 golden-set unit tests (pure number scenarios).
   - No screens, no abilities, no items yet.

3. **M2 Dataset infrastructure**
   - JSON schemas + a minimal pokedex.json containing ~10 Pokémon (enough for tests).
   - `JsonPokedexRepository` + integration test.
   - `DatasetHealthCheck` bean validating cross-references on startup.

4. **M3 Full modifier chain**
   - Screens, weather, terrain, rooms, status, spread, ability & item modifiers.
   - Expand golden set to 40+ scenarios.
   - Field + SideConditions domain types.

5. **M4 Mega Evolution support**
   - `MegaForm` model; "mega active" toggle in `BuiltPokemon`.
   - Golden set scenarios for a few Megas (Charizard-X, Gengar, etc.).

6. **M5 Dataset expansion**
   - Full Regulation M-A pokedex, moves, abilities, items, natures loaded.
   - All Megas legal in Paldea Pokédex #001-375 / #388-392.

7. **M6 Web layer**
   - `POST /api/v1/damage/calculate` with DTOs + validation.
   - Dataset GET endpoints.
   - Controller slice tests + full-stack end-to-end test with MockMvc.

8. **M7 Importers**
   - `ShowdownTextParser` (domain-adjacent parser, unit tested with paste fixtures).
   - `PokepasteHttpClient` with `WireMock`-based tests.
   - Controllers + DTOs.

9. **M8 Frontend foundation**
   - Typed API client generated from shared TS DTO definitions.
   - Zustand store for calculator state.
   - `CalculatorPage` skeleton with all three panels + static result panel.

10. **M9 Frontend wiring**
    - Wire inputs to store → API → result rendering.
    - Both result display modes (range + full 16 rolls).
    - Importer modals wired to backend.

11. **M10 Polish + Docker + docs**
    - Dockerfiles for both sides; docker-compose runs the full app.
    - README with run instructions.
    - Smoke test: hand-run 5 canonical VGC scenarios in the browser; verify against Showdown's calc.

## Critical Files To Create (initial set)

Backend:
- `backend/pom.xml`
- `backend/src/main/java/com/vgcenter/damagecalc/DamageCalcApplication.java`
- `backend/src/main/java/com/vgcenter/damagecalc/domain/formula/DamageFormula.java`
- `backend/src/main/java/com/vgcenter/damagecalc/domain/formula/Modifier.java`
- `backend/src/main/java/com/vgcenter/damagecalc/domain/model/{Pokemon,Move,Ability,Item,Stats,Sp,Nature,Type}.java`
- `backend/src/main/java/com/vgcenter/damagecalc/domain/field/{Field,Weather,Terrain,Room,SideConditions}.java`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageUseCase.java`
- `backend/src/main/java/com/vgcenter/damagecalc/application/port/{PokedexRepository,MoveRepository,AbilityRepository,ItemRepository,TeamParser,PokepasteClient}.java`
- `backend/src/main/java/com/vgcenter/damagecalc/infrastructure/dataset/JsonPokedexRepository.java`
- `backend/src/main/java/com/vgcenter/damagecalc/infrastructure/importer/ShowdownTextParser.java`
- `backend/src/main/java/com/vgcenter/damagecalc/web/controller/DamageCalcController.java`
- `backend/src/test/java/com/vgcenter/damagecalc/architecture/ArchUnitTests.java`
- `backend/src/main/resources/data/regulation-m-a/pokedex.json`

Frontend:
- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/src/App.tsx`
- `frontend/src/pages/CalculatorPage.tsx`
- `frontend/src/features/calculator/store/calculatorStore.ts`
- `frontend/src/features/calculator/api/damageApi.ts`
- `frontend/src/features/calculator/components/{AttackerPanel,DefenderPanel,FieldPanel,ResultPanel}.tsx`

Shared:
- `README.md`, `CLAUDE.md`, `AGENTS.md`, `docker-compose.yml`, `.gitignore`
- `.github/workflows/{backend-ci,frontend-ci}.yml`
- `.claude/settings.json`

## Verification

After each milestone, run:
- Backend: `cd backend && ./mvnw -B verify` → all tests green, coverage ≥ 85% on target packages, Spotless/Checkstyle/ArchUnit happy.
- Frontend: `cd frontend && pnpm lint && pnpm typecheck && pnpm test` → all green.

After M10 (end-to-end smoke):
- `docker compose up --build` → backend on `:8080`, frontend on `:5173`.
- Open `http://localhost:5173/`, pick 5 canonical VGC scenarios (e.g. *Flutter Mane Moonblast into Urshifu-RS*, *Incineroar Flare Blitz into Amoonguss*, etc.), verify damage range matches Showdown's published Gen 9 calc when adjusted for SP.
- Import a real Pokémon Showdown teampaste — verify the team is read back correctly.
- Import a Pokepaste URL — verify the team is read back correctly.

## Codex + Claude Code — Collaboration Setup

Both tools read agent/skill files at the repo root. To keep them aligned, use these three files:

### 1. `CLAUDE.md` (and identical `AGENTS.md`)

Shared project conventions. Both tools pick this up automatically (Claude Code reads `CLAUDE.md`; Codex reads `AGENTS.md`). Suggested contents:

```
# VGCenter Repo Conventions

## Tech stack
- Backend: Java 21, Spring Boot 3, Maven. Package: com.vgcenter.damagecalc.
- Frontend: React 18, TypeScript, Vite, Tailwind, Zustand.
- Tests: JUnit 5 / AssertJ / Mockito / ArchUnit / jqwik. Vitest + Testing Library on FE.

## Clean architecture (enforced by ArchUnit)
- domain: pure, no framework.
- application: uses domain + own ports.
- infrastructure: implements application.port; can use Spring, Jackson, HTTP.
- web: depends on application + its own DTOs. Never returns domain types.

## TDD
Write a failing test before any new behavior. Red → green → refactor.
Never weaken a test to make it pass. If a test breaks, fix the code — or explain
in the PR why the test was wrong.

## Coverage
JaCoCo line coverage on domain + application must stay ≥ 85%. CI enforces this.

## Formatting
Backend: Palantir Java Format via Spotless — run `./mvnw spotless:apply` before commit.
Frontend: Prettier; use `pnpm format`.

## Commits
Small, focused, imperative-mood subject lines (< 70 chars). One milestone per PR
during the v1 build.

## Do not
- Leak domain types through web DTOs.
- Add dependencies to `domain` on Spring, Jackson, HTTP.
- Commit without running tests.
- Skip hooks (--no-verify).
- Hardcode Pokémon data inside Java code — the JSON dataset is the source of truth.
```

Keep the two files in sync (they can be symlinked or a small CI check can diff them).

### 2. `.claude/settings.json` (Claude Code only)

```json
{
  "permissions": {
    "allow": [
      "Bash(./mvnw *)",
      "Bash(cd backend && ./mvnw *)",
      "Bash(cd frontend && pnpm *)",
      "Bash(docker compose *)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add*)",
      "Bash(git commit*)"
    ],
    "ask": [
      "Bash(git push*)"
    ],
    "deny": [
      "Bash(rm -rf *)"
    ]
  }
}
```

### 3. Splitting work between Claude Code and Codex

The two tools are interchangeable for most tasks — what matters is giving each a precise, bounded job so they don't step on each other. Practical split:

- **Claude Code (this tool):** milestone-level work — produce M0 scaffolding, M1 domain with TDD, M6 web layer, etc. Good at multi-file changes with clean-architecture discipline. Let it drive through entire milestones.
- **Codex:** narrower, repetitive, or self-contained tasks — fill out additional golden-test fixtures, add a new ability's modifier to the chain once the pattern is set, or expand the Pokémon dataset JSON. Codex also excels as a "second reviewer" — ask it to review Claude's PR before merge.

Never have both tools work on the same files at the same time. Use feature branches per tool + PRs to main. If Codex starts a task, block Claude on that part of the tree until the PR is merged.

### (Optional) Project-scoped skills

If you end up repeating a multi-step workflow (e.g., "add a new ability modifier"), create a Claude Code skill:

```
.claude/skills/add-ability-modifier/SKILL.md
```

With front-matter:
```
---
name: add-ability-modifier
description: Use when adding a new ability's effect on damage — creates domain modifier, wires it into the chain, writes golden tests.
---

Steps:
1. Write a failing test in `domain/formula/AbilityModifierTest.java` with the expected pre/post damage.
2. Add a class `<AbilityName>Modifier implements Modifier` in `domain/formula/abilities/`.
3. Register it in the `ModifierChain` resolver keyed by AbilityId.
4. Run `./mvnw test -Dtest=AbilityModifierTest` until green.
5. Run `./mvnw verify` to confirm no regressions and coverage holds.
```

Put only skills you actually need; skills add maintenance cost.

## Open follow-ups for later

- Revisit Terastallization support before the simulator sub-project begins.
- Decide on DB + accounts when starting the simulator sub-project (saved teams become natural there).
- Consider a regulation-switcher in the UI once a second regulation is needed.
- Consider migrating the frontend into Next.js when you build the hub landing/shell site.

---

## How to Execute This Plan With Codex

This section is a concrete, step-by-step guide to running the plan through the **OpenAI Codex CLI** (`codex`). Everything below assumes you will run Codex from the project root `/home/cheeder/dev/vgcenter-3/`.

### Step 0 — One-time Codex install

```bash
# Install Codex CLI (if you haven't already)
npm install -g @openai/codex
# Authenticate (choose one of the supported login flows)
codex login
```

### Step 1 — Scaffold the empty repo and drop the guidance files in place

Before starting Codex, place four files at the repo root. (I can generate them for you in a follow-up turn — they are not written yet because plan mode is active.)

```
/home/cheeder/dev/vgcenter-3/
  AGENTS.md           # Codex reads this automatically from the cwd
  CLAUDE.md           # Claude Code reads this; keep byte-identical to AGENTS.md
  PLAN.md             # Copy of this plan file for Codex to read as context
  .claude/
    settings.json     # Claude Code permissions
    skills/
      add-ability-modifier/
        SKILL.md      # Example skill (optional)
```

Also run once:

```bash
cd /home/cheeder/dev/vgcenter-3
git init
git add -A && git commit -m "Initial repo scaffold: AGENTS.md, CLAUDE.md, PLAN.md"
```

### Step 2 — Launch Codex with the plan as primary context

From the repo root:

```bash
cd /home/cheeder/dev/vgcenter-3
codex
```

When the prompt opens, paste a kick-off message like:

```
Read AGENTS.md and PLAN.md. We are implementing "Sub-project 1: Damage Calculator"
for VGCenter. Work milestone by milestone (M0 → M10). After each milestone:
(1) show me the diff, (2) run the verification commands listed in the plan,
(3) commit with a descriptive message, (4) stop and wait for my confirmation
before starting the next milestone.

Start with M0: bootstrap the Maven backend and Vite frontend scaffolding.
Use TDD everywhere. Do not skip Spotless/Checkstyle/ArchUnit setup.
```

### Step 3 — Milestone-by-milestone execution prompts

Use these as ready-to-paste prompts for each milestone. Run them one at a time. After each, require Codex to commit and stop.

**M0 — Repo bootstrap**
```
Execute milestone M0 from PLAN.md. Create:
- backend/pom.xml (Spring Boot 3 parent, Java 21, Spotless + Checkstyle + JaCoCo + ArchUnit + jqwik + AssertJ),
- backend/src/main/java/com/vgcenter/damagecalc/DamageCalcApplication.java,
- backend skeleton package directories (empty .gitkeep files),
- frontend/ scaffolded with Vite + React + TS + Tailwind + Zustand + Vitest + Testing Library + Prettier + ESLint,
- root docker-compose.yml, README.md, .gitignore,
- .github/workflows/backend-ci.yml and frontend-ci.yml (minimal passing CI).
Then run `cd backend && ./mvnw verify` and `cd frontend && pnpm test` to prove CI-green. Commit.
```

**M1 — Domain core**
```
Execute milestone M1 from PLAN.md: the minimal damage formula (steps 1–7 only)
with pure domain types and 15 golden-set unit tests adapted to the SP stat formula.
No screens, abilities, items yet. TDD discipline — write the tests first.
Run the full backend build before committing. Stop when done.
```

**M2 — Dataset infrastructure**
```
Execute milestone M2 from PLAN.md. Create PokedexRepository port in application,
JsonPokedexRepository in infrastructure, minimal pokedex.json with 10 Pokémon,
schema validation + DatasetHealthCheck. ArchUnit must stay green. Commit.
```

…repeat the same pattern for M3 through M10, copying the milestone text from PLAN.md into the prompt.

### Step 4 — Keep Codex disciplined

Good hygiene per session:

- **"Show me the diff first"** — ask Codex to print the diff before applying large changes.
- **"Re-run verification"** — after every non-trivial edit, make it re-run `./mvnw verify` (and `pnpm test` on the frontend).
- **"Commit now"** — don't let unrelated changes accumulate; one concern per commit.
- **"Don't modify X"** — if Codex starts drifting into unrelated files, bound the scope explicitly.
- **"Cite the plan"** — ask it to quote the exact section of PLAN.md it is implementing. Catches scope creep fast.

### Step 5 — Using Claude Code alongside Codex

Open a second terminal and run `claude` from the same repo. Claude Code will read `CLAUDE.md` (identical to AGENTS.md). **Rule:** never run both tools on the same milestone at the same time. Practical split:

| Work type | Tool |
| --- | --- |
| A full milestone (multi-file, architectural) | Claude Code |
| Narrow additive task (add one ability modifier, extend dataset, add one test fixture) | Codex |
| Second-opinion code review of the other tool's PR | Either |
| Debugging a failing test | Whichever tool wrote the code |

Enforce the separation via git branches: `codex/mX-...` and `claude/mY-...`. Merge via PR.

### Files to create (as a follow-up turn after you approve this plan)

Once this plan is approved, I will create these files in `/home/cheeder/dev/vgcenter-3/`:

1. `AGENTS.md` — the Codex-visible conventions file.
2. `CLAUDE.md` — byte-identical copy for Claude Code.
3. `PLAN.md` — a copy of this plan (so Codex can read it without navigating outside the repo).
4. `.claude/settings.json` — permissions for Claude Code.
5. `.claude/skills/add-ability-modifier/SKILL.md` — example skill scaffold.

**Important:** no source code, no `pom.xml`, no Vite scaffolding will be created at this step — you asked for just the guidance/context files. The actual build begins when you fire up Codex and run through M0.
