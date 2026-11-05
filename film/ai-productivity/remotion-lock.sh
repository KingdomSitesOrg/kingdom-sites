#!/usr/bin/env bash
# Run a full Remotion render with the film's Remotion lock held, so no Blender run
# from blender/render.sh starts while it renders (they must never overlap).
#
#   film/ai-productivity/remotion-lock.sh <command> [args...]
#
# Waits until no Blender slot is busy, takes .locks/remotion, runs the command,
# releases on any exit. Gives up after AIP_MAX_WAIT seconds (default 300), exit 75.
# Remotion stills and the review page do not need this; full renders do.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCKS="$HERE/.locks"
MAX_WAIT="${AIP_MAX_WAIT:-300}"
mkdir -p "$LOCKS"
LOCK="$LOCKS/remotion"
HELD=""

release() { [ -n "$HELD" ] && rm -rf "$LOCK"; }
trap release EXIT
trap 'release; exit 130' INT TERM

blender_busy() {
  local d pid
  for d in "$LOCKS"/blender-slot*; do
    [ -d "$d" ] || continue
    pid="$(cat "$d/pid" 2>/dev/null || true)"
    if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then rm -rf "$d"; continue; fi
    return 0
  done
  return 1
}

waited=0
while :; do
  if [ -d "$LOCK" ]; then
    pid="$(cat "$LOCK/pid" 2>/dev/null || true)"
    if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then rm -rf "$LOCK"; fi
  fi
  if ! blender_busy && mkdir "$LOCK" 2>/dev/null; then
    echo $$ > "$LOCK/pid"
    HELD=1
    # a Blender run may have slipped in between the check and the lock: wait it out
    while blender_busy; do sleep 3; done
    break
  fi
  if [ "$waited" -ge "$MAX_WAIT" ]; then
    echo "remotion-lock.sh: Blender still busy after ${MAX_WAIT}s; try again" >&2
    exit 75
  fi
  sleep 3
  waited=$((waited + 3))
done

"$@"
