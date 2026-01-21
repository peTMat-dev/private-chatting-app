#!/usr/bin/env bash
set -e

echo "Starting CLIENT and SERVER..."

# Start server
(
  cd server
  pnpm install
  pnpm run dev
) &

# Start client
(
  cd client
  pnpm install
  pnpm run dev
) &

wait
