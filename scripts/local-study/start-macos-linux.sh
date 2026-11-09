#!/bin/sh
set -eu
cd -- "$(dirname -- "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo 'Install Node.js LTS from https://nodejs.org/ first, then run this script again.'
  exit 1
fi
exec node ./server.cjs --open
