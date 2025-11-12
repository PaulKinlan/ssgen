import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { resolve, normalize } from "@std/path";
import { parse as parseYaml } from "@std/yaml";

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

interface YamlFrontMatter {
  prompt?: string;
  [key: string]: unknown;
}

interface ParsedContent {
  frontMatter: YamlFrontMatter | null;
  content: string;
}

/**
 * Parse YAML front matter from markdown content
 * Returns the front matter object and the content without the front matter
 */
function parseYamlFrontMatter(markdown: string): ParsedContent {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontMatterRegex);
  
  if (!match) {
    return { frontMatter: null, content: markdown };
  }
  
  try {
    const yamlContent = match[1];
    const contentWithoutFrontMatter = match[2];
    const frontMatter = parseYaml(yamlContent) as YamlFrontMatter;
    
    return {
      frontMatter,
      content: contentWithoutFrontMatter,
    };
  } catch (error) {
    console.error("Error parsing YAML front matter:", error);
    return { frontMatter: null, content: markdown };
  }
}

/**
 * Load prompt from file or return inline prompt
 * If prompt starts with a path-like string (contains .md), treat it as a file path
 * Otherwise, treat it as an inline prompt
 */
async function resolvePrompt(prompt: string): Promise<string> {
  // Check if this looks like a file path (ends with .md or contains /)
  if (prompt.endsWith('.md') || prompt.includes('/')) {
    try {
      // Resolve path relative to the current working directory
      const promptPath = resolve(Deno.cwd(), prompt);
      
      // Security check: ensure path is within allowed directories
      const cwd = Deno.cwd();
      const promptsDir = resolve(cwd, "./prompts");
      
      if (!promptPath.startsWith(promptsDir + "/") && promptPath !== promptsDir) {
        console.error("Prompt file path outside of prompts directory:", prompt);
        return prompt; // Return as inline prompt if path is invalid
      }
      
      // Read the prompt file
      const promptContent = await Deno.readTextFile(promptPath);
      return promptContent.trim();
    } catch (error) {
      console.error("Error reading prompt file:", error);
      return prompt; // Fall back to treating it as inline prompt
    }
  }
  
  // Treat as inline prompt
  return prompt;
}

interface RequestContext {
  headers: Record<string, string>;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
}

interface RequestBody {
  content?: string;
  systemPrompt?: string;
  prompt?: string;
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Health check endpoint
  if (url.pathname === "/health") {
    return new Response("OK", { status: 200 });
  }

  // Main generation endpoint
  if (url.pathname === "/" || url.pathname === "/generate") {
    // Return HTML form for GET requests without content parameter
    if (req.method === "GET" && !url.searchParams.get("content")) {
      // Read the HTML template from file
      const formTemplate = await Deno.readTextFile(
        new URL("./form.html", import.meta.url).pathname
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
      // Parse request body if present
      let requestBody: RequestBody = {};
      if (req.method === "POST") {
        const contentType = req.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          requestBody = await req.json();
        }
      }

      // Extract markdown content and prompt from request
      const rawMarkdownContent = requestBody.content || url.searchParams.get("content") || DEFAULT_CONTENT;
      const systemPrompt = requestBody.systemPrompt || url.searchParams.get("systemPrompt") || DEFAULT_SYSTEM_PROMPT;
      let userPrompt = requestBody.prompt || url.searchParams.get("prompt") || "";
      const modelName = requestBody.model || url.searchParams.get("model") || DEFAULT_MODEL;

      // Parse YAML front matter from markdown content
      const { frontMatter, content: markdownContent } = parseYamlFrontMatter(rawMarkdownContent);
      
      // If there's a prompt in the front matter and no explicit prompt was provided, use it
      if (!userPrompt && frontMatter && frontMatter.prompt) {
        userPrompt = await resolvePrompt(frontMatter.prompt);
      } else if (!userPrompt) {
        userPrompt = "Generate an HTML page from this markdown content.";
      }

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

      // Create a transform stream to strip code fences
      interface TransformerContext {
        buffer: string;
        hasStarted: boolean;
        hasEnded: boolean;
      }

      const transformStream = new TransformStream<Uint8Array, Uint8Array>({
        start(this: TransformerContext) {
          this.buffer = '';
          this.hasStarted = false;
          this.hasEnded = false;
        },
        transform(this: TransformerContext, chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) {
          const text = new TextDecoder().decode(chunk);
          this.buffer += text;

          // Check if we haven't started outputting yet and we have a code fence
          if (!this.hasStarted) {
            // Look for opening code fence pattern (```html or ``` at the start)
            const codeFenceMatch = this.buffer.match(/^```(?:html)?\s*\n/);
            if (codeFenceMatch) {
              // Strip the opening fence
              this.buffer = this.buffer.slice(codeFenceMatch[0].length);
              this.hasStarted = true;
            } else if (this.buffer.length > 10 && !this.buffer.startsWith('```')) {
              // If we have enough content and no fence, start outputting
              this.hasStarted = true;
            }
          }

          // Output content if we've started
          if (this.hasStarted && !this.hasEnded) {
            // Check for closing code fence
            const closingFenceIndex = this.buffer.indexOf('```');
            if (closingFenceIndex !== -1) {
              // Output everything before the closing fence
              const content = this.buffer.slice(0, closingFenceIndex);
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
              this.buffer = '';
              this.hasEnded = true;
            } else {
              // Output all but the last few characters (in case closing fence is split across chunks)
              const safeLength = Math.max(0, this.buffer.length - 3);
              if (safeLength > 0) {
                const content = this.buffer.slice(0, safeLength);
                controller.enqueue(new TextEncoder().encode(content));
                this.buffer = this.buffer.slice(safeLength);
              }
            }
          }
        },
        flush(this: TransformerContext, controller: TransformStreamDefaultController<Uint8Array>) {
          // Output any remaining buffered content
          if (this.hasStarted && this.buffer) {
            controller.enqueue(new TextEncoder().encode(this.buffer));
          }
        }
      });

      // Pipe the stream through the transformer
      const transformedStream = stream.body?.pipeThrough(transformStream);

      // Return the streaming response with appropriate headers
      return new Response(transformedStream, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
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

  // Try to serve content from /content directory for other paths
  try {
    // Extract pathname and remove leading slash
    let pathname = url.pathname.slice(1);
    
    // Remove .html extension if present
    if (pathname.endsWith(".html")) {
      pathname = pathname.slice(0, -5);
    }
    
    // Skip empty paths (already handled above as "/") and special paths like "generate"
    if (pathname && pathname !== "generate") {
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
        
        // Parse YAML front matter
        const { frontMatter, content: markdownContent } = parseYamlFrontMatter(rawMarkdownContent);
        
        // Resolve prompt from front matter
        let userPrompt = "Generate an HTML page from this markdown content.";
        if (frontMatter && frontMatter.prompt) {
          userPrompt = await resolvePrompt(frontMatter.prompt);
        }
        
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
        const model = google("gemini-2.5-flash", {
          apiKey: Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY")
        });

        // Stream the response
        const result = streamText({
          model,
          system: DEFAULT_SYSTEM_PROMPT,
          prompt: fullPrompt,
        });

        // Create a streaming response
        const stream = result.toTextStreamResponse();

        // Create a transform stream to strip code fences
        interface TransformerContext {
          buffer: string;
          hasStarted: boolean;
          hasEnded: boolean;
        }

        const transformStream = new TransformStream<Uint8Array, Uint8Array>({
          start(this: TransformerContext) {
            this.buffer = '';
            this.hasStarted = false;
            this.hasEnded = false;
          },
          transform(this: TransformerContext, chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) {
            const text = new TextDecoder().decode(chunk);
            this.buffer += text;

            // Check if we haven't started outputting yet and we have a code fence
            if (!this.hasStarted) {
              // Look for opening code fence pattern (```html or ``` at the start)
              const codeFenceMatch = this.buffer.match(/^```(?:html)?\s*\n/);
              if (codeFenceMatch) {
                // Strip the opening fence
                this.buffer = this.buffer.slice(codeFenceMatch[0].length);
                this.hasStarted = true;
              } else if (this.buffer.length > 10 && !this.buffer.startsWith('```')) {
                // If we have enough content and no fence, start outputting
                this.hasStarted = true;
              }
            }

            // Output content if we've started
            if (this.hasStarted && !this.hasEnded) {
              // Check for closing code fence
              const closingFenceIndex = this.buffer.indexOf('```');
              if (closingFenceIndex !== -1) {
                // Output everything before the closing fence
                const content = this.buffer.slice(0, closingFenceIndex);
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
                this.buffer = '';
                this.hasEnded = true;
              } else {
                // Output all but the last few characters (in case closing fence is split across chunks)
                const safeLength = Math.max(0, this.buffer.length - 3);
                if (safeLength > 0) {
                  const content = this.buffer.slice(0, safeLength);
                  controller.enqueue(new TextEncoder().encode(content));
                  this.buffer = this.buffer.slice(safeLength);
                }
              }
            }
          },
          flush(this: TransformerContext, controller: TransformStreamDefaultController<Uint8Array>) {
            // Output any remaining buffered content
            if (this.hasStarted && this.buffer) {
              controller.enqueue(new TextEncoder().encode(this.buffer));
            }
          }
        });

        // Pipe the stream through the transformer
        const transformedStream = stream.body?.pipeThrough(transformStream);

        // Return the streaming response with appropriate headers
        return new Response(transformedStream, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Content-Type-Options": "nosniff",
          },
        });
      } catch (error) {
        // If file not found, fall through to 404
        if (error instanceof Deno.errors.NotFound) {
          // Continue to 404
        } else {
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
      }
    }
  } catch (error) {
    console.error("Error processing request:", error);
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
