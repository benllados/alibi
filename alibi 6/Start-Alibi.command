#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Alibi needs Node.js 20 or newer. Install Node.js, then open this file again."
  read -r -p "Press Enter to close."
  exit 1
fi
(sleep 2; open "http://localhost:${PORT:-3000}") &
node server.mjs
read -r -p "Press Enter to close."
