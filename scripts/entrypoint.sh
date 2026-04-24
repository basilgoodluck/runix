#!/bin/sh
set -e

npx prisma db push

node dist/engine/server.js