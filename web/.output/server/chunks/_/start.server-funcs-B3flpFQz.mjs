import { a as createServerRpc, c as createServerFn } from '../virtual/entry.mjs';
import fs from 'node:fs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'dotenv';
import 'node:async_hooks';
import 'react/jsx-runtime';
import '@tanstack/react-router/ssr/server';
import '@tanstack/react-router';

const TODOS_FILE = "todos.json";
async function readTodos() {
  return JSON.parse(await fs.promises.readFile(TODOS_FILE, "utf-8").catch(() => JSON.stringify([{
    id: 1,
    name: "Get groceries"
  }, {
    id: 2,
    name: "Buy a new phone"
  }], null, 2)));
}
const addTodo_createServerFn_handler = createServerRpc("34a400ef155cae4517b50b99a6f1db6819e2090dea5a8bc25de22b442e6347a4", (opts, signal) => {
  return addTodo.__executeServer(opts, signal);
});
const addTodo = createServerFn({
  method: "POST"
}).inputValidator((d) => d).handler(addTodo_createServerFn_handler, async ({
  data
}) => {
  const todos = await readTodos();
  todos.push({
    id: todos.length + 1,
    name: data
  });
  await fs.promises.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2));
  return todos;
});

export { addTodo_createServerFn_handler };
//# sourceMappingURL=start.server-funcs-B3flpFQz.mjs.map
