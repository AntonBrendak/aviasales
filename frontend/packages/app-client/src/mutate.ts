import { createHttp } from "./http";
import { randomUUID } from "./utils/uuid";

export async function postCommand<T>(
  url: string,
  body: unknown,
  { idempotencyKey = randomUUID() } = {}
): Promise<T> {
  const http = createHttp();
  const res = await http.post(url, {
    json: body,
    headers: { "idempotency-key": idempotencyKey }
  });
  return res.json<T>();
}