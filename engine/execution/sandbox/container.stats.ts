import type Docker from "dockerode";
import type { JobResources } from "../types";

export async function collectStats(container: Docker.Container): Promise<JobResources> {
  const raw = await container.stats({ stream: false }) as DockerStats;

  const cpuDelta = raw.cpu_stats.cpu_usage.total_usage - raw.precpu_stats.cpu_usage.total_usage;
  const systemDelta = raw.cpu_stats.system_cpu_usage - raw.precpu_stats.system_cpu_usage;
  const numCpus = raw.cpu_stats.online_cpus ?? raw.cpu_stats.cpu_usage.percpu_usage?.length ?? 1;
  const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;

  const memoryUsedBytes = raw.memory_stats.usage - (raw.memory_stats.stats?.cache ?? 0);
  const memoryLimitBytes = raw.memory_stats.limit;
  const memoryPercent = memoryLimitBytes > 0 ? (memoryUsedBytes / memoryLimitBytes) * 100 : 0;

  return {
    cpuPercent: parseFloat(cpuPercent.toFixed(2)),
    memoryUsedBytes,
    memoryLimitBytes,
    memoryPercent: parseFloat(memoryPercent.toFixed(2)),
  };
}

// ---------- Docker stats shape (partial — only what we need) ----------

interface DockerStats {
  cpu_stats: {
    cpu_usage: {
      total_usage: number;
      percpu_usage?: number[];
    };
    system_cpu_usage: number;
    online_cpus?: number;
  };
  precpu_stats: {
    cpu_usage: {
      total_usage: number;
    };
    system_cpu_usage: number;
  };
  memory_stats: {
    usage: number;
    limit: number;
    stats?: {
      cache: number;
    };
  };
}