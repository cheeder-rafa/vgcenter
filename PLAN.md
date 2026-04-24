# VGCenter — Damage Calculator (Sub-project 1) — Implementation Plan

## Context

VGCenter is a planned hub of tools for competitive Pokémon (VGC) players. The long-term vision includes multiple features, but the first deliverable — a **battle turn simulator** — is too large for a single spec. It is therefore split into two sequential sub-projects:

1. **(This plan) Damage Calculator + Pokémon data foundation** — a standalone web tool that lets users configure an attacker, a defender, field conditions, and get damage results.
2. **Battle Turn Simulator** — a later sub-project that reuses the calculator as a library to evaluate moves/leads against the first two opposing Pokémon.

The damage calculator is useful on its own (players will use it directly to tune Pokémon builds) and establishes all the foundational infrastructure — Pokémon dataset, damage formula engine, repo layout, TDD harness, CI — that the simulator will build on.

**Regulation targeted in v1: M-A** (April 8 – June 17, 2026). Mechanics supported: **Mega Evolution** (user-confirmed scope; Terastallization is deferred).

## Scope

### In scope (v1)
- Curated static JSON dataset of the explicit Regulation M-A Pokémon Champions roster captured under `backend/src/main/resources/data/regulation-m-a/`, with per-species base stats, types, abilities, full learnsets, and the legal Mega roster.
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

1. Maintain the checked-in `regulation-m-a` JSON resources as the source of truth for the explicit Champions Regulation M-A roster rather than deriving legality from a Pokédex-range heuristic.
2. Regulation M-A uses the corrected curated roster supplied for this project: Venusaur through Hydrapple as captured in the dataset, plus the legal Mega roster supported by Pokémon Champions / Legends: Z-A.
3. Legal non-Mega alternate forms are represented as distinct Pokédex entries when the regulation exposes them separately (for example `rotom-heat`, `lycanroc-dusk`, `palafin-hero`, `aegislash-shield`).
4. SP system: replace EV (0–252) with SP (0–32). Stat formula adjusted: `stat = floor((2·base + SP) · level / 100) + 5` (then nature multiplier). HP uses `floor((2·base + SP) · level / 100) + level + 10`. (Assume 31 IVs equivalent baked into base or documented in formula.)
5. Mega evolutions: separate entries keyed by `(speciesId, megaFormId)` with their own stats/type/ability.
6. `items.json` is the global legal item pool for the regulation; Pokédex entries do not carry per-species item legality.
7. JSON schemas live alongside data; validated at application startup via a `DatasetHealthCheck` bean. Startup fails loudly if any referenced move/ability/item is missing.

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
   - Full explicit Regulation M-A roster, moves, abilities, items, and natures loaded from the checked-in Champions dataset.
   - Legal Mega roster loaded from the Regulation M-A dataset rather than a Pokédex range rule.

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

---

# Corrections Pass (post-M10) — Damage Calculator UX Overhaul

M0 → M10 are complete on `develop`. Hands-on use exposed six gaps between the shipped form-style calculator and how VGC players actually build Pokémon. The reference screenshot at `/nerd-calc.png` (Trainer Tower "nerd-calc" style) captures the target mental model: pick a species, distribute SP, see base → final stats, pick four moves, and read live damage for every move in both directions. This section is the full plan to close those gaps. Execute it after M10 is merged; all work targets `develop`.

## Context

Implement this corrections pass as a single feature branch (or split into two PRs if the diff grows large: `feature/calc-ux-corrections` and `feature/calc-sprites`). Do **not** modify the damage formula, the clean-architecture boundaries, the dataset JSON, or the existing golden tests. The shipped TDD discipline still applies.

### Six corrections in scope

1. **Import modal stacking bug** — "Import Showdown" / "Import Pokepaste" popups render *under* the calculator panels because the modal root is a child of a stacking-context ancestor (the `relative isolate` main and the `arena-panel` decorative layers). Fix: render the modal via `createPortal(..., document.body)`.
2. **Reactive damage** — replace the manual "Calculate Damage" button with a debounced effect (~200 ms) that recalculates whenever any input changes. Eight `POST /api/v1/damage/calculate` calls per recompute (4 moves × 2 directions), batched client-side.
3. **Simultaneous range + rolls** — the result readout must show min–max range, HP%, KO chance, *and* the 16 rolls at the same time (no toggle).
4. **Species-first inputs** — drop the raw type/stat/level form fields. A species dropdown (Reg M-A roster) auto-populates types, base stats, legal abilities, legal moves. User distributes SP (0–32 per stat) and picks a nature; UI shows `Base → SP → Final` columns. **Level is locked to 50**; the UI has no level input. Four move slots per side; each slot shows its own damage output inline. Both sides are full combatants — no "attacker only / defender only" asymmetry.
5. **Sprites** — render the species sprite immediately on selection. Bundle sprites as static assets under `frontend/public/sprites/` via a one-off download script. Legends Z-A Mega sprites (not yet in PokéAPI) are placed manually in the same folder from the artwork the maintainer has sourced (see `/nerd-calc.png` reference and the Reddit link in the maintainer's corrections brief).
6. **Layout — wider, slimmer header** — widen the container to `max-w-[1600px]`, keep the 3 columns on desktop, and compress the header so the first calculation fits above the fold on a 1080p screen. Target header height ≤ 80 px.

## Approach

### Phase A — Backend: stat-build endpoint

Add `POST /api/v1/dataset/build-stats`. Reuses existing `Stats.toBattleStats(Sp, Nature, level)` in `domain/model` — do not duplicate the formula on the frontend.

- **Request DTO** (`web/dto/BuildStatsRequestDto.java`, new): `{ speciesId: string, sp: { hp, attack, defense, specialAttack, specialDefense, speed }, natureId: string, megaActive: boolean }`. Level is fixed at 50 server-side (VGC).
- **Response DTO** (`web/dto/BuildStatsResponseDto.java`, new): `{ baseStats: StatsDto, finalStats: StatsDto }`. The frontend displays both columns.
- **Use case** (`application/usecase/BuildStatsUseCase.java`, new): loads species (Mega form if `megaActive`) from `PokedexRepository`, applies `Stats.toBattleStats`. Throws `SpeciesNotFoundException` / `NatureNotFoundException`, mapped to RFC 7807 by the existing `@ControllerAdvice`.
- **Controller** (`web/controller/DatasetController.java`, edit): add `@PostMapping("/build-stats")`.
- **Tests**:
  - `BuildStatsUseCaseTest` (new) — mocked repo; covers happy path, unknown species, invalid nature, Mega-active flipping to the Mega form's stats.
  - Extend `DatasetControllerTest` (or add one) — MockMvc slice for the new endpoint (happy + validation error + not-found).
- ArchUnit passes by construction (new code lives in the right packages). Coverage stays ≥ 85% on domain/application.

**Rationale for the endpoint** (rather than computing stats in TypeScript): `Stats.toBattleStats` is the project's single source of truth for the SP formula and is already backed by golden tests. Duplicating the formula in TypeScript would split that contract. Keeping the call server-side also makes nature/Mega lookups trivial since the dataset lives there.

### Phase B — Frontend data layer

1. **Types** (`frontend/src/features/calculator/types/api.ts`, edit) — add:
   - `BuildStatsRequest`, `BuildStatsResponse`
   - `Spread` (`{ hp, atk, def, spa, spd, spe }`, each 0–32)
   - `CombatantBuild` (species-first shape used by the store; replaces the current `CombatantRequest` for UI state)
   - `MoveSlot` (`{ moveId: string | null }`)
   - Extend `PokedexEntry` with `imageUrl: string` (computed client-side as `/sprites/${id}.png`).

2. **API client** (`frontend/src/features/calculator/api/datasetApi.ts`, edit) — add `buildStats(req)`. Existing `calculateDamage` stays unchanged; it's called 8 times per recompute from the reactive hook.

3. **Store rewrite** (`frontend/src/features/calculator/store/useCalculatorStore.ts`, edit):
   - Replace `CombatantRequest` with `CombatantBuild`:
     ```ts
     {
       speciesId: string | null,
       natureId: string,
       sp: Spread,
       abilityId: string | null,
       itemId: string | null,
       status: StatusCondition,
       megaActive: boolean,
       moves: [MoveSlot, MoveSlot, MoveSlot, MoveSlot],
       // derived (cached from last buildStats call):
       baseStats: Stats | null,
       finalStats: Stats | null,
       types: [Type, Type | null] | null,
     }
     ```
   - Keep `field`, `attackerSide`, `defenderSide`, `criticalHit`, `targets`.
   - **Remove `level` entirely**; assemble damage-calc payloads with `level: 50`.
   - Add results cache:
     ```ts
     results: {
       attackerMoves: (DamageResult | null)[4],
       defenderMoves: (DamageResult | null)[4],
     }
     resultsStatus: 'idle' | 'loading' | 'success' | 'error'
     ```
   - Remove the existing `selectDamageRequest`; add `selectDamageRequestFor(side, moveIndex)` that composes the 8 payloads on demand.

4. **Reactive recompute hook** (`frontend/src/features/calculator/hooks/useReactiveDamage.ts`, new):
   - Subscribes to the store; debounces 200 ms.
   - On change:
     - If either side has `speciesId === null` → skip (nothing to compute).
     - Call `buildStats` for any side whose `baseStats`/`finalStats` is stale (cache key `{ speciesId, natureId, sp, megaActive }`).
     - For each populated move slot, call `calculateDamage` once per direction; run the ≤ 8 calls with `Promise.allSettled`.
     - Store results keyed by `(side, moveIndex)`; drop stale responses using an incrementing request id.

### Phase C — Frontend UI rewrite

File map (edits unless marked *new* / *delete*):

- `frontend/src/pages/CalculatorPage.tsx` — trim header, widen container, remove `CommandBar`'s Calculate button, drop the separate `ResultPanel`.
- `frontend/src/features/calculator/components/PokemonPanel.tsx` *(new)* — replaces `AttackerPanel` and `DefenderPanel`. Same layout for both sides; a `side: 'attacker' | 'defender'` prop switches the accent color (`arena-plasma` vs `arena-cyan`) and binding.
- `frontend/src/features/calculator/components/SpeciesSelect.tsx` *(new)* — searchable species dropdown, populated from `fetchPokedex`.
- `frontend/src/features/calculator/components/SpriteBadge.tsx` *(new)* — renders `<img src="/sprites/${speciesId}.png">`; `onError` falls back to `/sprites/_unknown.png`.
- `frontend/src/features/calculator/components/StatTable.tsx` *(new)* — 6-row table `Stat | Base | SP 0-32 | Final`. SP inputs are `<input type="number" min="0" max="32">` with a running total footer (informational — Champions has no 510-EV cap).
- `frontend/src/features/calculator/components/MoveSlotRow.tsx` *(new)* — one row per move slot: move dropdown (filtered by `species.moveIds`) + inline damage readout (e.g. `"64.6% – 75.4%"`). Clicking the row sets the focus that `DetailedResult` renders.
- `frontend/src/features/calculator/components/DetailedResult.tsx` *(new)* — lives under the 3 columns, full-width. Always shows range + HP% + KO description *and* the 16-roll list simultaneously for the currently-focused `(side, moveIndex)` pair — no toggle.
- `frontend/src/features/calculator/components/FieldPanel.tsx` — keep mostly as-is (still the middle column).
- `frontend/src/features/calculator/components/AttackerPanel.tsx`, `DefenderPanel.tsx`, `ResultPanel.tsx` — **delete**.
- `frontend/src/features/calculator/components/shared.ts` — drop type/stat form helpers no longer used.

**Layout deltas in `CalculatorPage.tsx`:**
- Container: `max-w-[1280px]` → `max-w-[1600px]`; `py-12` → `py-5 sm:py-6`; `gap-10` → `gap-5`.
- Header collapsed to a single row: compact title (`text-2xl sm:text-3xl`), inline regulation chip, import buttons. Removes the large chips + subtitle block. Target header height ≤ 80 px so the first calculation is visible above the fold at 1080p.
- Columns grid stays 3-wide (`lg:grid-cols-[1.2fr_0.7fr_1.2fr]`), with `DetailedResult` beneath spanning full width.

### Phase D — Import modal portal fix

Edit `frontend/src/features/importer/ImportTeamModal.tsx`:

- Wrap the `{open ? (...)}` block in `createPortal(..., document.body)` (imported from `react-dom`). Remove the redundant inner `relative z-10` layer. Backdrop stays `fixed inset-0 z-50`.
- This eliminates the stacking-context issue caused by the modal being a descendant of the `relative isolate` main element and the `arena-panel` decorative overlays.
- No API change; `ShowdownImportModal` / `PokepasteImportModal` are thin wrappers needing no edits.
- Regression test (`ImportTeamModal.test.tsx`): assert the dialog renders under `document.body`, not under the triggering button's parent.

### Phase E — Sprite bundling

1. **Download script** (`scripts/fetch-sprites.mjs`, new): a Node script that reads `backend/src/main/resources/data/regulation-m-a/pokedex.json`, and for each species downloads `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png` → writes to `frontend/public/sprites/${speciesId}.png`. Skips existing files. Logs anything that 404s — those are the species that need manual placement.
2. **Manual Legends Z-A Mega placement**: the maintainer sources the Legends Z-A Mega artwork (Reddit link noted in the corrections brief) and drops them in `frontend/public/sprites/` as `${speciesId}.png` (e.g. `dragonite-mega.png`, `meganium-mega.png`).
3. **Fallback**: include `frontend/public/sprites/_unknown.png` (a simple grey silhouette) so `onError` never leaves a broken-image glyph.
4. **No backend change** — sprites are served by Vite in dev and the frontend container in prod. Same URL in both: `/sprites/${id}.png`.
5. **Do not auto-commit sprite PNGs** from the script run. The maintainer runs the script, eyeballs the output, then commits.

### Phase F — Verification

1. `cd backend && ./mvnw verify` — all tests green; ArchUnit green; JaCoCo ≥ 85% on domain + application.
2. `cd frontend && pnpm lint && pnpm typecheck && pnpm test` — green. New tests:
   - `useReactiveDamage` — debounce + stale-response cancellation with mocked fetch.
   - `ImportTeamModal` — portal rendering under `document.body`.
   - `StatTable` — SP clamping (0–32) and nature modifier reflection in the Final column.
   - `PokemonPanel` — integration: select a species → sprite renders, types populate, legal-move list filters correctly.
3. `docker compose up --build` and hand-verify in a browser:
   - Species dropdown populated with the full Reg M-A roster.
   - Pick *Flutter Mane* (attacker) + *Urshifu-Rapid-Strike* (defender): sprites appear immediately, Moonblast shows damage inline, changing any SP updates results within ~200 ms without a button press.
   - Click "Import Showdown" → modal renders *above* the panels.
   - Header + first full calculation fit in a 1080p viewport without scrolling.
   - Toggle Mega on a Mega-capable species → stats recompute and sprite swaps to the Mega variant.

## Critical files

**Backend — edit:**
- `backend/src/main/java/com/vgcenter/damagecalc/web/controller/DatasetController.java`
- `backend/src/test/java/com/vgcenter/damagecalc/web/controller/DatasetControllerTest.java`

**Backend — new:**
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/BuildStatsUseCase.java`
- `backend/src/main/java/com/vgcenter/damagecalc/web/dto/BuildStatsRequestDto.java`
- `backend/src/main/java/com/vgcenter/damagecalc/web/dto/BuildStatsResponseDto.java`
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/BuildStatsUseCaseTest.java`

**Backend — reuse, do not modify:**
- `backend/src/main/java/com/vgcenter/damagecalc/domain/model/Stats.java` — canonical SP formula.
- `backend/src/main/java/com/vgcenter/damagecalc/application/port/PokedexRepository.java` — loads species + Mega form.

**Frontend — edit:**
- `frontend/src/pages/CalculatorPage.tsx`
- `frontend/src/features/calculator/store/useCalculatorStore.ts`
- `frontend/src/features/calculator/api/datasetApi.ts`
- `frontend/src/features/calculator/types/api.ts`
- `frontend/src/features/calculator/components/FieldPanel.tsx`
- `frontend/src/features/importer/ImportTeamModal.tsx`
- `frontend/src/features/importer/importedTeamMapping.ts` (adapt to the new `CombatantBuild` shape)

**Frontend — new:**
- `frontend/src/features/calculator/components/PokemonPanel.tsx`
- `frontend/src/features/calculator/components/SpeciesSelect.tsx`
- `frontend/src/features/calculator/components/SpriteBadge.tsx`
- `frontend/src/features/calculator/components/StatTable.tsx`
- `frontend/src/features/calculator/components/MoveSlotRow.tsx`
- `frontend/src/features/calculator/components/DetailedResult.tsx`
- `frontend/src/features/calculator/hooks/useReactiveDamage.ts`
- `scripts/fetch-sprites.mjs`
- `frontend/public/sprites/` (PNGs + `_unknown.png`)

**Frontend — delete:**
- `frontend/src/features/calculator/components/AttackerPanel.tsx`
- `frontend/src/features/calculator/components/DefenderPanel.tsx`
- `frontend/src/features/calculator/components/ResultPanel.tsx`

## Execution notes

- **Branching** — per `CLAUDE.md` / `AGENTS.md`, branch from `develop` as `feature/calc-corrections` (or split: `feature/calc-ux-corrections` + `feature/calc-sprites`). Target `develop` in the PR. Never target `main`.
- **TDD** — write tests first for `BuildStatsUseCase`, `useReactiveDamage`, `StatTable`, and the portal regression before implementation. The existing damage-formula golden tests must stay untouched.
- **Commit hygiene** — one concern per commit, Conventional Commits (`feat(backend): build-stats endpoint`, `feat(frontend): species-first panel`, `fix(frontend): portal import modal`, `chore(assets): sprites`).
- **Do not** modify `pokedex.json` or the damage formula. If a legal move/ability gap surfaces during testing, raise it separately.

## Phase ordering (suggested execution prompts)

Run each phase in its own agent session so scope stays bounded. After each phase: green tests, commit, stop for review before moving on.

**Prompt 1 — Phase A (backend stat-build endpoint)**
```
Execute the "Phase A — Backend: stat-build endpoint" section from PLAN.md's
"Corrections Pass (post-M10)". Branch from develop as feature/calc-corrections.
TDD: write BuildStatsUseCaseTest and the DatasetController slice test first, then
implement the DTOs, use case, and controller wiring. Reuse Stats.toBattleStats —
do not duplicate the formula. Run `cd backend && ./mvnw verify`. Commit with
`feat(backend): add POST /api/v1/dataset/build-stats` and stop.
```

**Prompt 2 — Phase B + D (frontend data layer + modal portal fix)**
```
Execute "Phase B — Frontend data layer" and "Phase D — Import modal portal fix"
from PLAN.md's Corrections Pass. Do not touch UI components yet beyond what the
portal fix requires. Add the BuildStatsRequest/Response types, the buildStats
API call, rewrite useCalculatorStore to the CombatantBuild shape (level removed,
4-move slots, results cache), add useReactiveDamage, and wrap ImportTeamModal
in createPortal. Add tests: useReactiveDamage debounce + stale-response
cancellation, ImportTeamModal portal regression. Run
`cd frontend && pnpm lint && pnpm typecheck && pnpm test`. Commit per concern.
```

**Prompt 3 — Phase C (frontend UI rewrite)**
```
Execute "Phase C — Frontend UI rewrite" from PLAN.md's Corrections Pass.
Create PokemonPanel, SpeciesSelect, SpriteBadge, StatTable, MoveSlotRow,
DetailedResult. Delete AttackerPanel, DefenderPanel, ResultPanel. Update
CalculatorPage to the new layout (max-w-[1600px], compact header, 3-col grid,
DetailedResult below). Update importedTeamMapping to produce CombatantBuild.
Add integration tests. Run frontend checks. Commit.
```

**Prompt 4 — Phase E (sprites)**
```
Execute "Phase E — Sprite bundling" from PLAN.md's Corrections Pass. Create
scripts/fetch-sprites.mjs, include _unknown.png, document the manual Legends
Z-A Mega placement step in the script's log output. Do not run the script —
stop after the script + fallback asset + docs are in place. Commit.
```

After all four prompts: open the PR targeting `develop`, run `docker compose up --build`, and walk through the Phase F smoke checklist.

---

## Sub-project 2 — Preview Coach

VGCenter's next tool replaces the rejected `/gameplan` experiment. The old Gameplan Lab route, backend package, frontend slice, and tests are deprecated and should be deleted in Phase A. The new public route is `/preview`.

Preview Coach helps a VGC player turn calculator facts into team-preview decisions: which 4 of 6 to bring, which 2 to lead, what each plan pressures, what each plan risks, and how to adapt in a best-of-3 set. It must reuse the calculator as the source of truth for damage and stats; it must not modify the damage formula, the Regulation M-A dataset JSON, or the clean-architecture boundaries.

### Product framing

VGC team preview is not a pure ranking problem. A useful tool should explain the decision, not hide it behind one opaque score. Preview Coach therefore presents recommendations as arguments:

- **Bring this when...** the plan covers the opponent's strongest modes.
- **Avoid this unless...** the plan requires a hard read or leaves a major threat unanswered.
- **Lead this because...** the pair creates immediate KO, 2HKO, double-up, speed, or positioning pressure.
- **Adjust in Game 2/3 by...** responding to revealed leads, brought Pokémon, moves, items, and play style.

The UI must keep the existing calculator design language: `arena-*` Tailwind tokens, compact VGC workflow density, readable damage evidence, and no unrelated visual restyle.

### Scope

**In scope**

- Replace `/gameplan` with `/preview`.
- Preserve useful shared shell and team-store work if it is not tied to the rejected Gameplan concept.
- Evaluate lead pairs and bring-4 plans using exact `CalculateDamageUseCase` results.
- Show pressure and risk labels in plain language.
- Support BO3 notes and adjustments after each game.
- Export markdown and JSON reports for testing notes and match prep.

**Out of scope**

- Full turn simulation, HP tracking across turns, Protect counter logic, PP, status ticks, stat-stage simulation, or switch-tree search.
- User-configurable scoring weights in the first version.
- Any damage formula change.
- Any dataset JSON change under `backend/src/main/resources/data/regulation-m-a/`.
- Any frontend redesign that abandons the calculator's existing arena theme.

### Rules for this sub-project

- Branch from `develop` as `feature/preview-<slug>`. Target `develop`.
- `/gameplan` is deprecated. Do not build new behavior on that route.
- `/preview` is the new route for all Preview Coach work.
- All damage must flow through existing calculator use cases and APIs. Do not add inline damage math in frontend code.
- Use TDD for new behavior: failing test first, implementation second, refactor third.
- Keep backend architecture clean: domain stays framework-free; web controllers return DTOs, not domain types.
- Keep the frontend visually consistent with the calculator: `arena-*` tokens, existing component patterns, dense but readable layouts.
- Execute in four bounded phases. After each phase, run verification, commit with Conventional Commits, and stop for review.

### Phase A — Remove rejected Gameplan + preserve shell

Goal: clear the rejected experiment before building on top of it.

1. Delete the `/gameplan` route and old Gameplan-specific frontend slice, backend controller/use cases/domain code, and tests that only cover the rejected matrix/recommendation concept.
2. Preserve reusable infrastructure that still supports the calculator and future tools: `AppShell`, `Sidebar`, shared team store, saved-team migration, and calculator imports.
3. Add `/preview` as a placeholder Preview Coach page using the existing calculator arena styling.
4. Update navigation labels and README docs so users see Calculator and Preview Coach only.
5. Add or update tests for routing, sidebar active state, and any preserved store migration behavior.

### Phase B — Lead Lab

Goal: ship the first useful slice: selected lead pair into all 15 opponent lead pairs.

Backend:
- Add `POST /api/v1/preview/leads/evaluate`.
- Given my selected lead pair and opponent team of 6, evaluate all C(6,2) opponent lead pairs.
- Reuse `CalculateDamageUseCase` for all move damage.
- Return OHKO pressure, guaranteed 2HKO pressure, double-up KO pressure, incoming danger, speed comparison, and "must react" labels.
- Return annotations for Protect, Fake Out, redirection, priority, Tailwind, Trick Room, and obvious switch pressure. These annotations do not simulate turns and do not change damage.

Frontend:
- Build Lead Lab inside `/preview`.
- Let the user choose my lead pair from the saved team and inspect the 15 opponent lead pairs.
- Render a compact matrix with severity icons, pressure labels, and flag icons.
- Add a drilldown that cites the exact damage rolls/ranges that justify the label.
- Reuse existing calculator components where practical.

Testing:
- Backend tests for pressure thresholds, double-up pressure, speed comparison, and annotations.
- Frontend tests for the evaluation hook, loading/error states, matrix rendering, keyboard navigation, and drilldown evidence.

### Phase C — Team Preview Coach

Goal: recommend bring-4 plans with explanations, not opaque scores.

Backend:
- Add `POST /api/v1/preview/plans/recommend`.
- Evaluate candidate bring-4 + lead-order plans against opponent lead modes.
- Return top plans with structured explanation fields:
  - plan summary,
  - strongest opponent modes covered,
  - opponent modes that remain risky,
  - win-condition support,
  - left-out Pokémon rationale,
  - prediction burden: `low`, `medium`, or `high`,
  - key damage evidence IDs that the frontend can show in drilldowns.

Frontend:
- Present recommendation cards as arguments: "Bring this when", "Main risk", "Why this lead", and "What to watch for".
- Allow promoting a recommended plan into the Lead Lab view.
- Let the user tag one of their Pokémon as the intended win condition.
- Keep the UI compact enough for tournament prep use on a laptop screen.

Testing:
- Golden-style backend tests for recommendation explanations.
- Frontend tests for plan cards, promote-to-current behavior, win-condition tagging, and empty/partial-team states.

### Phase D — BO3 Adaptation Notebook

Goal: support best-of-3 iteration after Game 1 and Game 2.

Features:
- Record game number, result, previous leads, brought Pokémon, revealed moves/items/abilities, hidden-info notes, and "what caused the win/loss".
- Mark whether the opponent adjusted, repeated, or revealed a new mode.
- Generate adjustment guidance:
  - run it back,
  - change lead only,
  - change backline,
  - change win condition,
  - preserve unrevealed information,
  - take a calculated risk because the current line is losing.
- Export a markdown and JSON report with plans, notes, revealed information, and damage evidence.

Testing:
- Backend or pure utility tests for BO3 guidance classification.
- Frontend tests for note persistence, report export, and copy clarity.

### Verification

Backend:
```
cd backend && ./mvnw spotless:apply && ./mvnw verify
```

Frontend:
```
cd frontend && pnpm lint && pnpm typecheck && pnpm test
```

End-to-end close-out after Phase D:
1. Start the app with the normal local dev flow.
2. Import or create a full team of 6 for both sides.
3. Open `/preview`; confirm `/gameplan` is gone.
4. Evaluate a lead pair and confirm all 15 opponent lead pairs render.
5. Spot-check at least three damage claims against the standalone calculator.
6. Generate team-preview recommendations and promote one into Lead Lab.
7. Add BO3 notes after a mock Game 1 and confirm adaptation guidance updates.
8. Export markdown and JSON; confirm both include notes, recommendations, and damage evidence.

### Ready-to-paste phase prompts

**Prompt A — Remove Gameplan**
```
Execute Phase A from PLAN.md's Preview Coach section. Branch from develop as
feature/preview-shell. Delete the rejected /gameplan implementation: route,
frontend feature slice, backend gameplan domain/application/web code, and tests
that only cover the rejected concept. Preserve shared shell/navigation/team-store
code if still useful. Add /preview as a placeholder Preview Coach page using the
existing arena-* calculator theme. Use vercel-react-best-practices for routing
and store changes, and use polish before final verification. Update README. TDD
where behavior changes. Run backend and frontend verification. Commit per
concern and stop.
```

**Prompt B — Lead Lab**
```
Execute Phase B from PLAN.md's Preview Coach section. Branch from develop as
feature/preview-lead-lab. Build Lead Lab at /preview. TDD first. Use
vercel-react-best-practices for the evaluation hook and rendering performance,
vercel-composition-patterns for the matrix/drilldown component API, clarify for
pressure/risk labels, web-design-guidelines for an accessibility pass, and
polish before final verification. Backend adds POST
/api/v1/preview/leads/evaluate and reuses CalculateDamageUseCase for all damage.
Evaluate my selected lead pair into all 15 opponent lead pairs. Return KO/2HKO
pressure, double-up pressure, incoming danger, speed comparison, must-react
labels, and turn-1 annotations. Frontend renders a compact matrix and drilldown
using existing calculator theme/components. No turn simulation. Run verification,
commit, and stop.
```

**Prompt C — Team Preview Coach**
```
Execute Phase C from PLAN.md's Preview Coach section. Branch from develop as
feature/preview-coach. TDD first. Use vercel-composition-patterns for plan-card
and explanation component structure, vercel-react-best-practices for async
recommendation state and memoization, clarify for recommendation/risk wording,
web-design-guidelines for UX/accessibility review, and polish before final
verification. Backend adds POST /api/v1/preview/plans/recommend over bring-4 +
lead-order candidates. Return recommendation explanations: what the plan beats,
what it risks, opponent modes covered, left-out Pokémon rationale, win-condition
support, and prediction burden. Frontend presents argument-first plan cards, not
a raw score leaderboard, and allows promoting a plan into the Lead Lab view.
Keep arena-* styling. Run verification, commit, and stop.
```

**Prompt D — BO3 Notebook**
```
Execute Phase D from PLAN.md's Preview Coach section. Branch from develop as
feature/preview-bo3-notebook. TDD first. Use clarify for BO3 adaptation copy and
export wording, vercel-composition-patterns for notebook/report components,
vercel-react-best-practices for persisted state and async flows,
web-design-guidelines for accessibility review, and polish before final
verification. Add BO3 adaptation notes to Preview Coach: game number, previous
leads, brought Pokémon, revealed moves/items/abilities, result notes, and
hidden-info notes. Coach output should suggest run it back, change lead only,
change backline, change win condition, or preserve unrevealed info. Add markdown
+ JSON export. Run verification, commit, and stop.
```

After each implementation branch is ready to publish:
```
Use github:yeet to publish the branch and open a PR targeting develop. Do not merge it.
```
