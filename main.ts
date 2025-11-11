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
    // Return HTML form for GET requests without content parameter
    if (req.method === "GET" && !url.searchParams.get("content")) {
      const formHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSGen - Server-Side Generation API</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
    }
    h1 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 2.5em;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 1.1em;
    }
    .form-group {
      margin-bottom: 25px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #444;
    }
    .help-text {
      font-size: 0.9em;
      color: #666;
      margin-top: 4px;
    }
    textarea, input[type="text"] {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.3s;
    }
    textarea:focus, input[type="text"]:focus {
      outline: none;
      border-color: #667eea;
    }
    textarea {
      resize: vertical;
      min-height: 120px;
      font-family: 'Courier New', monospace;
    }
    .content-textarea {
      min-height: 200px;
    }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      width: 100%;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .api-info {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    .api-info h3 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 1.2em;
    }
    .api-info code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    .output-section {
      margin-top: 30px;
      display: none;
    }
    .output-section.visible {
      display: block;
    }
    .output-content {
      background: #f8f9fa;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      padding: 20px;
      min-height: 200px;
      max-height: 500px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .loading {
      text-align: center;
      padding: 20px;
      color: #667eea;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 SSGen</h1>
    <p class="subtitle">Server-Side Generation with AI - API Test Interface</p>
    
    <div class="api-info">
      <h3>About this API</h3>
      <p>This service generates dynamic web pages using AI (Gemini Flash 2.5) from markdown content with streaming support. The API accepts markdown content and generates HTML or text based on your prompts.</p>
      <p style="margin-top: 10px;"><strong>Endpoint:</strong> <code>POST /generate</code> or <code>POST /</code></p>
    </div>

    <form id="generateForm">
      <div class="form-group">
        <label for="content">Markdown Content</label>
        <textarea id="content" name="content" class="content-textarea" placeholder="# Welcome to SSGen&#10;&#10;Enter your markdown content here...">${DEFAULT_CONTENT}</textarea>
        <div class="help-text">Enter the markdown content you want to process</div>
      </div>

      <div class="form-group">
        <label for="prompt">User Prompt</label>
        <input type="text" id="prompt" name="prompt" placeholder="Generate an HTML page from this markdown content." value="Generate an HTML page from this markdown content.">
        <div class="help-text">Describe what you want the AI to generate</div>
      </div>

      <div class="form-group">
        <label for="systemPrompt">System Prompt</label>
        <textarea id="systemPrompt" name="systemPrompt" placeholder="You are a helpful assistant...">${DEFAULT_SYSTEM_PROMPT}</textarea>
        <div class="help-text">Configure the AI's behavior and role</div>
      </div>

      <button type="submit">Generate Content</button>
    </form>

    <div id="outputSection" class="output-section">
      <h3>Generated Output:</h3>
      <div id="output" class="output-content"></div>
    </div>
  </div>

  <script>
    document.getElementById('generateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const content = document.getElementById('content').value;
      const prompt = document.getElementById('prompt').value;
      const systemPrompt = document.getElementById('systemPrompt').value;
      
      const outputSection = document.getElementById('outputSection');
      const output = document.getElementById('output');
      
      outputSection.classList.add('visible');
      output.innerHTML = '<div class="loading">⏳ Generating content...</div>';
      
      try {
        const response = await fetch('/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content,
            prompt: prompt,
            systemPrompt: systemPrompt
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate content');
        }
        
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        output.innerHTML = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          output.innerHTML += chunk;
          output.scrollTop = output.scrollHeight;
        }
      } catch (error) {
        output.innerHTML = '<div style="color: red;">Error: ' + error.message + '</div>';
      }
    });
  </script>
</body>
</html>`;
      
      return new Response(formHtml, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

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
