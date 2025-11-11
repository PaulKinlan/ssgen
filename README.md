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

### Serving Content from Files

The server can automatically serve markdown files from the `content/` directory:

```bash
# Visit /about or /about.html to see content from content/about.md
curl http://localhost:8000/about

# Visit /contact or /contact.html to see content from content/contact.md
curl http://localhost:8000/contact
```

To add your own pages:
1. Create a markdown file in the `content/` directory (e.g., `content/services.md`)
2. Access it at `/services` or `/services.html`

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

### Custom Model Selection

You can specify which Gemini model to use via query parameter (GET) or request body (POST):

**GET Request:**
```bash
curl "http://localhost:8000/?model=gemini-1.5-pro&content=Hello+World"
```

**POST Request:**
```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# My Content",
    "model": "gemini-1.5-flash",
    "prompt": "Generate a simple HTML page"
  }'
```

Available models include:
- `gemini-2.0-flash-exp` (default, latest experimental)
- `gemini-1.5-pro` (more powerful, slower)
- `gemini-1.5-flash` (faster, lighter)

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
- `model` (optional): Model to use (e.g., "gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"). Defaults to "gemini-2.0-flash-exp"

**Request Body (POST):**
```json
{
  "content": "Markdown content here",
  "prompt": "Optional user prompt",
  "systemPrompt": "Optional system prompt",
  "model": "Optional model name (e.g., gemini-2.0-flash-exp)"
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

You can now specify which model to use on a per-request basis using the `model` parameter in query strings (GET) or request body (POST). This allows you to dynamically choose the model without changing code:

```bash
# Use gemini-1.5-pro for a specific request
curl "http://localhost:8000/?model=gemini-1.5-pro&content=Hello"
```

The default model is `gemini-2.0-flash-exp`. Available models include:
- `gemini-2.0-flash-exp` (default, latest experimental)
- `gemini-1.5-pro` (more powerful, slower)
- `gemini-1.5-flash` (faster, lighter)

To change the default model for all requests, edit the `DEFAULT_MODEL` constant in `main.ts`:

```typescript
const DEFAULT_MODEL = "gemini-2.0-flash-exp"; // Change this to any supported model
```

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