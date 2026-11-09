#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ci_repo_dir="$PWD"
ci_install_dir="$(mktemp -d "${TMPDIR:-/tmp}/qwerty-install.XXXXXX")"
trap 'rm -rf "$ci_install_dir"' EXIT
cp package.json "$ci_install_dir/package.json"
# Preserve the committed lockfile, versions and integrity hashes. Only the
# external installation copy uses official npm download locations.
sed 's#https://registry.npmmirror.com/#https://registry.npmjs.org/#g' yarn.lock > "$ci_install_dir/yarn.lock"
export PATH="$ci_repo_dir/node_modules/.bin:$PATH"
HUSKY=0 yarn --cwd "$ci_install_dir" install \
  --frozen-lockfile --non-interactive --registry https://registry.npmjs.org \
  --modules-folder "$ci_repo_dir/node_modules" \
  --cache-folder "${YARN_CACHE_FOLDER:-$ci_repo_dir/.yarn/cache}"
