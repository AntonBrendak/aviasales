import { Worker, NativeConnection } from "@temporalio/worker";
import { Connection, Client } from "@temporalio/client";
//import * as activities from "./activities"; // если есть

const address   = process.env.TEMPORAL_ADDRESS   ?? "localhost:7233";
const namespace = process.env.TEMPORAL_NAMESPACE ?? "default";
const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? "air-task-queue";

async function run() {
  // 1) соединения
  const nativeConnection = await NativeConnection.connect({ address });
  const connection = await Connection.connect({ address });
  const client = new Client({ connection, namespace });
  //(void) client; // используешь позже — оставь как есть

  // 2) для ESM: путь к модулю workflows
  const workflowsPath = new URL("./workflows.ts", import.meta.url).pathname;
  // если у тебя сборка кладёт .js рядом — поменяй на "./workflows.js"

  // 3) создаём и запускаем воркер
  const worker = await Worker.create({
    connection: nativeConnection,
    namespace,
    taskQueue,
    workflowsPath,
  //  activities,
  });

  console.log(`[worker] start polling taskQueue=${taskQueue}, ns=${namespace}, addr=${address}`);
  await worker.run();
}

run().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});