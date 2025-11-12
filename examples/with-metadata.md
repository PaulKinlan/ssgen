---
title: "Complete Guide to Server-Side Generation"
description: "Learn how to use server-side generation with AI to create dynamic, SEO-friendly web pages. This comprehensive guide covers all the features and best practices."
---

# Server-Side Generation with Metadata

This example demonstrates how to use YAML front matter to add SEO-friendly metadata to your generated pages.

## How It Works

When you include `title` and `description` in the YAML front matter, the AI will automatically include them in the generated HTML:

- The **title** will be added to the `<title>` tag
- The **description** will be added to a `<meta name="description">` tag

## Benefits

1. **Better SEO**: Search engines can understand your content better
2. **Social Sharing**: Proper metadata improves how your pages appear when shared
3. **User Experience**: Clear titles help users understand what the page is about

## Example YAML Front Matter

```yaml
---
title: "Your Page Title Here"
description: "A clear, concise description of your page content for SEO."
prompt: "Optional: Custom prompt for the AI"
---
```

This content will be transformed into a beautiful, semantic HTML page with proper metadata!
