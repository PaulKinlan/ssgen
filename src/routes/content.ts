import { resolve, normalize } from "@std/path";
import { parseYamlFrontMatter } from "../utils/content.ts";
import { resolvePrompt } from "../utils/prompt.ts";
import { buildRequestContext, buildFullPrompt, extractRequestParams } from "../utils/request.ts";
import { generateStreamingResponse } from "../utils/ai.ts";

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant that generates web pages based on markdown content.
You should convert the markdown into well-structured HTML with appropriate styling.
Make the output visually appealing and professional.
IMPORTANT: Output only raw HTML without any markdown code fences or backticks. Do not wrap the HTML in \`\`\`html or any other code fence markers.`;

// Default model
const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Handle content directory file serving
 * Serves markdown files from /content directory with AI generation
 */
export async function handleContent(req: Request, url: URL): Promise<Response | null> {
  try {
    // Extract pathname and remove leading slash
    let pathname = url.pathname.slice(1);
    
    // Remove .html extension if present
    if (pathname.endsWith(".html")) {
      pathname = pathname.slice(0, -5);
    }
    
    // Skip empty paths (already handled as "/") and special paths like "generate"
    if (!pathname || pathname === "generate") {
      return null; // Not handled by this route
    }
    
    // Resolve the content directory path
    const contentDir = resolve(Deno.cwd(), "./content");
    
    // Normalize the pathname to remove any .. or . segments
    const normalizedPathname = normalize(pathname);
    
    // Construct the full file path
    const requestedPath = resolve(contentDir, `${normalizedPathname}.md`);
    
    // Security check: ensure the resolved path is within the content directory
    if (!requestedPath.startsWith(contentDir + "/") && requestedPath !== contentDir) {
      console.error("Path traversal attempt blocked:", pathname);
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Access denied.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    try {
      const rawMarkdownContent = await Deno.readTextFile(requestedPath);
      
      // Extract parameters from request (now supporting query params!)
      const params = await extractRequestParams(req, url);
      
      // Parse YAML front matter
      const { frontMatter, content: markdownContent } = parseYamlFrontMatter(rawMarkdownContent);
      
      // Resolve prompt from front matter or use default
      let userPrompt = params.prompt || "Generate an HTML page from this markdown content.";
      if (!params.prompt && frontMatter && frontMatter.prompt) {
        userPrompt = await resolvePrompt(frontMatter.prompt);
      }
      
      // Use systemPrompt and model from query params/body if provided, otherwise use defaults
      const systemPrompt = params.systemPrompt || DEFAULT_SYSTEM_PROMPT;
      const modelName = params.model || DEFAULT_MODEL;
      
      // Build request context with headers and other variables
      const requestContext = buildRequestContext(req);

      // Create the full prompt with context
      const fullPrompt = buildFullPrompt(userPrompt, markdownContent, requestContext);

      // Generate and return streaming response
      return await generateStreamingResponse(systemPrompt, fullPrompt, modelName);
    } catch (error) {
      // If file not found, return null to fall through to 404
      if (error instanceof Deno.errors.NotFound) {
        return null;
      }
      
      console.error("Error reading content file:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to read content",
          message: "An error occurred while reading the content file.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return null;
  }
}
