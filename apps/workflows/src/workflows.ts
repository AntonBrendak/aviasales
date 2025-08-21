export async function pingWorkflow(name: string): Promise<string> {
  return `pong:${name}`;
}