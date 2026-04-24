#!/bin/sh
set -e

npx prisma db push --skip-generate

node dist/engine/server.js