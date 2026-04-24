import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? "2345", 10),
  logLevel: process.env.LOG_LEVEL ?? "info",
  env: process.env.NODE_ENV ?? "development",
  tlsEnabled: process.env.TLS_ENABLED === "true",
  apiKey: process.env.API_KEY ?? "",

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "",
  },

  redis: {
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
  },

  execution: {
    defaultTimeoutMs: parseInt(process.env.DEFAULT_TIMEOUT_MS ?? "10000", 10),
    maxTimeoutMs: parseInt(process.env.MAX_TIMEOUT_MS ?? "30000", 10),
  },

  receipt: {
    privateKey: process.env.RECEIPT_PRIVATE_KEY ?? "",
    deterministicCache: process.env.DETERMINISTIC_CACHE === "true",
  },
  
  circle: {
    apiKey: process.env.CIRCLE_API_KEY ?? "",
    entitySecret: process.env.CIRCLE_ENTITY_SECRET ?? "",
    walletSetId: process.env.CIRCLE_WALLET_SET_ID ?? "",
    systemWalletId: process.env.CIRCLE_WALLET_ID ?? "",
    systemWalletAddress: process.env.CIRCLE_WALLET_ADDRESS ?? "",
  }
};