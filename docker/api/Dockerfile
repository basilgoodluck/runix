FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache docker-cli

COPY package*.json ./
RUN npm ci --frozen-lockfile --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 2345

CMD ["node", "dist/engine/server.js"]