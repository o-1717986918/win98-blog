#!/usr/bin/env bash
# Run on the Linux host as an unprivileged deploy user. No Node, Git or Docker access is needed.
set -euo pipefail
umask 022

die() { printf 'static release: %s\n' "$*" >&2; exit 1; }

root="${WIN98_STATIC_ROOT:-/opt/win98-static}"
[[ "$root" == /* ]] || die 'WIN98_STATIC_ROOT must be an absolute path'
[[ -d "$root" ]] || die "release root does not exist: $root"
root="$(realpath -e -- "$root")"
[[ "$root" != / && "$root" != /opt && "$root" != /home ]] || die 'release root is too broad'
[[ "${WIN98_STATIC_HEALTH_URL:-}" != off || "$root" == /tmp/* ]] || die 'HTTP smoke may only be disabled in temporary tests'

incoming="$root/incoming"
releases="$root/releases"
[[ ! -L "$incoming" && ! -L "$releases" ]] || die 'release directories may not be symlinks'
mkdir -p -- "$incoming" "$releases"
exec 9>"$root/release.lock"
flock -n 9 || die 'another release operation is running'

valid_id() { [[ "$1" =~ ^[0-9a-f]{40}-[0-9]+-[0-9]+$ ]]; }
current_id() {
  if [[ ! -e "$releases/current" && ! -L "$releases/current" ]]; then return 0; fi
  [[ -L "$releases/current" ]] || die 'current is not a symlink'
  local id
  id="$(readlink -- "$releases/current")"
  if ! valid_id "$id" || [[ ! -d "$releases/$id/site" ]]; then
    die 'current points to an invalid release'
  fi
  printf '%s' "$id"
}
required_files() {
  local site="$1"
  local file
  for file in index.html 404.html archive/index.html pagefind/pagefind.js rss.xml sitemap-index.xml; do
    [[ -f "$site/$file" && ! -L "$site/$file" ]] || die "missing release file: $file"
  done
  grep -Fq 'href="https://win98.site/"' "$site/index.html" || die 'home canonical is not https://win98.site/'
}
activate() {
  local id="$1"
  local link="$releases/.current-next-$id-$$"
  ln -s -- "$id" "$link"
  mv -Tf -- "$link" "$releases/current"
}
restore() {
  local old="$1"
  if [[ -n "$old" ]]; then activate "$old"
  else rm -f -- "$releases/current"
  fi
}
smoke() {
  local id="$1"
  local url="${WIN98_STATIC_HEALTH_URL:-http://127.0.0.1:18099}"
  [[ "$url" != off ]] || return 0
  url="${url%/}"
  [[ "$(curl --noproxy '*' --fail --silent --show-error --max-time 10 "$url/release-id.txt")" == "$id" ]] || return 1
  local path
  for path in / /archive/ /pagefind/pagefind.js /rss.xml /sitemap-index.xml; do
    curl --noproxy '*' --fail --silent --show-error --max-time 10 --output /dev/null "$url$path" || return 1
  done
}

command="${1:-}"
case "$command" in
  install)
    [[ "$#" == 3 ]] || die 'usage: release.sh install <commit-run-attempt> <archive-sha256>'
    id="$2"
    digest="$3"
    valid_id "$id" || die 'invalid release ID'
    [[ "$digest" =~ ^[0-9a-f]{64}$ ]] || die 'invalid SHA-256'
    archive="$incoming/$id.tar.gz"
    [[ -f "$archive" && ! -L "$archive" ]] || die 'archive is missing or is a symlink'
    [[ ! -e "$releases/$id" && ! -L "$releases/$id" ]] || die 'release ID already exists'
    [[ "$(stat -c %s -- "$archive")" -le 200000000 ]] || die 'archive exceeds 200 MB limit'
    actual="$(sha256sum -- "$archive" | cut -d ' ' -f 1)"
    [[ "$actual" == "$digest" ]] || die 'archive SHA-256 mismatch'

    prepare="$releases/.prepare-$id"
    [[ ! -e "$prepare" && ! -L "$prepare" ]] || die 'prepare path already exists'
    mkdir -p -- "$prepare/site"
    cleanup() {
      if [[ -d "$prepare" && "$prepare" == "$releases"/.prepare-* ]]; then rm -rf -- "$prepare"; fi
    }
    trap cleanup EXIT
    tar --quoting-style=literal -tzf "$archive" > "$prepare/members.txt" || die 'archive cannot be listed'
    while IFS= read -r member; do
      [[ "$member" == . || "$member" == ./ ]] && continue
      [[ "$member" == ./* && "$member" != *\\* ]] || die 'unsafe archive path'
      name="${member#./}"
      name="${name%/}"
      [[ -n "$name" ]] || die 'empty archive path'
      IFS='/' read -r -a parts <<< "$name"
      for part in "${parts[@]}"; do
        [[ -n "$part" && "$part" != . && "$part" != .. ]] || die 'unsafe archive path segment'
      done
    done < "$prepare/members.txt"
    tar -xzf "$archive" -C "$prepare/site" --no-same-owner --no-same-permissions || die 'archive extraction failed'
    [[ -z "$(find "$prepare/site" ! -type f ! -type d -print -quit)" ]] || die 'archive contains a non-file entry'
    [[ "$(du -sb "$prepare/site" | cut -f 1)" -le 400000000 ]] || die 'extracted site exceeds 400 MB limit'
    find "$prepare/site" -type d -exec chmod 755 -- {} +
    find "$prepare/site" -type f -exec chmod 644 -- {} +
    required_files "$prepare/site"
    printf '%s\n' "$id" > "$prepare/site/release-id.txt"

    old="$(current_id)"
    printf '{"releaseId":"%s","archiveSha256":"%s","createdAt":"%s"}\n' \
      "$id" "$digest" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$prepare/release.json"
    rm -f -- "$prepare/members.txt"
    mv -- "$prepare" "$releases/$id"
    trap - EXIT
    activate "$id"
    if ! smoke "$id"; then
      restore "$old"
      die "HTTP smoke failed; ${old:+restored $old; }release $id remains for inspection"
    fi
    if ! printf '%s\n' "$id" > "$releases/$id/accepted"; then
      restore "$old"
      die "could not mark release $id as accepted"
    fi
    # Only accepted assets enter the public fallback path for already-open pages.
    for asset_dir in _astro pagefind; do
      if [[ -d "$releases/$id/site/$asset_dir" ]]; then
        if ! { mkdir -p -- "$releases/shared/$asset_dir" &&
          cp -an -- "$releases/$id/site/$asset_dir/." "$releases/shared/$asset_dir/"; }; then
          printf 'static release: warning: could not retain %s assets for old open pages\n' "$asset_dir" >&2
        fi
      fi
    done
    printf 'Installed %s (previous: %s)\n' "$id" "${old:-none}"
    ;;
  rollback)
    [[ "$#" == 2 ]] || die 'usage: release.sh rollback <release-id>'
    id="$2"
    valid_id "$id" || die 'invalid release ID'
    [[ -f "$releases/$id/release.json" && -f "$releases/$id/accepted" ]] || die 'target is not an accepted release'
    [[ "$(< "$releases/$id/accepted")" == "$id" ]] || die 'target acceptance marker mismatch'
    required_files "$releases/$id/site"
    [[ "$(< "$releases/$id/site/release-id.txt")" == "$id" ]] || die 'target release marker mismatch'
    old="$(current_id)"
    [[ "$old" != "$id" ]] || die 'target release is already current'
    activate "$id"
    if ! smoke "$id"; then
      restore "$old"
      die "rollback smoke failed; ${old:+restored $old}"
    fi
    printf 'Rolled back to %s (previous: %s)\n' "$id" "${old:-none}"
    ;;
  status)
    [[ "$#" == 1 ]] || die 'usage: release.sh status'
    printf 'Current: %s\n' "$(current_id)"
    printf 'Accepted releases:\n'
    for candidate in "$releases"/*; do
      [[ -d "$candidate" && ! -L "$candidate" && -f "$candidate/accepted" ]] || continue
      printf '%s\n' "${candidate##*/}"
    done | sort
    ;;
  *) die 'usage: release.sh {install <release-id> <sha256>|rollback <release-id>|status}' ;;
esac
