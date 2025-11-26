import { resolve, normalize } from "@std/path";
import { parseYamlFrontMatter } from "../utils/content.ts";
import { resolvePrompt } from "../utils/prompt.ts";
import { resolveStyleConfig } from "../utils/style.ts";
import { buildRequestContext, extractRequestParams } from "../utils/request.ts";
import { generateResponse } from "../utils/response.ts";
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_MODEL } from "../utils/constants.ts";

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

      console.log(userPrompt, params.prompt, frontMatter?.prompt);
      
      // Use systemPrompt and model from query params/body if provided, otherwise use defaults
      const systemPrompt = params.systemPrompt || DEFAULT_SYSTEM_PROMPT;
      const modelName = params.model || DEFAULT_MODEL;
      
      // Resolve style configuration from front matter
      const styleConfig = frontMatter?.style 
        ? await resolveStyleConfig(frontMatter.style)
        : undefined;
      
      // Enhance user prompt if style configuration is present
      if (styleConfig && (styleConfig.brandGuidelines.length > 0 || styleConfig.images.length > 0)) {
        const styleReferences = [];
        if (styleConfig.brandGuidelines.length > 0) {
          styleReferences.push("the provided brand guidelines");
        }
        if (styleConfig.images.length > 0) {
          styleReferences.push("the reference images");
        }
        userPrompt += ` Please reference ${styleReferences.join(" and ")} for styling and design direction.`;
      }
      
      // Extract metadata from front matter
      const metadata = frontMatter ? {
        title: frontMatter.title,
        description: frontMatter.description,
      } : undefined;
      
      // Build request context with headers and other variables
      const requestContext = buildRequestContext(req);

      // Extract cache configuration from front matter
      const cacheOptions = frontMatter?.cache;

      // Generate and return streaming response
      return await generateResponse(
        req,
        systemPrompt,
        userPrompt,
        markdownContent,
        requestContext,
        metadata,
        modelName,
        styleConfig,
        cacheOptions
      );
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
