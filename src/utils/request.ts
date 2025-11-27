export interface RequestContext {
  headers: Record<string, string>;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userPromptPreference?: string;
}

export interface RequestBody {
  content?: string;
  systemPrompt?: string;
  prompt?: string;
  model?: string;
}

/**
 * Build request context from Request object
 */
export function buildRequestContext(req: Request): RequestContext {
  return {
    headers: Object.fromEntries(req.headers.entries()),
    method: req.method,
    url: req.url,
    userAgent: req.headers.get("user-agent") || undefined,
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    userPromptPreference: req.headers.get("accept-prompt") || undefined,
  };
}

export interface Metadata {
  title?: string;
  description?: string;
}

/**
 * Build full prompt with request context and optional metadata
 */
export function buildFullPrompt(
  userPrompt: string,
  markdownContent: string,
  requestContext: RequestContext,
  metadata: Metadata = {},
  preferredLanguage ? : string,
): string {
  let metadataInstructions = "";
  if (metadata.title || metadata.description) {
    metadataInstructions = "\n**Metadata to include in HTML:**\n";
    if (metadata.title) {
      metadataInstructions += `- Title: ${metadata.title} (add this to the <title> tag)\n`;
    }
    if (metadata.description) {
      metadataInstructions += `- Description: ${metadata.description} (add this to a <meta name="description"> tag)\n`;
    }
  }

  let userPreferenceInstructions = "";
  if (requestContext.userPromptPreference) {
    userPreferenceInstructions = `\n**User Preference:**
The user has provided the following preference to influence the output. Please take this into account when generating the response while still following the system and author instructions:
${requestContext.userPromptPreference}
`;
  }

  return `${userPrompt}
${metadataInstructions}${userPreferenceInstructions}
**Request Context:**
- Method: ${requestContext.method}
- URL: ${requestContext.url}
- User-Agent: ${requestContext.userAgent || "N/A"}
- IP: ${requestContext.ip || "N/A"}
- Preferred Language: ${preferredLanguage || "N/A"}

**Available Headers:**
${Object.entries(requestContext.headers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

**Markdown Content:**
${markdownContent}

Please generate the HTML output.`;
}

/**
 * Extract parameters from request (both query params and body)
 */
export async function extractRequestParams(
  req: Request,
  url: URL
): Promise<RequestBody> {
  let requestBody: RequestBody = {};
  
  if (req.method === "POST") {
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      requestBody = await req.json();
    }
  }
  
  // Merge query params with body (body takes precedence)
  return {
    content: requestBody.content || url.searchParams.get("content") || undefined,
    systemPrompt: requestBody.systemPrompt || url.searchParams.get("systemPrompt") || undefined,
    prompt: requestBody.prompt || url.searchParams.get("prompt") || undefined,
    model: requestBody.model || url.searchParams.get("model") || undefined,
  };
}
