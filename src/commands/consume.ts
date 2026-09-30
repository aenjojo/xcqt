import { pathToFileURL } from "node:url";
import { db } from "../db.ts";
import { isConsumerRunning, acquireLock, releaseLock } from "../lock.ts";
import type { Task } from "../types.d.ts";

export async function handleConsume(isListenMode: boolean) {
  if (isConsumerRunning()) {
    console.log("Consumer is already active in another process.");
    process.exit(0);
  }

  acquireLock();
  let isStopping = false;

  const cleanupAndExit = () => {
    releaseLock();
    process.exit(0);
  };

  process.on("exit", releaseLock);
  process.on("SIGINT", cleanupAndExit);
  process.on("SIGTERM", cleanupAndExit);

  // Interactive Keypress Handling ('q' or Ctrl+Z)
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (key: string) => {
      if (key === "q" || key === "Q" || key === "\x1a" || key === "\x03") {
        console.log("\n[Consumer] Stop signal received. Finishing current run...");
        isStopping = true;
      }
    });
  }

  console.log(`[Consumer] Running (Mode: ${isListenMode ? "Listen" : "Batch"}).`);
  console.log("[Consumer] Press 'q' or 'Ctrl+Z' to exit manually.\n");

  while (!isStopping) {
    // Fetch oldest pending task
    const task = db
      .query("SELECT * FROM tasks WHERE status = 'pending' ORDER BY id ASC LIMIT 1")
      .get() as Task | null;

    if (task) {
      db.query("UPDATE tasks SET status = 'processing' WHERE id = ?").run(task.id);
      console.log(`[Task #${task.id}] Executing...`);

      try {
        const payload = JSON.parse(task.payload);
        const executorUrl = pathToFileURL(task.executor).href;

        // Load TS/JS Executor on-demand via Bun dynamic import (No timestamp cache busting)
        const module = await import(executorUrl);
        const execute = module.default || module.execute || module.run;

        if (typeof execute !== "function") {
          throw new Error("Executor file must export a default or named 'run'/'execute' function.");
        }

        // Wait for sequential execution to finish
        await execute(payload);

        db.query("UPDATE tasks SET status = 'completed' WHERE id = ?").run(task.id);
        console.log(`[Task #${task.id}] Done.\n`);
      } catch (err: any) {
        console.error(`[Task #${task.id}] Failed:`, err?.message || err);
        db.query("UPDATE tasks SET status = 'failed' WHERE id = ?").run(task.id);
      }
    } else {
      // No pending tasks remaining
      if (!isListenMode) {
        console.log("[Consumer] No remaining tasks. Auto-closing window.");
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  cleanupAndExit();
}
