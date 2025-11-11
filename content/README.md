# Content Directory

This directory contains markdown files that are served dynamically by the ssgen server.

## How It Works

When you visit a URL path like `/about` or `/about.html`, the server will:

1. Look for a corresponding markdown file in this directory (e.g., `about.md`)
2. Read the markdown content
3. Use AI to generate HTML from the markdown
4. Stream the result back to the browser

## Examples

- Visit `/about` or `/about.html` → serves `about.md`
- Visit `/contact` or `/contact.html` → serves `contact.md`

## Adding New Pages

To add a new page:

1. Create a new markdown file in this directory (e.g., `services.md`)
2. Add your content in markdown format
3. Access it at `/services` or `/services.html`

## Special Paths

The following paths are NOT served from this directory:

- `/` - Default welcome page with instructions
- `/generate` - Custom content generation endpoint
- `/health` - Health check endpoint

These paths continue to work as before with their original functionality.
