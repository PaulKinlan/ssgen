# ssgen - Server-Side Generation with AI

A flexible server-side generation service that runs on Deno Deploy. Generate dynamic web pages using AI (Gemini Flash 2.5) from markdown content with streaming support.

## Features

- 🚀 **Deno Deploy Ready**: Built to run on Deno Deploy
- 🤖 **AI-Powered**: Uses Vercel AI SDK with Google's Gemini Flash 2.5
- 📝 **Markdown Support**: Describe content in simple markdown
- 🌊 **Streaming Responses**: Real-time content generation
- 🔍 **Context-Aware**: LLM has full access to HTTP headers and request variables
- ⚡ **Fast & Flexible**: Easy to change prompts and source data

## Quick Start

### Prerequisites

- [Deno](https://deno.land/) installed (v1.37+)
- Google AI API Key (get one at [ai.google.dev](https://ai.google.dev))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PaulKinlan/ssgen.git
cd ssgen
```

2. Create a `.env` file with your API key:
```bash
cp .env.example .env
# Edit .env and add your GOOGLE_GENERATIVE_AI_API_KEY
```

3. Run the server:
```bash
deno task dev
```

The server will start on `http://localhost:8000`

## Usage

### Basic Request

Make a GET request to generate content from default markdown:
```bash
curl http://localhost:8000/
```

### Custom Markdown Content

Send markdown content via query parameter:
```bash
curl "http://localhost:8000/?content=$(cat examples/sample-content.md | jq -sRr @uri)"
```

Or via POST request:
```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Hello World\nThis is my markdown content.",
    "prompt": "Convert this to beautiful HTML",
    "systemPrompt": "You are a web design expert."
  }'
```

**Using the Helper Script:**

For easier POST request management, use the included `ssgen-post.sh` script:

```bash
# Use content from a file
./ssgen-post.sh -f examples/sample-content.md

# Provide inline content
./ssgen-post.sh -c "# Hello World\n\nThis is my content."

# Custom prompt and system prompt
./ssgen-post.sh -f examples/blog-post.md \
  -p "Create a modern blog layout" \
  -s "You are a web design expert"

# Save output to file
./ssgen-post.sh -f examples/sample-content.md -o output.html

# Show all options
./ssgen-post.sh --help
```

### Custom Prompts

You can customize both the system prompt and user prompt:

```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# My Blog\n\nWelcome to my blog!",
    "systemPrompt": "You are an expert in creating modern, responsive web designs with Tailwind CSS.",
    "prompt": "Create a beautiful landing page with a hero section and modern styling."
  }'
```

### Request Context

The LLM automatically receives information about the request:
- HTTP method
- Full URL
- User-Agent
- Client IP (from X-Forwarded-For or X-Real-IP headers)
- All HTTP headers

This allows the AI to generate personalized content based on the request context.

## API Reference

### Endpoints

#### `GET/POST /` or `/generate`

Generate content from markdown.

**Query Parameters (GET):**
- `content` (optional): Markdown content to process
- `prompt` (optional): User prompt for the LLM
- `systemPrompt` (optional): System prompt to configure LLM behavior

**Request Body (POST):**
```json
{
  "content": "Markdown content here",
  "prompt": "Optional user prompt",
  "systemPrompt": "Optional system prompt"
}
```

**Response:**
Streaming text response with generated content.

#### `GET /health`

Health check endpoint.

**Response:**
```
OK
```

## Deploy to Deno Deploy

1. Install the Deno Deploy CLI:
```bash
deno install --allow-all --no-check -r -f https://deno.land/x/deploy/deployctl.ts
```

2. Deploy your project:
```bash
deployctl deploy --project=your-project-name main.ts
```

3. Set environment variables in the Deno Deploy dashboard:
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google AI API key

## Configuration

### Environment Variables

- `GOOGLE_GENERATIVE_AI_API_KEY` (required): Your Google AI API key
- `PORT` (optional): Server port, defaults to 8000

### Changing the Model

To use a different model, edit `main.ts` and change the model identifier in the `google()` function:

```typescript
const model = google("gemini-2.0-flash-exp"); // Change this to any supported model
```

Available models include:
- `gemini-2.0-flash-exp` (default)
- `gemini-1.5-pro`
- `gemini-1.5-flash`

Thanks to the Vercel AI SDK, you can also easily switch to other providers (OpenAI, Anthropic, etc.) by changing the import and model initialization.

## Examples

See the `examples/` directory for sample markdown files:
- `sample-content.md`: A portfolio page example
- `blog-post.md`: A blog post example

## Development

Run the development server with auto-reload:
```bash
deno task dev
```

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.