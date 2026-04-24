#!/bin/sh
set -e

npx prisma migrate deploy
npx prisma migrate dev --name add-refresh-tokens-and-fix-relations

node dist/engine/server.js