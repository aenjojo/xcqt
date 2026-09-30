import { existsSync, unlinkSync, writeFileSync, readFileSync } from "node:fs";
import { QUEUE_LOCK_PATH } from './constant';

export function isConsumerRunning(): boolean {
  if (!existsSync(QUEUE_LOCK_PATH)) return false;
  try {
    const pid = parseInt(readFileSync(QUEUE_LOCK_PATH, "utf8").trim(), 10);
    if (isNaN(pid)) return false;
    process.kill(pid, 0);
    return true;
  } catch {
    if (existsSync(QUEUE_LOCK_PATH)) unlinkSync(QUEUE_LOCK_PATH);
    return false;
  }
}

export function acquireLock(): void {
  writeFileSync(QUEUE_LOCK_PATH, process.pid.toString(), "utf8");
}

export function releaseLock(): void {
  if (existsSync(QUEUE_LOCK_PATH)) {
    try {
      const pid = parseInt(readFileSync(QUEUE_LOCK_PATH, "utf8").trim(), 10);
      if (pid === process.pid) unlinkSync(QUEUE_LOCK_PATH);
    } catch { }
  }
}
