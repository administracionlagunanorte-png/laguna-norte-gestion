#!/bin/bash
export NODE_ENV=production
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
exec npx next start -H 0.0.0.0 -p 3000
