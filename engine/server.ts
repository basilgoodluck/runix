import app from "./app";
import { connectStore } from "./state/store";
import { containerPool } from "./execution/sandbox/container.pool";
import { allWorkers } from "./execution/queue/job.worker";
import { jobQueue } from "./execution/queue/job.queue";
import { config } from "./config";
import logger from "./lib/logger";
import type { Server } from "http";

let server: Server;

async function shutdown(signal: string): Promise<void> {
  logger.warn(`Received ${signal} — shutting down gracefully`);

  await Promise.all(allWorkers.map((w) => w.close()));
  await jobQueue.close();
  await containerPool.shutdown();

  if (server) {
    server.close((err) => {
      if (err) {
        logger.error("Error closing HTTP server", err);
        process.exit(1);
      }
      logger.info("HTTP server closed");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  } else {
    process.exit(0);
  }
}

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception — shutting down", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection — shutting down", reason);
  process.exit(1);
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

async function bootstrap(): Promise<void> {
  try {
    if (config.env === "production" && !config.tlsEnabled) {
      throw new Error("TLS must be enabled in production");
    }

    await connectStore();
    logger.info("State store connected");

    await containerPool.initialize();
    logger.info("Container pool ready");

    logger.info(`Job workers started (${allWorkers.length} workers)`);

    server = app.listen(config.port, () => {
      logger.info(`Runix executor running on port ${config.port} [${config.env}]`);
    });

    server.on("error", (err) => {
      logger.error("HTTP server error", err);
      process.exit(1);
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
}

bootstrap();