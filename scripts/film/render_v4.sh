#!/bin/bash
# Renders both aspects into staging folders, resuming from finished frames;
# at most one attempt plus two retries per aspect. One Blender at a time.
cd "$(dirname "$0")/../.."
B=/Applications/Blender.app/Contents/MacOS/Blender
for asp in desktop phone; do
  for attempt in 1 2 3; do
    echo "=== $asp attempt $attempt $(date +%T)"
    $B -b -P scripts/film/laptop_film.py -- --mode seq --aspect $asp --frames 1-96 --samples 160 --noise 0.015 --quality 82 --out design/film-renders/v4/$asp 2>&1 | grep --line-buffered -E "FRAME|SKIP|Traceback|Error"
    n=$(ls design/film-renders/v4/$asp/*.jpg 2>/dev/null | wc -l | tr -d ' ')
    echo "=== $asp has $n frames"
    [ "$n" -ge 96 ] && break
  done
done
echo "=== ALL DONE $(date +%T)"
