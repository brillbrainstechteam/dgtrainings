#!/bin/bash
# Publishes the latest build of the site on the VPS.
# Runs every minute from the dgtrainingscom user's crontab:
#   * * * * * /home/dgtrainingscom/deploy/vps-sync.sh
# GitHub Actions pushes each build to the `vps-dist` branch; this script copies it into the
# CloudPanel site folder whenever that branch changes. The repo is public, so no credentials needed.
set -euo pipefail
REPO=https://github.com/brillbrainstechteam/dgtrainings.git
BRANCH=vps-dist
WORK=/home/dgtrainingscom/deploy/$BRANCH
WEB=/home/dgtrainingscom/htdocs/dgtrainings.com
LOG=/home/dgtrainingscom/logs/deploy.log
STAMP=/home/dgtrainingscom/deploy/published.sha      # last build copied into the site folder

exec 9>/tmp/dgtrainings-deploy.lock
flock -n 9 || exit 0                                   # skip if the previous run is still going

remote=$(git ls-remote "$REPO" "refs/heads/$BRANCH" | cut -f1)
[ -n "$remote" ] || exit 0
published=$(cat "$STAMP" 2>/dev/null || true)
[ "$remote" = "$published" ] && exit 0                 # already live

[ -d "$WORK/.git" ] || git clone -q --depth 1 -b "$BRANCH" "$REPO" "$WORK"
git -C "$WORK" fetch -q --depth 1 origin "$BRANCH"
git -C "$WORK" reset -q --hard FETCH_HEAD
rsync -a --delete --exclude .git "$WORK"/ "$WEB"/
git -C "$WORK" rev-parse HEAD > "$STAMP"
echo "$(date -Is) deployed $(git -C "$WORK" log -1 --format='%h %s')" >> "$LOG"
