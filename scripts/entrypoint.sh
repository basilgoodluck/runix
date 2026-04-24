#!/bin/sh
set -e

npx prisma migrate deploy --schema=./prisma/schema.prisma

node dist/engine/server.js