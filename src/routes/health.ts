/**
 * Health check endpoint handler
 */
export function handleHealth(_req: Request): Response {
  return new Response("OK", { status: 200 });
}
