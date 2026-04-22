# Public Beta Hosting

This repo is ready for a small hosted beta with:

- a Render web service for the Spring Boot backend
- a Render static site for the React frontend
- a hosted feedback form linked from the calculator header

## 1. Prep the repo

Run the required checks before deploying:

```bash
cd backend
./mvnw spotless:apply
./mvnw -B verify

cd ../frontend
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

The frontend now supports two optional build-time variables:

- `VITE_API_BASE_URL`
- `VITE_FEEDBACK_URL`

Copy [`frontend/.env.example`](../frontend/.env.example) if you want to test them locally.

## 2. Create the feedback form

Use Tally or Google Forms with these fields:

- name or Discord handle
- what they were trying to calculate
- what went wrong
- screenshot URL (optional)
- severity (`cosmetic`, `annoying`, `wrong result`, `blocker`)
- browser/device

Keep the form URL ready for `VITE_FEEDBACK_URL`.

## 3. Deploy the backend on Render

Create a **Web Service**:

- Root directory: `backend`
- Environment: `Docker`
- Health check path: `/actuator/health`

Set this environment variable after you know the frontend URL:

```text
VGCENTER_CORS_ALLOWED_ORIGINS=https://your-frontend-name.onrender.com
```

If you later attach a custom frontend domain, add that exact origin instead.

After deploy, confirm:

- `https://your-backend-name.onrender.com/actuator/health` returns `UP`

## 4. Deploy the frontend on Render

Create a **Static Site**:

- Root directory: `frontend`
- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- Publish directory: `dist`

Set these environment variables:

```text
VITE_API_BASE_URL=https://your-backend-name.onrender.com/api/v1
VITE_FEEDBACK_URL=https://your-feedback-form-url
```

Add an SPA rewrite:

- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

## 5. Smoke test the hosted site

Open the frontend URL and verify:

1. Species, moves, items, abilities, and natures load successfully.
2. Damage results appear after choosing valid attacker, defender, and moves.
3. Showdown import works.
4. The `Send feedback` link opens the form in a new tab.
5. Browser DevTools show no CORS failures on `/api/v1/*`.

## 6. Share it and collect feedback

Send friends:

- the frontend URL
- a short request to try 2–3 real matchups
- the feedback form URL

Recommended GitHub issue labels for triage:

- `beta-feedback`
- `bug`
- `ux`
- `calc-correctness`
- `import`

## 7. Lowest-ops fallback

If you do not want separate managed services yet, the existing Docker Compose setup can still be deployed on a single VPS:

```bash
docker compose up --build -d
```

That path keeps the current nginx-to-backend proxy and does not need `VITE_API_BASE_URL`.
