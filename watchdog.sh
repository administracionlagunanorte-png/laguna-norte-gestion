#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="file:/home/z/my-project/db/custom.db"

start_server() {
  npx next start -p 3000 -H 0.0.0.0 &
  SERVER_PID=$!
  echo "[$(date)] Server started with PID $SERVER_PID"
  sleep 3
  echo $SERVER_PID > /tmp/next-server-pid
}

start_server

while true; do
  if ! ps -p $(cat /tmp/next-server-pid 2>/dev/null || echo 99999) > /dev/null 2>&1; then
    echo "[$(date)] Server died, restarting..."
    start_server
  fi
  curl -s -o /dev/null http://localhost:3000/ 2>/dev/null
  sleep 5
done
