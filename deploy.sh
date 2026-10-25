#!/usr/bin/env bash
set -euo pipefail

pnpm check
pnpm build --base /guitar-tools/

repository_url="https://github.com/balajeerc/guitar-tools.git"
deploy_dir="$(mktemp -d /tmp/guitar-tools-pages.XXXXXX)"
trap 'rm -rf "$deploy_dir"' EXIT

if git ls-remote --exit-code --heads "$repository_url" gh-pages >/dev/null 2>&1; then
  git clone --quiet --depth 1 --single-branch --branch gh-pages "$repository_url" "$deploy_dir"
  git -C "$deploy_dir" rm -r --quiet --ignore-unmatch .
else
  git -C "$deploy_dir" init --quiet --initial-branch=gh-pages
  git -C "$deploy_dir" remote add origin "$repository_url"
fi

cp -R dist/. "$deploy_dir/"
cp LICENSE "$deploy_dir/"
touch "$deploy_dir/.nojekyll"
git -C "$deploy_dir" add --all

if git -C "$deploy_dir" diff --cached --quiet; then
  echo "The published build is already up to date."
  exit 0
fi

git -C "$deploy_dir" \
  -c user.name="$(git log -1 --format='%an')" \
  -c user.email="$(git log -1 --format='%ae')" \
  commit --quiet -m "Deploy $(git rev-parse --short HEAD)"
git -C "$deploy_dir" -c credential.helper= -c 'credential.helper=!gh auth git-credential' \
  push origin HEAD:gh-pages
