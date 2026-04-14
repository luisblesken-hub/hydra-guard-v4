#!/usr/bin/env bash
# deploy-remote.sh — läuft in Claude's Linux-Sandbox
# Committed alle lokalen Änderungen und pusht auf main → Vercel deployt automatisch.
#
# Voraussetzung: .env.deploy im Projekt-Root mit:
#   GITHUB_TOKEN=ghp_xxxxxxxxxxxx
#
# Usage:
#   bash scripts/deploy-remote.sh "feat: invoice flow initial"

set -e

COMMIT_MSG="${1:-chore: autonomous update}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.deploy"

if [ ! -f "$ENV_FILE" ]; then
  echo "✗ .env.deploy nicht gefunden. Anlegen mit: GITHUB_TOKEN=ghp_xxx"
  exit 1
fi

source "$ENV_FILE"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "✗ GITHUB_TOKEN nicht in .env.deploy gesetzt"
  exit 1
fi

cd "$ROOT"

# TypeScript-Check vor Commit
echo "→ TypeScript check..."
npx --yes tsc --noEmit && echo "✓ tsc OK" || { echo "✗ TypeScript errors — abort"; exit 1; }

# Git-Status
echo ""
echo "→ Änderungen:"
git status --short

# Commit
git add -A
git commit -m "$COMMIT_MSG" || { echo "Nichts zu committen."; exit 0; }

# Push mit Token
REPO_URL="https://${GITHUB_TOKEN}@github.com/luisblesken-hub/hydra-guard-v4.git"
echo ""
echo "→ Push auf main..."
git push "$REPO_URL" main
echo "✓ Gepusht → Vercel deployt automatisch"
echo "  Status: https://vercel.com/dashboard"
