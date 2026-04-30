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

## Corrections Addendum — Thread Matrix, readout, import, sprite, and PNG polish

This follow-on branch closes the remaining UX and formatting gaps surfaced after the first Corrections Pass. Keep scope on `develop`; do not change the damage core or the Regulation M-A dataset beyond aliasing and artwork lookup. The goal is tighter output, not new battle logic.

### Scope

- **Threat Matrix**
  - Fix legend text so `OHKO` only appears when the cell can actually reach `>= 100%`.
  - Add a dedicated OHKO color bucket and a subtle highlight treatment so lethal cells stand out without looking noisy.
  - Fix `damage I Take` axis labeling so rows and columns still describe the two teams correctly.
  - Let the matrix input accept either a Showdown paste or a Pokepaste URL; auto-detect the format instead of forcing two separate entry points.
- **Calculator**
  - Format the summary text with explicit SP context for the relevant attacking and defending stats.
  - Include non-zero stage prefixes in the summary so boosts and drops are visible in copied text.
- **Alternate forms**
  - Normalize canonical aliases for alternate-form species during import and sprite lookup.
  - Cover the reported cases (`Maushold`, `Aegislash`) plus the common form roots users type without the suffix they expect the roster to need.
- **Export PNG**
  - Use the leftover blank area beneath each move list to render compact attacker/defender SP spread summaries.

### Implementation order

1. Add failing tests first for matrix legend/color buckets, take-mode labels, input auto-detect, summary formatting, sprite alias resolution, and PNG layout.
2. Implement the importer and alias normalization paths first so both matrix and calculator flows share the same resolution logic.
3. Update matrix cell styling, readout formatting, and PNG composition to consume the new data.
4. Re-run backend and frontend verification, then hand-check representative examples for one lethal cell, one `damage I Take` view, one Showdown paste import, one Pokepaste import, and one PNG export.

### Verification

- Backend: `./mvnw spotless:apply && ./mvnw verify`
- Frontend: `pnpm lint && pnpm typecheck && pnpm test`
- Manual spot checks:
  - one OHKO cell uses the dedicated color treatment
  - one `damage I Take` matrix shows the correct team labels
  - one Showdown paste import and one Pokepaste URL import both work
  - one calculator readout shows SP context plus any non-zero stages
  - one PNG export shows compact SP summaries in the previously blank space

### Assumptions

- Keep matrix import permissive on the client; backend import endpoints stay explicit.
- Prefer existing sprite filenames and dataset entries. Add aliases and fallback handling only where the dataset already supports the form or the sprite asset already exists.

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

---

## v1.1 Candidates (wishlist — not scheduled)

These items were deferred during the v1 build. Capture here for future prioritisation; no implementation until explicitly scoped.

- **URL-share state** — encode calculator inputs (species, SP, moves, field) into a shareable URL so users can link a specific matchup.
- **Side-by-side spread compare** — show two defender spreads in parallel columns so the user can compare bulk trade-offs at a glance.
- **Calc history** — a session-scoped log of recent calculations the user ran, allowing quick re-load of any prior matchup.
- **Mobile / tablet pass** — audit and adapt the calculator and Preview Coach layouts for viewports below 768px; no functionality cut.
- **Discord / PNG export** — render a damage result or team plan as a shareable image or formatted Discord embed.
- **Spread library** — save and name favourite spreads per species; load them back into the calculator in one click.
- **Matchup heatmap** — a grid view showing how a full 6-mon roster fares against a set of benchmark threats (damage output + bulk in one matrix). *(Promoted to M13 under Sub-project 3 — Meta Intelligence Suite.)*
- **Practice mode** — a quiz-style drill where the user guesses whether a move KOs or 2HKOs before the result is revealed.

---

# Sub-project 3 — Meta Intelligence Suite (v1.2)

## Context

The v1 calculator and v1.1 polish (URL share, history, spread library, side-by-side compare, Discord/PNG export, mobile pass) are shipped. Competing tools — Pikalytics (usage stats), vgcmulticalc (multi-target calc), Labmaus (team explorer / replay-derived stats), frontier-delta (teammate discovery), NCP-VGC (clean Honko fork) — all stop at *static* analysis: they tell you what spreads exist, what teammates pair with what, and how single matchups roll. **None ingests a real Showdown replay and overlays calc-grounded "what-if" feedback on each turn.** That gap, plus a generalised multi-target optimizer and a team-vs-team matrix that integrates the user's own SP-aware spreads, is the v1.2 thesis.

Three new milestones, branched off `develop`, executed in this order (per user direction): **M11 → M12 → M13**. M11 (Replay Autopsy) is the most ambitious and is split into three sub-PRs (M11a parser, M11b evaluator, M11c frontend).

## Scope

### In scope (v1.2)
- **M11 — Replay Autopsy.** Parse public Showdown replay logs into a turn-by-turn `ReplayTimeline`; for each turn, score the played move pair vs every legal alternative using the existing `CalculateDamageUseCase`. BO3 mode chains games and surfaces inter-game adaptation flags.
- **M12 — Multi-Threat Spread Optimizer.** Generalise `OptimizeDefensiveSpreadService` from one attacker to a *list* of attackers, with selectable objective (`WORST_CASE_KO | EXPECTED_DAMAGE_SUM | SURVIVE_ALL`).
- **M13 — Threat Matrix.** 6×6 damage heatmap from two pokepastes; click-through to `/calc`; speed-tier strip on both axes.

### Out of scope (for v1.2)
- Usage statistics scraping (no Pikalytics-style aggregated dataset; that's a separate sub-project).
- Live battle-state coach / in-battle helper.
- Battle turn simulator (still its own future sub-project).
- Persisting replays or matrices server-side (stateless endpoints; clients keep history locally if they want it).

## Why this isn't already in any competitor

| Tool | Their edge | What v1.2 adds that they don't have |
|---|---|---|
| vgcmulticalc | One attacker → many defenders matrix | Bidirectional 6×6 with SP-aware spreads, abilities, items, click-through to a fully-stateful calc |
| NCP-VGC | Clean Honko fork | Replay autopsy and multi-threat optimizer not present |
| Pikalytics | Usage-aggregated spreads | No replay analysis; no per-build "stress test" against a custom threat list |
| Labmaus | Team explorer, archetype clustering | Decision review per turn using a real damage formula, not just summary stats |
| frontier-delta | Teammate correlations | Same — no per-turn evaluator |

## Damage formula reuse

All three milestones reuse `CalculateDamageUseCase` unchanged. No domain or formula edits are required for v1.2. The only domain additions are pure value objects: `ReplayTimeline`, `ReplayTurn`, `ReplayEvent`, `TurnReview`, `MatrixCell`, `ThreatList`. ArchUnit rules continue to forbid Spring/Jackson inside `domain` — replay parsing/HTTP lives in `infrastructure/replay/`.

## Milestone specs

### M11 — Replay Autopsy

**Goal:** paste a Pokémon Showdown replay URL (or `.html` log paste, or up to three URLs for a BO3 match) → get a per-turn decision review that uses the existing `CalculateDamageUseCase` to score the moves played vs counterfactual lines.

#### M11a — Replay parser (backend, no UI)

- New package `infrastructure/replay/` with `ShowdownReplayParser` + `ReplayHttpClient` (port `ReplayParser` and `ReplaySource` in `application/port`).
- Parses the public Showdown protocol log: `|move|`, `|switch|`, `|-damage|`, `|-heal|`, `|-status|`, `|-boost|`, `|-weather|`, `|-fieldstart|`, `|-fieldend|`, `|-sidestart|`, `|-sideend|`, `|faint|`, `|win|`, `|tie|`.
- Output domain type `ReplayTimeline` = ordered list of `ReplayTurn { number, sideA, sideB, events[], boardStateAtStart }`. `boardStateAtStart` captures HP, status, stat boosts, weather, terrain, screens, tailwind for both sides.
- Endpoint `POST /api/v1/replay/parse` → returns the timeline DTO (controller in `web/`, DTO mapping kept clean per ArchUnit rules).
- Tests: golden-set fixtures committed under `backend/src/test/resources/replays/`; jqwik property tests on event ordering invariants (faint always follows the damage event that brought HP to 0; turn numbers are strictly increasing; etc.); ArchUnit unaffected.
- **Reference replays the user supplied** (commit the saved `.log` of each, plus the parsed-timeline snapshot, as fixtures):
  - Single game (Reg M-A): `https://replay.pokemonshowdown.com/gen9championsvgc2026regma-2593988469-t3cctf2g51jrek1gjpfiul2337uyqylpw`
  - BO3 game 1: `https://replay.pokemonshowdown.com/gen9championsvgc2026regmabo3-2586638266-n4pe8e2dvfi211ry6l9a79u2p9xet9npw`
  - BO3 game 2: `https://replay.pokemonshowdown.com/gen9championsvgc2026regmabo3-2586642583-yuoauq1ul4hs885nnbmosx3ru9m1r4epw`
- Save each replay's raw protocol log via `?log` (Showdown's documented log endpoint) at fixture-creation time so the parser tests run fully offline; the `ReplayHttpClient` is exercised separately by an integration test guarded by `@Tag("net")`.

#### M11b — Counterfactual evaluator (backend)

- New use case `EvaluateReplayDecisionsUseCase` consuming a `ReplayTimeline`.
- For each turn: rebuild `CombatantCommand` for all four active Pokémon from `boardStateAtStart`, invoke `CalculateDamageUseCase` for the move actually picked **and for every legal alternative move pair** the active mons could have selected.
- Score each line with a configurable weighted objective: expected damage dealt − expected damage taken, plus KO/faint bonuses. Flag the played line as ✓ optimal / ◐ acceptable / ✗ suboptimal.
- Endpoint `POST /api/v1/replay/evaluate` (request: a parsed timeline, or an ordered list of timelines for BO3 mode; response: list of `TurnReview { played, ranked alternatives, delta, narrative }` plus, for BO3 input, inter-game adaptation flags such as "opponent re-led X after losing G1" or "user changed win condition").
- Coverage gates apply (≥85% on `domain` and `application`).
- BO3 chaining: the two BO3 reference replays must round-trip as a *linked pair* and surface at least one adaptation flag, mirroring the existing BO3 Notebook (`Bo3Notebook.tsx`) so the autopsy can later feed BO3 adjustment guidance.

#### M11c — Frontend Replay Autopsy page (`/replay`)

- New route + feature slice `frontend/src/features/replay/`.
- Input area accepts **one URL** (single-game) **or up to three URLs** (BO3 — auto-detect from the `regmabo3` slug); pasted raw logs also accepted. Calls `/parse` then `/evaluate`.
- Page renders a turn-by-turn timeline; each turn card shows the played pair, top-3 alternatives with delta bars, and a one-sentence narrative ("Tailwind+Moonblast: +14% est. win equity vs played Protect+Moonblast").
- Reuses `DamageBar`, `RollHeatmap`, `SpriteBadge` from the calculator slice.
- Click any move row → opens that exact matchup in `/calc` with state pre-filled via the existing URL-share codec.
- Tests: parser snapshot fixtures, unit tests on the evaluator's scoring function, RTL test that a sample timeline renders the expected number of turn cards.

#### Verification (M11)

Backend:
```
cd backend && ./mvnw spotless:apply && ./mvnw verify
```

Frontend:
```
cd frontend && pnpm lint && pnpm typecheck && pnpm test
```

End-to-end using the three user-supplied reference replays:
1. Single Reg-MA replay (`...regma-2593988469...`) → timeline renders all turns; at least one turn shows a non-empty alternative list; clicking any move row opens `/calc` pre-filled.
2. BO3 pair (`...regmabo3-2586638266...` then `...regmabo3-2586642583...`) → both games render in sequence; at least one inter-game adaptation flag is surfaced.

---

### M12 — Multi-Threat Spread Optimizer

**Goal:** generalise `OptimizeDefensiveSpreadService` from "minimise KO chance vs *one* attacker" to "minimise total expected HP loss vs a *list* of attackers", subject to the existing 66 SP cap and offensive-stat constraints.

#### Backend

- New use case `OptimizeAgainstThreatsUseCase` in `application/usecase/`. Reuses the existing single-target service in a loop and aggregates with a configurable objective: `WORST_CASE_KO`, `EXPECTED_DAMAGE_SUM`, `SURVIVE_ALL`.
- New endpoint `POST /api/v1/calc/optimize-against-threats` with request `{ defender, threats: AttackerCommand[], goal, field, sideConditions }`. Response: best `DefenseSpreadCandidate` plus per-threat KO chances for transparency.
- Property tests: result must satisfy SP cap (≤ 66); for the `EXPECTED_DAMAGE_SUM` goal, the multi-threat result's average damage taken must be ≤ the single-threat optimum's average across the same threat list.

#### Frontend

- Extend `SpreadOptimizerPanel.tsx` with a "Multi-threat" tab.
- New session store `frontend/src/features/calculator/store/usePinnedThreatsStore.ts` modelled on `useCompareStore` — but pins *attackers* instead of defenders (max 4). Apply the EMPTY-array selector pattern documented in `CLAUDE.md` to avoid the Zustand re-render bug.
- "Add current attacker as threat" button mirrors the existing "Pin current defender" affordance.
- Threats list editable: remove threat, edit move per threat, edit item/ability per threat.
- Submit calls the new endpoint and shows the resulting spread plus a small per-threat damage table.

#### Verification (M12)

Backend + frontend full verification gates as above. End-to-end: pin 4 distinct meta attackers, run optimizer, confirm SP totals ≤ 66 and per-threat damage shown.

---

### M13 — Threat Matrix (team vs team)

**Goal:** paste two pokepastes (or use stored team), see a 6×6 damage heatmap; rows = your team, columns = opponent. Each cell = best move's min%/KO% in the active direction (toggle attack/defend). Click → opens that matchup in `/calc`. Hover → full 16-roll distribution.

#### Backend

- New use case `BuildThreatMatrixUseCase` consuming two team imports + a field. Internally calls `CalculateDamageUseCase` for each (attacker, defender, move) triple and picks the cell-best move for each ordered pair.
- Endpoint `POST /api/v1/matchup/matrix` returning `MatrixCell[][]`.
- Performance budget: 6×6×4-moves×2-directions = 288 calc calls; must complete <500ms server-side. Add a service-level test asserting the budget on a representative reg-MA fixture.

#### Frontend

- New route `/matchup` + feature slice `frontend/src/features/matchup/`.
- Two pokepaste-paste inputs at the top (reuse `ImportController` + existing import modal logic).
- Grid renders cells coloured by KO band (`< 35%`, `35–50%`, `50–80%`, OHKO range, guaranteed OHKO) — palette must be colorblind-safe and meet AA contrast (verify via `web-design-guidelines` skill).
- Toggle: "Damage I deal" vs "Damage I take" flips the matrix.
- Speed-tier strip rendered along both axes (reuse `SpeedTierRibbon`).
- Click any cell → opens matchup in `/calc` via URL-share codec.
- Tests: store unit tests, RTL on the grid (hover → tooltip with rolls), snapshot on a fixture pair of teams.

#### Verification (M13)

Backend + frontend full verification gates. End-to-end: import two real reg-MA pastes, scan grid, click a cell, confirm `/calc` opens with correct attacker/defender/move/field.

---

## Critical files (per milestone)

**M11a / M11b**
- `backend/.../infrastructure/replay/{ShowdownReplayParser,ReplayHttpClient}.java`
- `backend/.../application/port/{ReplaySource,ReplayParser}.java`
- `backend/.../application/usecase/EvaluateReplayDecisionsUseCase.java`
- `backend/.../web/controller/ReplayController.java` + DTOs
- `backend/src/test/resources/replays/*.log` (golden fixtures from the three reference replays)

**M11c**
- `frontend/src/features/replay/{api,components,store,hooks}/`
- `frontend/src/pages/ReplayPage.tsx`
- App router entry under `App.tsx`

**M12**
- `backend/.../application/usecase/OptimizeAgainstThreatsUseCase.java`
- `backend/.../web/controller/CalcOptimizerController.java` (extend, not replace)
- `frontend/src/features/calculator/components/SpreadOptimizerPanel.tsx` (extend)
- `frontend/src/features/calculator/store/usePinnedThreatsStore.ts`

**M13**
- `backend/.../application/usecase/BuildThreatMatrixUseCase.java`
- `backend/.../web/controller/MatchupMatrixController.java` + DTOs
- `frontend/src/features/matchup/{api,components,store}/`
- `frontend/src/pages/MatchupPage.tsx`

---

## Ready-to-paste phase prompts

**Prompt M11a — Replay parser**
```
Execute Milestone M11a from PLAN.md's Sub-project 3 (Meta Intelligence Suite).
Branch from develop as m11a-replay-parser. TDD first — fetch the three
reference replays' raw protocol logs (append `?log` to each URL — Showdown's
documented log endpoint) and commit them under
backend/src/test/resources/replays/ as:
  single-regma-2593988469.log
  bo3-game1-2586638266.log
  bo3-game2-2586642583.log
Source URLs:
  https://replay.pokemonshowdown.com/gen9championsvgc2026regma-2593988469-t3cctf2g51jrek1gjpfiul2337uyqylpw
  https://replay.pokemonshowdown.com/gen9championsvgc2026regmabo3-2586638266-n4pe8e2dvfi211ry6l9a79u2p9xet9npw
  https://replay.pokemonshowdown.com/gen9championsvgc2026regmabo3-2586642583-yuoauq1ul4hs885nnbmosx3ru9m1r4epw
Write the parser test against these fixtures before the parser. Build
infrastructure/replay/ShowdownReplayParser plus a ReplayHttpClient behind a
ReplayParser port in application/port. Add ReplayController at
POST /api/v1/replay/parse returning a ReplayTimeline DTO; map domain → DTO at
the web boundary (ArchUnit must stay green: no Spring/Jackson in domain).
Run ./mvnw spotless:apply then ./mvnw verify until green. Conventional Commits
per concern. Push and open a PR targeting develop. Stop.
```

**Prompt M11b — Replay evaluator**
```
Execute Milestone M11b from PLAN.md. Branch from develop as
m11b-replay-evaluator after M11a is merged. TDD. Add
EvaluateReplayDecisionsUseCase that, for each ReplayTurn, rebuilds
CombatantCommand for the four active mons and calls CalculateDamageUseCase
across every legal move pair. Score with a configurable weighted objective
(damage dealt − damage taken, plus KO/faint bonuses). The use case must
accept either a single ReplayTimeline or an ordered list (BO3 mode) and
emit inter-game adaptation flags ("opponent re-led X after losing G1",
"user changed win condition") for the BO3 reference replays
(2586638266 → 2586642583). Add POST /api/v1/replay/evaluate. Maintain ≥85%
JaCoCo coverage on domain+application. ArchUnit must stay green. Run full
backend verification, push, open PR targeting develop, stop.
```

**Prompt M11c — Replay Autopsy frontend**
```
Execute Milestone M11c from PLAN.md. Branch from develop as
m11c-replay-autopsy after M11b is merged. TDD. Build feature slice
frontend/src/features/replay/ and a /replay route. Input area accepts one
URL (single-game) or up to three URLs (BO3 — auto-detect from the
`regmabo3` slug); pasted raw logs also accepted. Calls /api/v1/replay/parse
then /api/v1/replay/evaluate. Render per-turn cards with played pair, top-3
alternatives, delta bars, one-line narrative. Reuse DamageBar, RollHeatmap,
SpriteBadge. Each row links to /calc via the existing URL-share codec. E2E
with the three reference replays:
  single: ...regma-2593988469...
  bo3 g1: ...regmabo3-2586638266...
  bo3 g2: ...regmabo3-2586642583...
Skills per commit: impeccable → vercel-react-best-practices →
vercel-composition-patterns → web-design-guidelines → polish. Run
pnpm lint && pnpm typecheck && pnpm test. Open PR targeting develop, stop.
```

**Prompt M12 — Multi-threat spread optimizer**
```
Execute Milestone M12 from PLAN.md. Branch from develop as
m12-multi-threat-optimizer. TDD. Backend: add OptimizeAgainstThreatsUseCase
reusing OptimizeDefensiveSpreadService internally; configurable goal
(WORST_CASE_KO | EXPECTED_DAMAGE_SUM | SURVIVE_ALL). Endpoint
POST /api/v1/calc/optimize-against-threats. Property test: result respects
the 66 SP cap and dominates the single-threat optimum on average. Frontend:
extend SpreadOptimizerPanel with a Multi-threat tab plus a
usePinnedThreatsStore mirroring useCompareStore (apply the EMPTY-array
selector pattern documented in CLAUDE.md to avoid the Zustand re-render bug).
Run full verification both sides. Open PR targeting develop, stop.
```

**Prompt M13 — Threat Matrix**
```
Execute Milestone M13 from PLAN.md. Branch from develop as m13-threat-matrix.
TDD. Backend: BuildThreatMatrixUseCase + POST /api/v1/matchup/matrix.
Service-level test asserts <500ms on a 6×6 reg-MA fixture. Frontend: new
/matchup route, two pokepaste inputs (reuse ImportController), a 6×6 grid
with KO-band colouring (colorblind-safe, AA contrast — verify via
web-design-guidelines), direction toggle, SpeedTierRibbon along both axes,
click → /calc via URL-share codec. Skills per FE commit: impeccable →
vercel-react-best-practices → web-design-guidelines → polish. Run full
verification both sides. Open PR targeting develop, stop.
```

After each implementation branch is ready to publish:
```
Use github:yeet to publish the branch and open a PR targeting develop. Do not merge it.
```

---

## Sub-project 5 — Product Intelligence & Retention Suite (v1.4)

### Context

VGCenter has moved beyond a single damage calculator into a competitive prep workspace. The current Session 0 branch adds `/prep`, a Team Prep page that connects saved teams, threat watchlists, local notes, prep checks, and a credited Meta Feed. The remaining v1.4 work turns that static workspace into a data-backed product loop: import teams, compare against the current meta, patch weaknesses, review replays, and return with less setup friction.

This sub-project is intentionally split into **7 sessions**. Each session is its own branch from `develop`, its own PR targeting `develop`, and must stop after the PR is opened. Do not mix sessions in one branch except **Session 0**, which intentionally includes the already-implemented Team Prep feature plus this roadmap documentation in one commit.

### Source-crediting policy

Any feature using external tournament or usage data must visibly credit the source in-product and in docs. Do not make uncredited meta, usage, popularity, or tournament claims.

Required source metadata for generated snapshots:

- `sourceName`
- `sourceUrl`
- `checkedOn`
- `filterPolicy`

Approved v1.4 sources:

- **Limitless Tournament Platform** — completed VGC Regulation M-A online tournaments from the last 4 weeks, filtered to tournaments with at least 40 players: `https://play.limitlesstcg.com/tournaments/completed?game=VGC&format=M-A&platform=all&type=online&time=4weeks`
- **Pikalytics Champions Tournaments** — Pokemon Champions tournament usage data: `https://www.pikalytics.com/pokedex/championstournaments`

### Sessions

#### Session 0 — Publish Team Prep + roadmap

Current branch: `feature/vgcenter-product-enhancements`.

Scope:

- Ship `/prep` Team Prep workspace with readiness summary, speed posture, type tags, prep checks, threat ranking, persistent watchlist, local notebook, and credited Meta Feed.
- Ship calculator FieldPanel active modifier summary and Reset Field action.
- Update `PLAN.md`, `AGENTS.md`, and `CLAUDE.md` with this v1.4 roadmap.
- Keep `AGENTS.md` and `CLAUDE.md` byte-identical.

Verification:

```bash
pnpm --dir frontend lint
pnpm --dir frontend typecheck
pnpm --dir frontend test
pnpm --dir frontend build
cmp AGENTS.md CLAUDE.md
rg "Sub-project 5|Session 1|Limitless|Pikalytics" PLAN.md AGENTS.md CLAUDE.md
```

Stop after opening the PR targeting `develop`.

#### Session 1 — Meta data pipeline

Goal: replace the static frontend Meta Feed snapshot with a generated, credited snapshot pipeline.

Implementation:

- Add a script under `scripts/` that fetches/parses Limitless and Pikalytics into a checked-in JSON snapshot.
- Limitless parser filters completed online VGC Regulation M-A tournaments to `players >= 40`.
- Pikalytics parser captures top usage entries plus enough metadata for future meta-set defaults.
- Add generated snapshot under a stable repo path such as `frontend/src/features/prep/data/metaSnapshot.generated.json` or `backend/src/main/resources/data/meta/` if backend serving is chosen.
- Preserve source names, URLs, `checkedOn`, and filter policy in the snapshot.
- Team Prep consumes the generated snapshot and still renders visible source credits.

Acceptance:

- Parser/filter unit tests cover `players >= 40` inclusion/exclusion.
- UI tests prove source credits remain visible.
- No uncredited usage claims.

#### Session 2 — Meta-aware defaults

Goal: reduce setup friction by applying common tournament sets explicitly.

Implementation:

- Add explicit `Use Meta Set` / `Apply Common Moves` action to calculator Pokemon setup.
- Use credited Pikalytics-derived common moves, items, and abilities.
- Never silently overwrite user-edited builds; applying a meta set must be a deliberate user action.
- Show the source credit near the action.

Acceptance:

- Tests prove meta-set application fills expected move/item/ability fields.
- Tests prove user edits are not overwritten without explicit action.
- Source credit is visible in the UI.

#### Session 3 — Threat Matrix

Goal: full team-vs-team heatmap.

Implementation:

- Backend `BuildThreatMatrixUseCase` and `POST /api/v1/matchup/matrix`.
- Frontend `/matchup` route with two team inputs and a 6x6 matrix.
- Toggle: `damage I deal` / `damage I take`.
- Cell click opens `/calc` via existing URL-share codec.
- Cell hover/focus shows full roll distribution.
- Cell colors are colorblind-safe and meet AA contrast.

Acceptance:

- Backend service test asserts representative 6x6 matrix under 500ms.
- Frontend tests cover grid rendering, direction toggle, tooltip, and click-through.
- `web-design-guidelines` pass confirms accessibility and contrast.

#### Session 4 — Counterfinder / Patch My Team

Goal: turn meta and matchup data into explainable team repair suggestions.

Implementation:

- Inputs: saved team, watched threats, meta usage snapshot, and calculator/optimizer evidence.
- Outputs: defensive spread suggestions, tech move suggestions, and replacement candidates.
- Every recommendation includes a concise reason and the evidence source.
- Avoid opaque AI-like scores without explanation.

Acceptance:

- Tests cover recommendation ranking and reason strings.
- UI distinguishes spread, move, and replacement recommendations.
- Recommendations link back to exact calc or optimizer evidence where possible.

#### Session 5 — Replay findings into Team Prep

Goal: connect Replay Autopsy to ongoing prep notes.

Implementation:

- Add `Save to Team Prep` action in Replay Autopsy.
- Persist replay findings in the Team Prep notebook.
- Supported finding types: turning point, missed KO, risky line, adaptation note.
- Team Prep renders saved replay findings as prep cards.

Acceptance:

- Tests cover persistence and rendering.
- Saved findings include replay source/turn reference.
- Team Prep remains useful without any saved replay findings.

#### Session 6 — Onboarding and UX polish

Goal: make the app easier to adopt and faster to use repeatedly.

Implementation:

- First-run path: import Pokepaste -> Team Prep -> Preview Coach -> Calc.
- Mobile single-matchup calculator flow.
- Keyboard shortcuts for search, swap sides, reset field, copy report.
- Final design/accessibility pass.

Acceptance:

- First-run and mobile flows covered by component tests.
- Shortcuts documented in UI.
- Full frontend verification passes.

### Required frontend skill sequence

For any v1.4 frontend session, use:

`impeccable -> vercel-react-best-practices -> vercel-composition-patterns -> web-design-guidelines -> polish`

### Ready-to-paste session prompts

#### Session 0 prompt

```text
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

#### Session 1 prompt

```text
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

#### Session 2 prompt

```text
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

#### Session 3 prompt

```text
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

#### Session 4 prompt

```text
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

#### Session 5 prompt

```text
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

#### Session 6 prompt

```text
Read AGENTS.md, CLAUDE.md, and PLAN.md Sub-project 5. Execute Session 6: Onboarding and UX polish.

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
