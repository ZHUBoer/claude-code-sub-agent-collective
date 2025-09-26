#!/usr/bin/env bash
set -euo pipefail
if [ -f package.json ]; then
  npm run lint:fix 2>/dev/null || pnpm run lint:fix 2>/dev/null || true
elif [ -f Cargo.toml ]; then
  cargo fmt 2>/dev/null || true
elif command -v black >/dev/null; then
  black . 2>/dev/null || true
elif command -v ruff >/dev/null; then
  ruff format . 2>/dev/null || true
fi
