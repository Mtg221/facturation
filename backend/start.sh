#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Running production seed..."
node prisma/seed-prod.js

echo "Starting application..."
exec node dist/main
