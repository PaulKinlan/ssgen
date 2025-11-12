# Source Code Structure

This directory contains the refactored code for the ssgen server.

## Directory Structure

```
src/
├── routes/          # Route handlers
│   ├── index.ts     # Main router
│   ├── health.ts    # Health check endpoint
│   ├── generate.ts  # Main generation endpoint (/ and /generate)
│   └── content.ts   # Content directory serving endpoint
└── utils/           # Shared utilities
    ├── ai.ts        # AI model initialization and streaming
    ├── constants.ts # Shared constants (default prompts, models, content)
    ├── content.ts   # YAML front matter parsing
    ├── prompt.ts    # Prompt resolution (file or inline)
    ├── request.ts   # Request context and parameter extraction
    └── streaming.ts # Transform streams for code fence stripping
```

## Routes

### Health Route (`/health`)
Simple health check endpoint that returns "OK".

### Generate Route (`/` and `/generate`)
Main generation endpoint that:
- Serves an HTML form for GET requests without content
- Processes markdown content and generates HTML using AI
- Supports query parameters and POST body parameters:
  - `content`: Markdown content to process
  - `prompt`: User prompt for the LLM
  - `systemPrompt`: System prompt to configure LLM behavior
  - `model`: Model to use (e.g., "gemini-2.5-flash")

### Content Route (all other paths)
Serves markdown files from the `/content` directory:
- Maps URL paths to `.md` files (e.g., `/about` → `/content/about.md`)
- Supports `.html` extension (e.g., `/about.html` → `/content/about.md`)
- Now supports query parameters for `model`, `systemPrompt`, and `prompt` overrides
- Uses YAML front matter for custom prompts

## Utilities

### AI Utilities (`ai.ts`)
- `generateStreamingResponse()`: Main function to generate streaming HTML from AI

### Constants (`constants.ts`)
- `DEFAULT_CONTENT`: Default markdown content for the welcome page
- `DEFAULT_SYSTEM_PROMPT`: Default system prompt for AI generation
- `DEFAULT_MODEL`: Default AI model name

### Content Utilities (`content.ts`)
- `parseYamlFrontMatter()`: Parse YAML front matter from markdown files
- Types: `YamlFrontMatter`, `ParsedContent`

### Prompt Utilities (`prompt.ts`)
- `resolvePrompt()`: Load prompt from file or return inline prompt

### Request Utilities (`request.ts`)
- `buildRequestContext()`: Build request context from Request object
- `buildFullPrompt()`: Build full prompt with request context
- `extractRequestParams()`: Extract parameters from request (query params and body)
- Types: `RequestContext`, `RequestBody`

### Streaming Utilities (`streaming.ts`)
- `createCodeFenceStripper()`: Create transform stream to strip markdown code fences
- `createStreamingHeaders()`: Create headers for streaming responses

## Benefits of This Structure

1. **No Duplication**: Code that was duplicated 2x in main.ts now exists once
2. **Clear Separation**: Each file has a single, clear responsibility
3. **Easy Testing**: Utilities and routes can be tested independently
4. **Better Maintainability**: Changes to functionality are localized
5. **Type Safety**: Shared types defined in utility modules
6. **Bug Fixed**: Content route now supports all query parameter overrides
