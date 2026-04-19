# GitHub Repository Setup

These are the **one-time manual steps** to configure the GitHub side of the workflow described in `AGENTS.md` / `CLAUDE.md`. They enforce the `feature → develop → main` flow and keep AI agents (and humans) from accidentally shipping to production.

## 1. Create the repo and push

```bash
cd /home/cheeder/dev/vgcenter-3
git init
git add -A
git commit -m "chore: initial repo scaffold"
gh repo create vgcenter-3 --private --source=. --remote=origin --push
```

Or create the repo in the GitHub UI and push manually.

## 2. Create the long-lived branches

```bash
# main was created on the first push.
git checkout -b develop
git push -u origin develop
```

Set `develop` as the default branch for PRs (keep `main` as the repo default so releases land there):

GitHub UI → **Settings → General → Default branch → `develop`**.

This way, when someone opens a PR they target `develop` by default, and only deliberate release PRs target `main`.

## 3. Branch protection rules

GitHub UI → **Settings → Branches → Add rule**. Configure one rule per protected branch.

### Rule: `main` (production)

- **Require a pull request before merging**: ✅
  - **Require approvals**: 1 (or more if you add collaborators)
  - **Dismiss stale approvals when new commits are pushed**: ✅
- **Require status checks to pass**:
  - `backend-ci`
  - `frontend-ci`
  - `main-ci-smoke` (added in a later milestone when Docker smoke tests land)
  - **Require branches to be up to date before merging**: ✅
- **Require linear history**: ✅ (forces squash or rebase merges — no merge commits)
- **Require conversation resolution before merging**: ✅
- **Restrict who can push to matching branches**: add only the human maintainer(s). This is the rule that blocks AI agents from pushing.
- **Do not allow bypassing the above settings**: ✅
- **Allow force pushes**: ❌
- **Allow deletions**: ❌

### Rule: `develop` (staging / integration)

- **Require a pull request before merging**: ✅
  - Require approvals: 1 (can be self-approval for solo projects; increase if collaborators join).
- **Require status checks to pass**:
  - `backend-ci`
  - `frontend-ci`
  - **Require branches to be up to date before merging**: ✅
- **Require linear history**: ✅
- **Require conversation resolution before merging**: ✅
- **Allow force pushes**: ❌
- **Allow deletions**: ❌

### Feature branches (`feature/*`, `m*-*`, `codex/*`, `claude/*`, `release/*`, `hotfix/*`)

No branch protection needed — they're short-lived and live-edited.

## 4. Repository settings

GitHub UI → **Settings → General → Pull Requests**:

- **Allow merge commits**: ❌
- **Allow squash merging**: ✅ (default)
  - **Default commit message**: *Pull request title and description*
- **Allow rebase merging**: ✅ (use for release/hotfix back-merges if desired)
- **Always suggest updating pull request branches**: ✅
- **Automatically delete head branches**: ✅

GitHub UI → **Settings → Actions → General → Workflow permissions**:

- **Read and write permissions** (required for CI to upload artifacts and later push container images / GitHub Releases).

## 5. CI workflows (created in milestone M0)

`.github/workflows/backend-ci.yml` — runs on PRs targeting `develop` or `main`:

```yaml
name: backend-ci
on:
  pull_request:
    branches: [develop, main]
    paths: [backend/**, .github/workflows/backend-ci.yml]
  push:
    branches: [develop, main]
jobs:
  verify:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: "21", cache: maven }
      - run: ./mvnw -B verify
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: jacoco-report
          path: backend/target/site/jacoco/
```

`.github/workflows/frontend-ci.yml`:

```yaml
name: frontend-ci
on:
  pull_request:
    branches: [develop, main]
    paths: [frontend/**, .github/workflows/frontend-ci.yml]
  push:
    branches: [develop, main]
jobs:
  test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: frontend } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: pnpm, cache-dependency-path: frontend/pnpm-lock.yaml }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test --run
```

`.github/workflows/main-ci-smoke.yml` (added at M10, when Docker is ready) — only on PRs targeting `main`:

```yaml
name: main-ci-smoke
on:
  pull_request:
    branches: [main]
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose build
      - run: docker compose up -d
      - run: curl --fail --retry 20 --retry-delay 3 http://localhost:8080/actuator/health
      - run: docker compose down -v
```

`.github/workflows/release.yml` (added at M10) — fires on tags pushed to `main`:

```yaml
name: release
on:
  push:
    tags: ["v*.*.*"]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: "21", cache: maven }
      - run: cd backend && ./mvnw -B package -DskipTests
      - run: docker build -t vgcenter-backend:${{ github.ref_name }} backend/
      - run: docker build -t vgcenter-frontend:${{ github.ref_name }} frontend/
      - uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

## 6. Environments (optional but recommended)

GitHub UI → **Settings → Environments**:

- Create `staging` — automatically deployed from `develop` (wire up later when you pick a host).
- Create `production` — deployed from `main` tags; require manual approval before the job runs.

Environment protection rules are a second safety net even if branch protection is misconfigured.

## 7. First release workflow (once M10 is done)

```bash
git checkout develop && git pull --ff-only
git checkout -b release/v0.1.0
# bump version in pom.xml and package.json, update CHANGELOG
git commit -am "chore(release): v0.1.0"
git push -u origin release/v0.1.0
# open PR release/v0.1.0 -> main
# after merge:
git checkout main && git pull
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
# release.yml runs and creates the GitHub release.
# back-merge release branch into develop so any last fixes propagate:
git checkout develop && git pull
git merge --no-ff release/v0.1.0 && git push
```

## 8. Minimal `CHANGELOG.md`

Keep `CHANGELOG.md` at the repo root following the [Keep a Changelog](https://keepachangelog.com/) convention. Each release PR adds a new section.

```
# Changelog

## [Unreleased]
### Added
- ...

## [0.1.0] - 2026-MM-DD
### Added
- Damage calculator v1
```
