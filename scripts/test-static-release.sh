#!/usr/bin/env bash
# Runs on Linux in the production build job; uses only temporary local files.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
work="$(mktemp -d -t win98-static-test.XXXXXXXX)"
cleanup() {
  [[ "$work" == /tmp/win98-static-test.* ]] && rm -rf -- "$work"
}
trap cleanup EXIT

root="$work/root"
mkdir -p "$root/incoming" "$root/releases"
export WIN98_STATIC_ROOT="$root"
export WIN98_STATIC_HEALTH_URL=off

make_archive() {
  local id="$1" marker="$2"
  local site="$work/site-$marker"
  mkdir -p "$site/archive" "$site/pagefind" "$site/_astro"
  printf '<link rel="canonical" href="https://win98.site/">%s\n' "$marker" > "$site/index.html"
  printf 'not found\n' > "$site/404.html"
  printf 'archive\n' > "$site/archive/index.html"
  printf 'pagefind\n' > "$site/pagefind/pagefind.js"
  printf 'rss\n' > "$site/rss.xml"
  printf 'sitemap\n' > "$site/sitemap-index.xml"
  printf '%s\n' "$marker" > "$site/_astro/$marker.js"
  tar -C "$site" -czf "$root/incoming/$id.tar.gz" .
  sha256sum "$root/incoming/$id.tar.gz" | cut -d ' ' -f 1
}

one="$(printf 'a%.0s' {1..40})-1-1"
two="$(printf 'b%.0s' {1..40})-2-1"
bad="$(printf 'c%.0s' {1..40})-3-1"
linked="$(printf 'd%.0s' {1..40})-4-1"
unhealthy="$(printf 'e%.0s' {1..40})-5-1"
unhealthy_first="$(printf 'f%.0s' {1..40})-0-1"
first_hash="$(make_archive "$unhealthy_first" unhealthy-first)"
if WIN98_STATIC_HEALTH_URL=http://127.0.0.1:9 bash "$repo/scripts/server-static-release.sh" install "$unhealthy_first" "$first_hash"; then
  echo 'Unhealthy first release was accepted' >&2
  exit 1
fi
[[ ! -e "$root/releases/current" && ! -L "$root/releases/current" ]]
[[ ! -e "$root/releases/shared/_astro/unhealthy-first.js" ]]

one_hash="$(make_archive "$one" first)"
bash "$repo/scripts/server-static-release.sh" install "$one" "$one_hash"
[[ "$(readlink "$root/releases/current")" == "$one" ]]

two_hash="$(make_archive "$two" second)"
bash "$repo/scripts/server-static-release.sh" install "$two" "$two_hash"
[[ "$(readlink "$root/releases/current")" == "$two" ]]
[[ -f "$root/releases/shared/_astro/first.js" ]]
[[ -f "$root/releases/shared/_astro/second.js" ]]
[[ ! -f "$root/releases/$two/site/_astro/first.js" ]]

make_archive "$bad" broken > /dev/null
if bash "$repo/scripts/server-static-release.sh" install "$bad" "$(printf '0%.0s' {1..64})"; then
  echo 'Invalid checksum was accepted' >&2
  exit 1
fi
[[ "$(readlink "$root/releases/current")" == "$two" ]]

make_archive "$linked" linked > /dev/null
ln -s /etc/passwd "$work/site-linked/leak"
tar -C "$work/site-linked" -czf "$root/incoming/$linked.tar.gz" .
linked_hash="$(sha256sum "$root/incoming/$linked.tar.gz" | cut -d ' ' -f 1)"
if bash "$repo/scripts/server-static-release.sh" install "$linked" "$linked_hash"; then
  echo 'Symlink archive was accepted' >&2
  exit 1
fi
[[ "$(readlink "$root/releases/current")" == "$two" ]]

unhealthy_hash="$(make_archive "$unhealthy" unhealthy)"
if WIN98_STATIC_HEALTH_URL=http://127.0.0.1:9 bash "$repo/scripts/server-static-release.sh" install "$unhealthy" "$unhealthy_hash"; then
  echo 'Unhealthy release was accepted' >&2
  exit 1
fi
[[ "$(readlink "$root/releases/current")" == "$two" ]]
[[ ! -e "$root/releases/shared/_astro/unhealthy.js" ]]
[[ ! -e "$root/releases/$unhealthy/accepted" ]]
if bash "$repo/scripts/server-static-release.sh" rollback "$unhealthy"; then
  echo 'Unaccepted release was eligible for rollback' >&2
  exit 1
fi
[[ "$(readlink "$root/releases/current")" == "$two" ]]

bash "$repo/scripts/server-static-release.sh" rollback "$one"
[[ "$(readlink "$root/releases/current")" == "$one" ]]
[[ -f "$root/releases/shared/_astro/second.js" ]]
echo 'Static release install, checksum/symlink rejection, smoke restoration, asset retention and rollback passed.'
