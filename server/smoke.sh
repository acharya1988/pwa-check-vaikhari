#!/usr/bin/env bash
set -euo pipefail
BASE=${BASE:-http://localhost:4000}

echo "Health:" && curl -sS "$BASE/healthz" | jq . || true
echo "Unauth /me should be 401:" && curl -sS -i "$BASE/api/me" | head -n 1 || true

