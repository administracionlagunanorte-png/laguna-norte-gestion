#!/bin/bash
cd /home/z/my-project
export NODE_ENV=production
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export PORT=3000

while true; do
  echo "[$(date)] Starting server..."
  node server.mjs
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..."
  sleep 2
done
