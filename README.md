# ssgen - Server-Side Generation with AI

A flexible server-side generation service that runs on Deno Deploy. Generate dynamic web pages using AI (Gemini Flash 2.5) from markdown content with streaming support.

## Features

- 🚀 **Deno Deploy Ready**: Built to run on Deno Deploy
- 🤖 **AI-Powered**: Uses Vercel AI SDK with Google's Gemini Flash 2.5
- 📝 **Markdown Support**: Describe content in simple markdown
- 🎨 **Style Influence**: Control output style with brand guidelines and reference images
- 🏷️ **SEO-Friendly**: Add title and description metadata via YAML front matter
- 🌊 **Streaming Responses**: Real-time content generation
- 🔍 **Context-Aware**: LLM has full access to HTTP headers and request variables
- ⚡ **Fast & Flexible**: Easy to change prompts and source data
- 💾 **Smart Caching**: Configurable caching to reduce API calls and improve performance

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
curl "http://localhost:8000/?model=gemini-2.5-pro&content=Hello+World"
```

**POST Request:**
```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# My Content",
    "model": "gemini-2.5-flash-lite",
    "prompt": "Generate a simple HTML page"
  }'
```

Available models include:
- `gemini-2.5-flash` (default)
- `gemini-2.5-flash-lite` (lighter, faster)
- `gemini-2.5-pro` (most powerful)

### Style Influence with Brand Guidelines and Images

You can control the visual style of generated HTML by providing brand guidelines and/or reference images in the YAML front matter of your markdown files:

```yaml
---
style:
  brand: brands/modern-tech.md
  image: images/style-reference.png
---
```

Or use multiple style configurations:

```yaml
---
style:
  - brand: brands/company-brand.md
  - image: images/design-inspiration.png
---
```

**Brand Guidelines:**
- Create markdown files in the `./brands/` or `./content/` directories
- Include information about colors, typography, layout principles, and design philosophy
- The brand guidelines are added to the system prompt and influence the AI's design decisions

**Reference Images:**
- Place images in `./images/`, `./content/`, or `./assets/` directories
- Supported formats: PNG, JPEG, GIF, WebP, SVG
- Images are sent to the AI (multimodal) as visual style inspiration
- The AI analyzes the images and applies similar design aesthetics to the generated HTML

**Example brand guidelines file (`brands/modern-tech.md`):**
```markdown
# Modern Tech Brand Guidelines

## Color Palette
- Primary: Deep Blue (#1a365d)
- Secondary: Electric Cyan (#00d4ff)
- Accent: Vibrant Purple (#9333ea)

## Typography
- Headings: Bold, modern sans-serif
- Body: Clean, readable fonts with good spacing

## Design Principles
- Minimalism with plenty of white space
- Modern design patterns with subtle shadows
- Responsive and accessible
```

**Example usage:**
```bash
# Serve content with style configuration
curl http://localhost:8000/style-brand-example

# Or via POST with inline content
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "---\nstyle:\n  brand: brands/modern-tech.md\n---\n# My Page\n\nContent here"
  }'
```

See the `content/style-*-example.md` files and `brands/` directory for complete examples.

### Request Context

The LLM automatically receives information about the request:
- HTTP method
- Full URL
- User-Agent
- Client IP (from X-Forwarded-For or X-Real-IP headers)
- All HTTP headers

This allows the AI to generate personalized content based on the request context.

### YAML Front Matter

You can include YAML front matter at the beginning of your markdown files to add metadata and customize behavior:

```markdown
---
title: "My Page Title"
description: "A description for SEO and social sharing"
prompt: "custom-prompt.md"
---

# Your Markdown Content

The rest of your content goes here...
```

**Supported Fields:**

- `title` (optional): Page title that will be included in the `<title>` tag of the generated HTML
- `description` (optional): Page description that will be included in a `<meta name="description">` tag
- `prompt` (optional): Custom prompt for the AI. Can be either:
  - An inline string: `prompt: "Create a modern, minimalist design"`
  - A file path relative to the `prompts/` directory:
    - `prompt: "custom-prompt.md"` (resolves to `prompts/custom-prompt.md`)
    - `prompt: "/custom-prompt.md"` (also resolves to `prompts/custom-prompt.md`)
    - `prompt: "subdir/file.md"` (resolves to `prompts/subdir/file.md`)
- `cache` (optional): Configure caching behavior for this specific content:
  - `enabled`: Enable or disable caching (boolean)
  - `ttl`: Cache time-to-live in seconds (number)

**Examples:**

See the `examples/with-metadata.md` file for a complete example of using metadata:

```bash
curl http://localhost:8000/?content="$(cat examples/with-metadata.md | jq -sRr @uri)"
```

Or place a file with metadata in the `content/` directory:

```bash
# content/my-page.md
---
title: "Welcome to My Site"
description: "Learn about our services and offerings"
cache:
  enabled: true
  ttl: 7200  # Cache for 2 hours
---

# My Content
...
```

Then access it at `/my-page` or `/my-page.html`.

**Cache Configuration Example:**

You can disable caching for specific content or set a custom TTL:

```markdown
---
title: "Real-time Dashboard"
cache:
  enabled: false  # Disable caching for this page
---

# Live Data
This page shows real-time information...
```

Or set a longer cache duration for static content:

```markdown
---
title: "Company History"
cache:
  ttl: 86400  # Cache for 24 hours
---

# Our Story
Founded in 1990...
```

## API Reference

### Endpoints

#### `GET/POST /` or `/generate`

Generate content from markdown.

**Query Parameters (GET):**
- `content` (optional): Markdown content to process
- `prompt` (optional): User prompt for the LLM
- `systemPrompt` (optional): System prompt to configure LLM behavior
- `model` (optional): Model to use (e.g., "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"). Defaults to "gemini-2.5-flash"

**Request Body (POST):**
```json
{
  "content": "Markdown content here",
  "prompt": "Optional user prompt",
  "systemPrompt": "Optional system prompt",
  "model": "Optional model name (e.g., gemini-2.5-flash)"
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
- `CACHE_ENABLED` (optional): Enable or disable content caching, defaults to `true`
- `CACHE_TTL` (optional): Cache time-to-live in seconds, defaults to `3600` (1 hour)

### Changing the Model

You can now specify which model to use on a per-request basis using the `model` parameter in query strings (GET) or request body (POST). This allows you to dynamically choose the model without changing code:

```bash
# Use gemini-2.5-pro for a specific request
curl "http://localhost:8000/?model=gemini-2.5-pro&content=Hello"
```

The default model is `gemini-2.5-flash`. Available models include:
- `gemini-2.5-flash` (default)
- `gemini-2.5-flash-lite` (lighter, faster)
- `gemini-2.5-pro` (most powerful)

To change the default model for all requests, edit the `DEFAULT_MODEL` constant in `main.ts`:

```typescript
const DEFAULT_MODEL = "gemini-2.5-flash"; // Change this to any supported model
```

Thanks to the Vercel AI SDK, you can also easily switch to other providers (OpenAI, Anthropic, etc.) by changing the import and model initialization.

### Content Caching

To improve performance and reduce API costs, ssgen includes a built-in caching mechanism that stores generated content in memory.

**How it works:**
- When a request is made, the system generates a unique cache key based on the content, prompts, model, and other parameters
- If cached content exists and hasn't expired, it's returned immediately (cache HIT)
- Otherwise, new content is generated via the AI model and cached for future requests (cache MISS)
- Responses include an `X-Cache: HIT` or `X-Cache: MISS` header to indicate cache status
- Proper `Cache-Control` headers are set based on the TTL configuration (e.g., `Cache-Control: public, max-age=3600`)

**Global Configuration:**

Set default caching behavior via environment variables:

```bash
# Enable or disable caching (default: true)
CACHE_ENABLED=true

# Set cache TTL in seconds (default: 3600 = 1 hour)
CACHE_TTL=3600
```

**Per-Content Configuration:**

Override caching behavior for specific content files using YAML front matter:

```markdown
---
title: "My Page"
cache:
  enabled: true   # Enable/disable caching for this page
  ttl: 7200       # Cache for 2 hours (overrides CACHE_TTL)
---

# Content here...
```

This allows you to:
- Disable caching for dynamic/real-time content (`enabled: false`)
- Set longer cache durations for static content (e.g., `ttl: 86400` for 24 hours)
- Set shorter cache durations for frequently updated content (e.g., `ttl: 300` for 5 minutes)

**Monitoring Cache Performance:**

Check cache statistics via the health endpoint:

```bash
curl http://localhost:8000/health?stats
```

Response example:
```json
{
  "hits": 150,
  "misses": 25,
  "size": 20,
  "hitRate": "85.71%"
}
```

**Cache Behavior:**
- Cache is in-memory and resets when the server restarts
- Expired entries are automatically cleaned up every 5 minutes
- Each unique combination of content, prompts, and settings gets its own cache entry
- Disable caching by setting `CACHE_ENABLED=false` for dynamic content scenarios

## Examples

See the `examples/` directory for sample markdown files:
- `sample-content.md`: A portfolio page example
- `blog-post.md`: A blog post example
- `with-metadata.md`: Example showing YAML front matter with title and description metadata

### Style Influence Examples

See the `content/` directory for style influence examples:
- `style-brand-example.md`: Using brand guidelines
- `style-image-example.md`: Using reference images
- `style-combined-example.md`: Combining both approaches

For detailed documentation on the style influence feature, see [STYLE_EXAMPLES.md](STYLE_EXAMPLES.md).

## Development

Run the development server with auto-reload:
```bash
deno task dev
```

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.