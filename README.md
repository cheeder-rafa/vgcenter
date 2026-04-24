# VGCenter

VGCenter is a hub of tools for competitive Pokemon VGC players. Sub-project 1 is the Regulation M-A damage calculator for Pokemon Champions.

## Status

The v1 calculator is at milestone M10:

- `backend/` serves the Regulation M-A API for damage calculation, dataset lookup, and Showdown/Pokepaste imports.
- `frontend/` is a React calculator UI with live API-backed results and importer modals.
- `/preview` is the Preview Coach shell for the next VGC team-preview workflow.
- Dockerfiles exist for both applications, and root `docker-compose.yml` runs the full stack.
- GitHub Actions verify backend, frontend, and a `main`-targeted Docker smoke check.

## Prerequisites

- Java 21
- Node.js 20+
- pnpm 9
- Docker Desktop or Docker Engine with Compose

## Repository Layout

- `backend/` — Spring Boot 3.5 / Java 21 API
- `frontend/` — React 18 / Vite / TypeScript SPA
- `.github/workflows/` — CI definitions
- `docs/smoke-test.md` — five canonical browser smoke scenarios

## Local Verification

Backend:

```bash
cd backend
./mvnw spotless:apply
./mvnw -B verify
```

Frontend:

```bash
cd frontend
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

## Local Run

Backend:

```bash
cd backend
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

The Vite dev server proxies `/api/*` requests to `http://localhost:8080`, so the backend can stay on its default port while you use the browser at `http://localhost:5173`.

## Calculator UX

The current calculator flow is species-first and fully reactive:

- Choose a Regulation M-A species for each side to auto-populate types, base stats, legal abilities, and legal moves.
- Manually changing a species resets the build for that side back to a fresh default set of item, nature, SP spread, moves, and derived stats for the newly selected Pokemon.
- Damage updates automatically for all four move slots as species, moves, stats, abilities, items, status, or field inputs change. There is no manual "Calculate Damage" button.
- Each move shows the full damage range, HP percentages, KO odds, lethal or safe roll counts, and the 16-roll spread at the same time without a separate heatmap panel.
- Each side exposes a `Current HP` input so full-HP and low-HP interactions such as Multiscale and Blaze/Torrent-style thresholds are represented in the live calculation.
- Copied or expanded damage text uses `Mega <species>` for Mega forms, and when relevant attack or defense stages are active it adds the matching SP context to the readout.
- Weather, terrain, and room effects are optional. Leaving all field modifiers inactive is a valid battle state and still produces damage results.
- Side-based field controls include Tailwind for each combatant so the speed order ribbon reflects common doubles speed manipulation.
- Direct item and ability damage interactions now include type-boosting held items, resist berries, Levitate-style immunities, Mold Breaker bypasses, and direct defensive modifiers such as Thick Fat, Heatproof, Dry Skin, and Water Bubble.
- Level is locked to 50. The UI shows `Base -> SP -> Final` so the final stat build stays traceable while the backend remains the source of truth for stat calculation.

## Preview Coach

Preview Coach lives at `/preview` and replaces the rejected Gameplan Lab experiment. Lead Lab compares two saved player leads into all 15 opposing lead pairs from the opponent rail. It uses backend calculator damage evidence only; it does not simulate turn order or multi-turn play.

Lead Lab reports KO pressure, 2HKO pressure, double-up pressure, incoming danger, speed comparison, must-react labels, and turn-1 notes for each opponent pair.

Planned Preview Coach phases:

- Lead Lab: compare selected leads into all 15 opponent lead pairs using calculator damage evidence.
- Team Preview Coach: recommend bring-4 and lead-order plans with pressure, risk, and win-condition explanations.
- BO3 Notebook: track revealed information and adjustment guidance across a best-of-3 set.

## Sprite Assets

Phase E bundles calculator sprites under `frontend/public/sprites/`. To populate
them locally, run the one-off fetcher from the repo root:

```bash
node scripts/fetch-sprites.mjs
```

The script reads the Regulation M-A roster from
`backend/src/main/resources/data/regulation-m-a/`, skips any sprite PNGs already
present in `frontend/public/sprites/`, and downloads official-artwork PNGs for
species/forms that PokéAPI exposes.

If the script logs missing entries, place the maintainer-sourced Legends Z-A
Mega artwork in `frontend/public/sprites/` as `${speciesId}.png` (for example
`dragonite-mega.png` and `meganium-mega.png`). Leave
`frontend/public/sprites/_unknown.png` in place as the frontend fallback for
missing or broken sprite URLs, and review the generated PNGs before committing
them.

## Docker Run

From the repo root:

```bash
docker compose up --build
```

Endpoints:

- Frontend: `http://localhost:4173`
- Backend API: `http://localhost:8080/api/v1`
- Backend health: `http://localhost:8080/actuator/health`

The frontend container serves the built SPA through nginx and proxies `/api/*` traffic to the backend service inside Compose.

## Public Beta Hosting

For a simple hosted beta where friends can try the calculator and send feedback:

- deploy the backend as a Render web service
- deploy the frontend as a Render static site
- set `VITE_API_BASE_URL` for the frontend build
- set `VGCENTER_CORS_ALLOWED_ORIGINS` on the backend
- set `VITE_FEEDBACK_URL` to your Tally or Google Form

Detailed steps live in [docs/hosting-beta.md](docs/hosting-beta.md).

## API Surface

- `POST /api/v1/damage/calculate`
- `GET /api/v1/dataset/pokedex?regulation=M-A`
- `GET /api/v1/dataset/moves?regulation=M-A`
- `GET /api/v1/dataset/abilities?regulation=M-A`
- `GET /api/v1/dataset/items?regulation=M-A`
- `GET /api/v1/dataset/natures?regulation=M-A`
- `POST /api/v1/dataset/build-stats` (Regulation M-A, level 50 locked server-side)
- `POST /api/v1/import/showdown`
- `POST /api/v1/import/pokepaste`

Validation failures return RFC 7807 Problem Details with a `violations` map keyed by request field.

## Browser Smoke Check

Use the five scenarios in `docs/smoke-test.md` before shipping a release candidate. They are designed to be entered through the browser UI and cross-checked against Pokemon Showdown's calculator.
