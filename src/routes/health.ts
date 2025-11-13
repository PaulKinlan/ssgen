import { globalCache } from "../utils/cache.ts";

/**
 * Health check endpoint handler
 */
export function handleHealth(req: Request): Response {
  const url = new URL(req.url);
  
  // If ?stats query parameter is present, return cache statistics
  if (url.searchParams.has("stats")) {
    const stats = globalCache.getStats();
    return new Response(JSON.stringify(stats, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  return new Response("OK", { status: 200 });
}
