# VGCenter

VGCenter is a hub of tools for competitive Pokemon VGC players. Sub-project 1 is the Regulation M-A damage calculator for Pokemon Champions.

## Status

The v1 calculator is at milestone M10:

- `backend/` serves the Regulation M-A API for damage calculation, dataset lookup, and Showdown/Pokepaste imports.
- `frontend/` is a React calculator UI with live API-backed results and importer modals.
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
