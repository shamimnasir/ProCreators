#!/bin/sh
# Persist runtime-generated files on the /data volume.
# For each directory in the list (keep in sync with lib/generated-dirs.js), seed /data/<dir>
# from whatever the image shipped, then point <app>/public/<dir> at the volume.
set -e
APP_DIR="${APP_DIR:-/app}"
DATA_DIR="${DATA_DIR:-/data}"

DIRS="activity-books ai-video-studio ai-video-uploads checklists coloring-books ebooks flashcards generated guides journals library music-cache notion-templates planners presentations quizzes recipe-books story-reels story-reels-preview storybooks ugc-audio uploads video-editor voice-previews worksheets"

for d in $DIRS; do
  mkdir -p "$DATA_DIR/$d"
  if [ -d "$APP_DIR/public/$d" ] && [ ! -L "$APP_DIR/public/$d" ]; then
    cp -a -n "$APP_DIR/public/$d/." "$DATA_DIR/$d/" 2>/dev/null || true
    rm -rf "$APP_DIR/public/$d"
  fi
  ln -sfn "$DATA_DIR/$d" "$APP_DIR/public/$d"
done

mkdir -p "$APP_DIR/tmp"
[ "$#" -gt 0 ] || set -- node server.js
cd "$APP_DIR"
exec "$@"
