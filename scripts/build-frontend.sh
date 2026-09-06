#!/usr/bin/env bash
#
# Build the React frontend and place it where Django serves it (backend/dist).
# Run this after any frontend change, and as part of the production deploy.
#
#   ./scripts/build-frontend.sh
#
set -euo pipefail

# Resolve repo root from this script's location (works from anywhere).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$ROOT/frontend"
DIST_SRC="$FRONTEND/dist"
DIST_DEST="$ROOT/backend/dist"

echo "▸ Installing frontend dependencies…"
cd "$FRONTEND"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "▸ Building frontend…"
npm run build

echo "▸ Copying build into backend/dist…"
rm -rf "$DIST_DEST"
cp -r "$DIST_SRC" "$DIST_DEST"

echo "▸ Stripping source maps (not needed in production)…"
find "$DIST_DEST" -name '*.map' -delete

echo "✓ Done. Django will serve the SPA from: $DIST_DEST"
du -sh "$DIST_DEST"
