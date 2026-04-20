import Docker from "dockerode";
import { DOCKER_CONFIG } from "./docker.config";
import { RUNTIME_IMAGES } from "./runtime.images";
import logger from "../../lib/logger";

const docker = new Docker();

export type SupportedRuntime = keyof typeof RUNTIME_IMAGES;

interface PooledContainer {
  container: Docker.Container;
  runtime: SupportedRuntime;
  status: "idle" | "busy";
}

const POOL_SIZE_PER_RUNTIME: number = parseInt(process.env["POOL_SIZE_PER_LANGUAGE"] ?? "1", 10);
const PULL_TIMEOUT_MS = 30_000;

export class ContainerPool {
  private pool: Map<SupportedRuntime, PooledContainer[]> = new Map();
  private waitQueue: Map<SupportedRuntime, Array<(c: PooledContainer | null) => void>> = new Map();

  async initialize(): Promise<void> {
    logger.info(`ContainerPool: initializing (${POOL_SIZE_PER_RUNTIME} per runtime)`);

    for (const runtime of Object.keys(RUNTIME_IMAGES) as SupportedRuntime[]) {
      this.pool.set(runtime, []);
      this.waitQueue.set(runtime, []);

      for (let i = 0; i < POOL_SIZE_PER_RUNTIME; i++) {
        try {
          const pooled = await this.createPooledContainer(runtime, true);
          this.pool.get(runtime)!.push(pooled);
          logger.info(`ContainerPool: warmed container for [${runtime}]`);
        } catch (err: any) {
          logger.error(`ContainerPool: failed to warm [${runtime}], skipping — ${err.message}`);
        }
      }
    }

    logger.info("ContainerPool: ready");
  }

  async acquire(runtime: SupportedRuntime): Promise<PooledContainer> {
    const slot = this.pool.get(runtime)?.find((p) => p.status === "idle");

    if (slot) {
      slot.status = "busy";
      return slot;
    }

    logger.warn(`ContainerPool: no idle container for [${runtime}], queuing`);
    return new Promise((resolve, reject) => {
      this.waitQueue.get(runtime)!.push((c) => {
        if (c === null) reject(new Error(`No container available for [${runtime}] — replenishment failed`));
        else resolve(c);
      });
    });
  }

  async release(pooled: PooledContainer): Promise<void> {
    const { runtime } = pooled;
    const slots = this.pool.get(runtime) ?? [];
    const idx = slots.indexOf(pooled);
    if (idx !== -1) slots.splice(idx, 1);

    await pooled.container.kill({ Signal: "SIGKILL" }).catch(() => {});
    await pooled.container.remove({ force: true }).catch(() => {});

    try {
      const fresh = await this.createPooledContainer(runtime, false);
      const waiting = this.waitQueue.get(runtime) ?? [];

      if (waiting.length > 0) {
        const resolve = waiting.shift()!;
        fresh.status = "busy";
        slots.push(fresh);
        this.pool.set(runtime, slots);
        resolve(fresh);
      } else {
        fresh.status = "idle";
        slots.push(fresh);
        this.pool.set(runtime, slots);
      }

      logger.info(`ContainerPool: replenished container for [${runtime}]`);
    } catch (err: any) {
      logger.error(`ContainerPool: failed to replenish [${runtime}] — ${err.message}`);
      const waiting = this.waitQueue.get(runtime) ?? [];
      while (waiting.length > 0) waiting.shift()!(null);
    }
  }

  async shutdown(): Promise<void> {
    logger.info("ContainerPool: shutting down");
    for (const slots of this.pool.values()) {
      for (const pooled of slots) {
        await pooled.container.kill({ Signal: "SIGKILL" }).catch(() => {});
        await pooled.container.remove({ force: true }).catch(() => {});
      }
    }
    this.pool.clear();
  }

  private async createPooledContainer(runtime: SupportedRuntime, pull: boolean): Promise<PooledContainer> {
    const image = RUNTIME_IMAGES[runtime];
    if (!image) throw new Error(`No runtime image configured for: ${runtime}`);

    if (pull) await this.pullIfNeeded(image);

    const container = await docker.createContainer({
      Image: image,
      Cmd: ["sleep", "infinity"],
      AttachStdout: false,
      AttachStderr: false,
      NetworkDisabled: DOCKER_CONFIG.networkDisabled,
      HostConfig: {
        Memory: DOCKER_CONFIG.memory,
        MemorySwap: DOCKER_CONFIG.memorySwap,
        CpuPeriod: DOCKER_CONFIG.cpuPeriod,
        CpuQuota: DOCKER_CONFIG.cpuQuota,
        PidsLimit: DOCKER_CONFIG.pidsLimit,
        Privileged: DOCKER_CONFIG.privileged,
        CapDrop: DOCKER_CONFIG.capDrop,
        ReadonlyRootfs: DOCKER_CONFIG.readonlyRootfs,
        SecurityOpt: ["no-new-privileges:true"],
        Tmpfs: DOCKER_CONFIG.tmpfs,
      },
    });

    await container.start({});
    return { container, runtime, status: "idle" };
  }

  private pullIfNeeded(image: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Pull timed out after ${PULL_TIMEOUT_MS}ms for image: ${image}`));
      }, PULL_TIMEOUT_MS);

      docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
        if (err) { clearTimeout(timeout); return reject(err); }
        docker.modem.followProgress(stream, (err: Error | null) => {
          clearTimeout(timeout);
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }
}

export const containerPool = new ContainerPool();