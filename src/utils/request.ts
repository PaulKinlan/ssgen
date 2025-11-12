export interface RequestContext {
  headers: Record<string, string>;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
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
  };
}

/**
 * Build full prompt with request context
 */
export function buildFullPrompt(
  userPrompt: string,
  markdownContent: string,
  requestContext: RequestContext
): string {
  return `${userPrompt}

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
