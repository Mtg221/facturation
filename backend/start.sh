#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Running production seed..."
npx ts-node --transpile-only prisma/seed-prod.ts

echo "Starting application..."
exec node dist/main
