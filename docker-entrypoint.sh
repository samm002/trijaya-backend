#!/bin/bash

echo "Running deploy-entrypoint.sh..."

# Apply migrations
if ! npx prisma migrate deploy; then
  echo "Prisma migrations failed"
  exit 1
fi
echo "Prisma migration deploy success"

# Generate Prisma Client
if ! npx prisma generate; then
  echo "Prisma client generation failed"
  exit 1
fi
echo "Prisma client generate success"

exec "$@"