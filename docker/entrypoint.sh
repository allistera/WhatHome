#!/bin/sh
set -e

echo "Applying database migrations..."
node_modules/.bin/tsx server/db/migrate.ts

echo "Starting application..."
exec node .output/server/index.mjs
