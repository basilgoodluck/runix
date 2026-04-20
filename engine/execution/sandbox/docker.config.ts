export const DOCKER_CONFIG = {
  memory: 128 * 1024 * 1024,
  memorySwap: 128 * 1024 * 1024,

  cpuPeriod: 100_000,
  cpuQuota: 50_000,

  pidsLimit: 32,

  networkDisabled: true,

  readonlyRootfs: true,

  privileged: false,
  capDrop: ["ALL"],
  noNewPrivileges: true,

  tmpfs: {
    "/tmp": "rw,noexec,nosuid,size=32m",
  },

  maxCodeBytes: 64 * 1024,
  maxStdinBytes: 16 * 1024,
};