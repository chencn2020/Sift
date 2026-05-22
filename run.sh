#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

echo ""
echo "  Sift sidecar running on 127.0.0.1 with dev token: dev-token"
echo "  In another terminal run: npm install && npm run dev"
echo ""

python -m backend.siftd.main --host 127.0.0.1 --port 43170 --dev-token dev-token
