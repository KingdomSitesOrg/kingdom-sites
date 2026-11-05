#!/usr/bin/env bash
# The film's one Blender queue. Every Blender run in this film goes through here,
# so the Mac never has more than two Blender processes from this film at once.
#
#   film/ai-productivity/blender/render.sh <script.py> [args for the script...]
#
# Runs:  blender -b -P <script.py> -- [args...]
#
# Waits for a free slot (two slots). Gives up after AIP_MAX_WAIT seconds
# (default 240) with exit code 75, so a caller inside a ten-minute tool call can
# try again instead of timing out. A slot whose owner has died is reclaimed.
# Refuses to start while the Remotion film render holds its lock (.locks/remotion),
# because Blender and the Remotion render must never run at the same time.
#
# Keep each call short (a chunk of frames, a few minutes), so the queue stays fair.

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILM="$(cd "$HERE/.." && pwd)"
LOCKS="$FILM/.locks"
SLOTS="${AIP_BLENDER_SLOTS:-2}"
MAX_WAIT="${AIP_MAX_WAIT:-240}"
BLENDER="${BLENDER:-/opt/homebrew/bin/blender}"

if [ $# -lt 1 ]; then
  echo "usage: render.sh <script.py> [args...]" >&2
  exit 2
fi
SCRIPT="$1"
shift

mkdir -p "$LOCKS"
SLOT=""

release() {
  if [ -n "$SLOT" ] && [ -d "$SLOT" ]; then
    rm -rf "$SLOT"
  fi
}
trap release EXIT
trap 'release; exit 130' INT TERM

reclaim_if_stale() {
  local d="$1" pid age now mtime
  [ -d "$d" ] || return 0
  pid="$(cat "$d/pid" 2>/dev/null || true)"
  if [ -n "$pid" ]; then
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -rf "$d"
    fi
  else
    # a slot with no pid file yet is only stale if it is older than 30 seconds
    now="$(date +%s)"
    mtime="$(stat -f %m "$d" 2>/dev/null || echo "$now")"
    age=$((now - mtime))
    if [ "$age" -gt 30 ]; then
      rm -rf "$d"
    fi
  fi
}

remotion_busy() {
  local d="$LOCKS/remotion" pid
  [ -d "$d" ] || return 1
  pid="$(cat "$d/pid" 2>/dev/null || true)"
  if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
    rm -rf "$d"
    return 1
  fi
  return 0
}

waited=0
while :; do
  if ! remotion_busy; then
    for i in $(seq 0 $((SLOTS - 1))); do
      d="$LOCKS/blender-slot$i"
      reclaim_if_stale "$d"
      if mkdir "$d" 2>/dev/null; then
        echo $$ > "$d/pid"
        echo "$SCRIPT $*" > "$d/job"
        SLOT="$d"
        break
      fi
    done
  fi
  [ -n "$SLOT" ] && break
  if [ "$waited" -ge "$MAX_WAIT" ]; then
    echo "render.sh: no free Blender slot after ${MAX_WAIT}s; try again" >&2
    exit 75
  fi
  sleep 3
  waited=$((waited + 3))
done

echo "render.sh: $(basename "$SLOT") after ${waited}s wait: $SCRIPT $*" >&2
"$BLENDER" -b -P "$SCRIPT" -- "$@"
status=$?
exit $status
