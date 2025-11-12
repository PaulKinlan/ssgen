import { handleHealth } from "./health.ts";
import { handleGenerate } from "./generate.ts";
import { handleContent } from "./content.ts";

/**
 * Main request handler that routes requests to appropriate handlers
 */
export async function router(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Health check endpoint
  if (url.pathname === "/health") {
    return handleHealth(req);
  }

  // Main generation endpoint
  if (url.pathname === "/" || url.pathname === "/generate") {
    return await handleGenerate(req, url);
  }

  // Try to serve content from /content directory for other paths
  const contentResponse = await handleContent(req, url);
  if (contentResponse !== null) {
    return contentResponse;
  }

  // 404 for other paths
  return new Response(
    JSON.stringify({
      error: "Not Found",
      message: "Use / or /generate endpoint",
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}
