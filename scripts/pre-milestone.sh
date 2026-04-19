#!/usr/bin/env bash
# Run before starting a Codex/Claude session on a new milestone.
# Ensures you're on a clean `develop`, pulled to latest, with a green baseline.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

git checkout develop
git pull --ff-only

# Block only on pending changes to TRACKED files; untracked files (notes,
# scratch dirs, new tooling) are fine.
if ! git diff-index --quiet HEAD --; then
  echo "❌ tracked files have uncommitted changes. Commit or stash first."
  git status --short
  exit 1
fi

echo "--- recent commits ---"
git log --oneline -10

echo "--- baseline check ---"
if [ -x backend/mvnw ]; then
  (cd backend && ./mvnw -q test)
else
  echo "(no backend yet)"
fi
if [ -f frontend/package.json ]; then
  (cd frontend && pnpm test)
else
  echo "(no frontend yet)"
fi

echo "✅ ready to start milestone"
