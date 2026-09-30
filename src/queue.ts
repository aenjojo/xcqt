import { handlePush } from "./commands/push.ts";
import { handleConsume } from "./commands/consume.ts";
import { parseArgs } from 'node:util';

const { positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    queue: { type: "string", short: "q", default: "default" },
  },
  allowPositionals: true,
});
const command = positionals[0];

switch (command) {
  case "push":
  case "add": {
    const taskJson = positionals[1];
    const executorPath = positionals[2];
    handlePush(taskJson, executorPath);
    break;
  }

  case "consume": {
    const isListenMode = positionals.includes("--listen");
    await handleConsume(isListenMode);
    break;
  }

  default: {
    console.log(`
      Usage:
        queue push '<json_payload>' <path_to_executor>
        queue add '<json_payload>' <path_to_executor>
        queue consume [--listen]
    `);
    break;
  }
}
