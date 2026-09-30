import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { db } from "../db.ts";
import { isConsumerRunning } from "../lock.ts";

export function handlePush(taskJson?: string, executorPath?: string) {
  if (!taskJson || !executorPath) {
    console.error("Usage: queue push <task_in_json> <path_to_executor>");
    process.exit(1);
  }

  try {
    JSON.parse(taskJson);
  } catch {
    console.error("Error: Task payload must be valid JSON.");
    process.exit(1);
  }

  const absoluteExecutor = resolve(process.cwd(), executorPath);
  if (!existsSync(absoluteExecutor)) {
    console.error(`Error: Executor script not found at "${absoluteExecutor}"`);
    process.exit(1);
  }

  // Queue task into SQLite
  db.query("INSERT INTO tasks (payload, executor) VALUES (?, ?)").run(
    taskJson,
    absoluteExecutor
  );
  console.log("Task added to queue.");

  // Spawn consumer in a new pwsh window if not running
  if (!isConsumerRunning()) {
    console.log("Spawning consumer in new pwsh window...");
    const exePath = process.execPath;

    let commandString: string;
    if (exePath.endsWith("bun") || exePath.endsWith("bun.exe")) {
      const scriptPath = resolve(executorPath);
      commandString = `& '${exePath}' run '${scriptPath}' consume`;
    } else {
      commandString = `& '${exePath}' consume`;
    }

    // Spawn pwsh window without the --listen flag
    spawn("pwsh", ["-NoExit", "-Command", commandString], {
      detached: true,
      stdio: "ignore",
      shell: true,
    }).unref();
  } else {
    console.log("Active consumer window detected; task queued.");
  }
}
