#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export PORT=3000
export HOSTNAME=0.0.0.0

# Trap signals to prevent termination
trap '' SIGTERM SIGINT SIGHUP

exec npx next start -p 3000 -H 0.0.0.0
