import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// Default markdown content
const DEFAULT_CONTENT = `# Welcome to Server-Side Generation

This is a demo of server-side generation with AI.

You can customize this content by providing markdown in your request.`;

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant that generates web pages based on markdown content.
You should convert the markdown into well-structured HTML with appropriate styling.
Make the output visually appealing and professional.`;

// Default model
const DEFAULT_MODEL = "gemini-2.0-flash-exp";

interface RequestContext {
  headers: Record<string, string>;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Health check endpoint
  if (url.pathname === "/health") {
    return new Response("OK", { status: 200 });
  }

  // Main generation endpoint
  if (url.pathname === "/" || url.pathname === "/generate") {
    try {
      // Parse request body if present
      let requestBody: any = {};
      if (req.method === "POST") {
        const contentType = req.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          requestBody = await req.json();
        }
      }

      // Extract markdown content and prompt from request
      const markdownContent = requestBody.content || url.searchParams.get("content") || DEFAULT_CONTENT;
      const systemPrompt = requestBody.systemPrompt || url.searchParams.get("systemPrompt") || DEFAULT_SYSTEM_PROMPT;
      const userPrompt = requestBody.prompt || url.searchParams.get("prompt") || "Generate an HTML page from this markdown content.";
      const modelName = requestBody.model || url.searchParams.get("model") || DEFAULT_MODEL;

      // Build request context with headers and other variables
      const requestContext: RequestContext = {
        headers: Object.fromEntries(req.headers.entries()),
        method: req.method,
        url: req.url,
        userAgent: req.headers.get("user-agent") || undefined,
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      };

      // Create the full prompt with context
      const fullPrompt = `${userPrompt}

**Request Context:**
- Method: ${requestContext.method}
- URL: ${requestContext.url}
- User-Agent: ${requestContext.userAgent || "N/A"}
- IP: ${requestContext.ip || "N/A"}

**Available Headers:**
${Object.entries(requestContext.headers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

**Markdown Content:**
${markdownContent}

Please generate the HTML output.`;

      // Initialize Gemini model
      const model = google(modelName, {
        apiKey: Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY")
      });

      // Stream the response
      const result = streamText({
        model,
        system: systemPrompt,
        prompt: fullPrompt,
      });

      // Create a streaming response
      const stream = result.toTextStreamResponse();

      // Return the streaming response with appropriate headers
      return new Response(stream.body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      console.error("Error generating content:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate content",
          message: "An error occurred while processing your request. Please check your API configuration and try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
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

// Start the server
const port = parseInt(Deno.env.get("PORT") || "8000");

console.log(`Server starting on port ${port}...`);
console.log(`Local: http://localhost:${port}`);

Deno.serve({ port }, handler);
