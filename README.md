# VGCenter

VGCenter is a hub of tools for competitive Pokemon VGC players. Sub-project 1 is the Regulation M-A damage calculator, implemented milestone by milestone from `PLAN.md`.

## Current Status

M7 is in place:

- `backend/` is a Spring Boot 3.5 / Java 21 / Maven project with Spotless, Checkstyle, JaCoCo, ArchUnit, jqwik, and a passing application smoke test.
- `frontend/` is a React 18 / Vite / TypeScript / Tailwind / Zustand app with ESLint, Prettier, Vitest, and Testing Library.
- CI workflows exist for backend and frontend verification.
- Dockerfiles exist for each app, with a root `docker-compose.yml` to build both services.
- The backend now exposes the Regulation M-A web API for damage calculation, dataset lookup, and team imports from Showdown paste text or Pokepaste URLs.

## API Surface

- `POST /api/v1/damage/calculate` accepts a full battle scenario payload and returns 16 damage rolls, min/max damage, percentage ranges, and a KO summary.
- `GET /api/v1/dataset/pokedex?regulation=M-A` returns the legal roster, including Mega forms, base stats, legal abilities, and legal moves.
- `GET /api/v1/dataset/moves?regulation=M-A`
- `GET /api/v1/dataset/abilities?regulation=M-A`
- `GET /api/v1/dataset/items?regulation=M-A`
- `GET /api/v1/dataset/natures?regulation=M-A`
- `POST /api/v1/import/showdown` accepts `{ "text": "..." }` and returns a parsed `team` array with species, import metadata, SP spreads, derived battle stats, and move ids.
- `POST /api/v1/import/pokepaste` accepts `{ "url": "https://pokepast.es/..." }` and returns the same parsed `team` payload after fetching the raw paste.
- Validation failures return RFC 7807 Problem Details with a `violations` map keyed by request field.

## Repository Layout

- `backend/` — Spring Boot API and domain/application/infrastructure/web package skeleton.
- `frontend/` — calculator SPA scaffold and feature folders.
- `.github/workflows/` — backend and frontend CI.

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

Docker:

```bash
docker compose up --build
```
