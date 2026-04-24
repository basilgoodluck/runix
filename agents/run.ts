import RunixClient from "@basilgoodluck/runix-sdk";

declare const process: {
  env: {
    RUNIX_API_KEY?: string;
  };
};

// ─── Config ───────────────────────────────────────────────────────────────────

const runix = new RunixClient({
  apiKey: process.env.RUNIX_API_KEY!,
});

// ─── Logger ───────────────────────────────────────────────────────────────────

const log = {
  info:    (msg: string) => console.log(`\x1b[36m[INFO ]\x1b[0m ${ts()} ${msg}`),
  ok:      (msg: string) => console.log(`\x1b[32m[OK   ]\x1b[0m ${ts()} ${msg}`),
  fail:    (msg: string) => console.log(`\x1b[31m[FAIL ]\x1b[0m ${ts()} ${msg}`),
  warn:    (msg: string) => console.log(`\x1b[33m[WARN ]\x1b[0m ${ts()} ${msg}`),
  divider: ()            => console.log(`\x1b[90m${"─".repeat(60)}\x1b[0m`),
};

const ts = () => new Date().toISOString().replace("T", " ").slice(0, 19);

// ─── Mock Tasks ───────────────────────────────────────────────────────────────

interface Task {
  name: string;
  runtime: "python" | "node" | "go";
  code: string;
}

const TASKS: Task[] = [
  {
    name: "fibonacci(10)",
    runtime: "python",
    code: `
def fib(n):
    a, b = 0, 1
    for _ in range(n): a, b = b, a + b
    return a
print(fib(10))
`.trim(),
  },
  {
    name: "reverse string",
    runtime: "node",
    code: `console.log("runix agent".split("").reverse().join(""))`,
  },
  {
    name: "sum 1..100",
    runtime: "python",
    code: `print(sum(range(1, 101)))`,
  },
  {
    name: "json parse + filter",
    runtime: "node",
    code: `
const data = [
  { id: 1, active: true,  val: 42 },
  { id: 2, active: false, val: 7  },
  { id: 3, active: true,  val: 99 },
];
const result = data.filter(d => d.active).map(d => d.val);
console.log(JSON.stringify(result));
`.trim(),
  },
  {
    name: "intentional error",
    runtime: "python",
    code: `print(1 / 0)`,  // ZeroDivisionError — tests FAIL path
  },
  {
    name: "bubble sort",
    runtime: "node",
    code: `
const arr = [64, 34, 25, 12, 22, 11, 90];
for (let i = 0; i < arr.length; i++)
  for (let j = 0; j < arr.length - i - 1; j++)
    if (arr[j] > arr[j+1]) [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
console.log(arr.join(", "));
`.trim(),
  },
  {
    name: "prime check 97",
    runtime: "python",
    code: `
n = 97
is_prime = n > 1 and all(n % i != 0 for i in range(2, int(n**0.5)+1))
print(f"{n} is {'prime' if is_prime else 'not prime'}")
`.trim(),
  },
  {
    name: "count words",
    runtime: "node",
    code: `
const text = "the quick brown fox jumps over the lazy dog";
const freq: Record<string, number> = {};
text.split(" ").forEach(w => freq[w] = (freq[w] ?? 0) + 1);
console.log(JSON.stringify(freq));
`.trim(),
  },
];

// ─── Run a single task ────────────────────────────────────────────────────────

async function runTask(task: Task) {
  log.divider();
  log.info(`Running task: "${task.name}" [${task.runtime}]`);

  try {
    const result = await runix.compute({
      runtime: task.runtime,
      code: task.code,
      timeout_ms: 10_000,
    });

    if (result.status === "error") {
      log.fail(`Task "${task.name}" exited non-zero`);
      if (result.stderr) console.log(`       stderr: ${result.stderr.trim()}`);
      return;
    }

    log.ok(`Task "${task.name}" done in ${result.duration_ms}ms | cost: $${result.cost_usd}`);
    if (result.stdout) console.log(`       stdout: ${result.stdout.trim()}`);
    if (result.cached) log.warn("       (result was cached — no charge)");

  } catch (err: any) {
    log.fail(`Task "${task.name}" threw: ${err?.message ?? err}`);
    if (err?.code) console.log(`       code: ${err.code}`);
  }
}

// ─── Pick a random task ───────────────────────────────────────────────────────

function randomTask(): Task {
  return TASKS[Math.floor(Math.random() * TASKS.length)];
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

const INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

async function start() {
  log.divider();
  log.info("Runix Agent started");
  log.info(`Scheduled: random task every ${INTERVAL_MS / 1000}s`);
  log.info(`Total mock tasks available: ${TASKS.length}`);
  log.divider();

  // Run one immediately on boot
  await runTask(randomTask());

  // Then every 5 minutes
  setInterval(async () => {
    await runTask(randomTask());
  }, INTERVAL_MS);
}

start();