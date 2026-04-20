import Redis from "ioredis";
import { config } from "@/config";
import logger from "@/lib/logger";

// ── TLS for production ────────────────────────────────────────────────────────
const tlsConfig =
  config.env === "production"
    ? {
        tls: {
          rejectUnauthorized: true, // enforce valid cert — never disable this
        },
      }
    : {};

export const store = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  lazyConnect: true,
  ...tlsConfig,

  // ── Retry strategy ──────────────────────────────────────────────────
  retryStrategy: (times) => {
    if (times > 5) {
      logger.error("Redis: max retries reached, giving up");
      return null; // stop retrying — triggers unhandledRejection → process exits
    }
    const delay = Math.min(times * 200, 2000);
    logger.warn(`Redis: retrying connection in ${delay}ms (attempt ${times})`);
    return delay;
  },

  // ── Command timeout ─────────────────────────────────────────────────
  commandTimeout: 5_000, // fail fast if Redis hangs
});

store.on("connect", () => logger.info("Redis: connected"));
store.on("error", (err) => logger.error(`Redis error: ${err.message}`));

export async function connectStore(): Promise<void> {
  await store.connect();
}