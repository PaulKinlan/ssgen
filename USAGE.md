# Usage Guide

This guide provides detailed examples of how to use the ssgen service.

## Getting Started

Before you begin, make sure you have:
1. Deno installed
2. A Google AI API key
3. Created a `.env` file with your API key

```bash
# Copy the example environment file
cp .env.example .env

# Add your API key to .env
echo "GOOGLE_GENERATIVE_AI_API_KEY=your_actual_key_here" >> .env
```

## Starting the Server

```bash
deno task dev
```

The server will start on `http://localhost:8000`

## Example Use Cases

### 1. Default Content Generation

Simply visit the root endpoint:

```bash
curl http://localhost:8000/
```

This will generate content using the default markdown and prompt.

### 2. Generate a Portfolio Page

Using the provided example:

```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "content": "$(cat examples/sample-content.md)",
  "prompt": "Create a modern, responsive portfolio webpage with a professional design",
  "systemPrompt": "You are an expert web designer who creates beautiful, modern HTML with inline CSS styling."
}
EOF
```

### 3. Generate a Blog Post

```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# My First Blog Post\n\nToday I learned about server-side generation with AI. It is amazing!",
    "prompt": "Create a blog post page with a reading time estimate and social sharing meta tags",
    "systemPrompt": "You are a blog template expert. Create clean, readable HTML with proper semantic markup."
  }'
```

### 4. Dynamic Content Based on User Agent

The LLM automatically receives the user agent and can tailor content:

```bash
# Mobile user agent
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
  -d '{
    "content": "# Welcome\n\nThis is a responsive site.",
    "prompt": "Generate HTML optimized for the device detected in the request context"
  }'
```

### 5. Personalized Greeting by IP

```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 192.168.1.1" \
  -d '{
    "content": "# Welcome Visitor",
    "prompt": "Create a personalized welcome message mentioning the visitor IP from the context"
  }'
```

### 6. Using Different Models

You can specify which model to use via GET query parameter or POST body:

**GET Request with Model Parameter:**
```bash
curl "http://localhost:8000/?model=gemini-1.5-pro&content=Hello+World&prompt=Generate+HTML"
```

**POST Request with Model Parameter:**
```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Technical Documentation",
    "model": "gemini-1.5-pro",
    "prompt": "Create comprehensive technical documentation",
    "systemPrompt": "You are a technical writing expert."
  }'
```

Available models:
- `gemini-2.0-flash-exp` (default, fastest, latest experimental)
- `gemini-1.5-pro` (more powerful, better for complex tasks)
- `gemini-1.5-flash` (fast, good for simple tasks)

### 7. Landing Page Generation

```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# SaaS Product Name\n\n## Features\n- Feature 1\n- Feature 2\n- Feature 3\n\n## Pricing\nStarting at $9/month",
    "systemPrompt": "You are a conversion-focused landing page designer. Create compelling HTML with strong CTAs.",
    "prompt": "Create a landing page with a hero section, features grid, and pricing table"
  }'
```

## Testing with Different Models

You can now test with different Gemini models without modifying code! Simply pass the `model` parameter:

**Using GET:**
```bash
# Test with Gemini 1.5 Pro (more powerful, slower)
curl "http://localhost:8000/?model=gemini-1.5-pro&content=Hello"

# Test with Gemini 1.5 Flash (faster, lighter)
curl "http://localhost:8000/?model=gemini-1.5-flash&content=Hello"

# Test with Gemini 2.0 Flash Experimental (default, latest)
curl "http://localhost:8000/?model=gemini-2.0-flash-exp&content=Hello"
```

**Using POST:**
```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Test Content",
    "model": "gemini-1.5-pro"
  }'
```

To change the default model for all requests, modify the `DEFAULT_MODEL` constant in `main.ts`.

## Observing the Stream

To see the streaming in action, use curl with verbose output:

```bash
curl -N http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Hello World",
    "prompt": "Generate a simple HTML page"
  }'
```

The `-N` flag disables buffering so you can see tokens as they arrive.

## Error Handling

The service includes error handling for common issues:

1. **Missing API Key**: Returns 500 error with message about API configuration
2. **Invalid JSON**: Returns 400 error if POST body is not valid JSON
3. **Model Errors**: Returns 500 error with detailed error message

## Health Check

Monitor service availability:

```bash
curl http://localhost:8000/health
# Returns: OK
```

## Production Deployment

### Deploy to Deno Deploy

1. Create a project on [deno.com/deploy](https://deno.com/deploy)
2. Link your GitHub repository
3. Set the environment variable `GOOGLE_GENERATIVE_AI_API_KEY`
4. Deploy!

The service will automatically use the PORT provided by Deno Deploy.

### Environment Variables in Production

On Deno Deploy:
1. Go to your project settings
2. Add environment variables:
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your API key

The PORT variable is automatically provided by Deno Deploy.

## Tips and Best Practices

1. **Keep prompts concise**: The more specific your prompt, the better the output
2. **Use system prompts**: Set the behavior/role of the AI
3. **Test locally first**: Always test with your API key locally before deploying
4. **Monitor costs**: Keep an eye on your Google AI API usage
5. **Cache when possible**: Consider caching responses for identical requests
6. **Stream for UX**: The streaming response provides better user experience

## Troubleshooting

### Issue: "Client error (Connect)"
**Solution**: Check your internet connection and verify the npm registry is accessible.

### Issue: "API key not valid"
**Solution**: Verify your `GOOGLE_GENERATIVE_AI_API_KEY` in the `.env` file.

### Issue: "Module not found"
**Solution**: Let Deno download dependencies on first run. Make sure you have internet access.

### Issue: Slow responses
**Solution**: Try using `gemini-1.5-flash` for faster (but potentially lower quality) responses.

## Advanced Usage

### Custom Response Headers

You can modify the response headers in `main.ts` to add custom headers:

```typescript
return new Response(stream.body, {
  headers: {
    "Content-Type": "text/html; charset=utf-8", // Change to HTML
    "Cache-Control": "public, max-age=3600",     // Add caching
    "X-Custom-Header": "value",                  // Custom headers
  },
});
```

### Processing Multiple Requests

The service handles concurrent requests automatically. Deno's runtime is optimized for handling multiple simultaneous connections.

### Logging

Add logging to track usage:

```typescript
console.log(`Request from ${requestContext.ip} - ${requestContext.method} ${requestContext.url}`);
```
