import { parseYamlFrontMatter } from "../utils/content.ts";
import { resolvePrompt } from "../utils/prompt.ts";
import { buildRequestContext, buildFullPrompt, extractRequestParams } from "../utils/request.ts";
import { generateStreamingResponse } from "../utils/ai.ts";

// Default markdown content
const DEFAULT_CONTENT = `# Welcome to Server-Side Generation

This is a demo of server-side generation with AI.

You can customize this content by providing markdown in your request.`;

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant that generates web pages based on markdown content.
You should convert the markdown into well-structured HTML with appropriate styling.
Make the output visually appealing and professional.
IMPORTANT: Output only raw HTML without any markdown code fences or backticks. Do not wrap the HTML in \`\`\`html or any other code fence markers.`;

// Default model
const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Handle main generation endpoint (/ and /generate)
 */
export async function handleGenerate(req: Request, url: URL): Promise<Response> {
  // Return HTML form for GET requests without content parameter
  if (req.method === "GET" && !url.searchParams.get("content")) {
    // Read the HTML template from file
    const formTemplate = await Deno.readTextFile(
      new URL("../../form.html", import.meta.url).pathname
    );
    
    // Perform substitutions
    const formHtml = formTemplate
      .replace("{{DEFAULT_CONTENT}}", DEFAULT_CONTENT)
      .replace("{{DEFAULT_SYSTEM_PROMPT}}", DEFAULT_SYSTEM_PROMPT);
    
    return new Response(formHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  try {
    // Extract parameters from request
    const params = await extractRequestParams(req, url);

    // Extract markdown content and prompt from request
    const rawMarkdownContent = params.content || DEFAULT_CONTENT;
    const systemPrompt = params.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    let userPrompt = params.prompt || "";
    const modelName = params.model || DEFAULT_MODEL;

    // Parse YAML front matter from markdown content
    const { frontMatter, content: markdownContent } = parseYamlFrontMatter(rawMarkdownContent);
    
    // If there's a prompt in the front matter and no explicit prompt was provided, use it
    if (!userPrompt && frontMatter && frontMatter.prompt) {
      userPrompt = await resolvePrompt(frontMatter.prompt);
    } else if (!userPrompt) {
      userPrompt = "Generate an HTML page from this markdown content.";
    }

    // Build request context with headers and other variables
    const requestContext = buildRequestContext(req);

    // Create the full prompt with context
    const fullPrompt = buildFullPrompt(userPrompt, markdownContent, requestContext);

    // Generate and return streaming response
    return await generateStreamingResponse(systemPrompt, fullPrompt, modelName);
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
