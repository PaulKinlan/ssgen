# Style Influence Examples

This document provides detailed examples of how to use the style influence feature to control the visual appearance of generated HTML.

## Overview

The style influence feature allows you to guide the AI's design decisions by providing:
1. **Brand Guidelines**: Markdown files describing your brand's visual identity
2. **Reference Images**: Visual examples that inspire the design aesthetic

## YAML Front Matter Syntax

### Single Style Configuration

```yaml
---
style:
  brand: brands/my-brand.md
---
```

Or with an image:

```yaml
---
style:
  image: images/design-reference.png
---
```

### Multiple Style Configurations

You can combine brand guidelines and images, or use multiple sources:

```yaml
---
style:
  - brand: brands/company-brand.md
  - image: images/style-guide.png
  - brand: brands/additional-guidelines.md
---
```

## Example 1: Brand Guidelines Only

**File:** `content/style-brand-example.md`

```yaml
---
style:
  brand: brands/modern-tech.md
---

# Welcome to TechCorp

## Innovative Solutions

Content here...
```

**What happens:**
- The AI reads the brand guidelines from `brands/modern-tech.md`
- Guidelines are added to the system prompt
- The generated HTML follows the specified colors, typography, and design principles
- No images are sent to the AI in this case

**Access:** `http://localhost:8000/style-brand-example`

## Example 2: Reference Image Only

**File:** `content/style-image-example.md`

```yaml
---
style:
  image: images/modern-style.png
---

# Portfolio Showcase

Content here...
```

**What happens:**
- The image is loaded and encoded to base64
- The image is sent to the AI along with the text prompt (multimodal)
- The AI analyzes the visual style (colors, layout, typography) from the image
- Generated HTML reflects the aesthetic of the reference image

**Access:** `http://localhost:8000/style-image-example`

## Example 3: Combined Brand and Image

**File:** `content/style-combined-example.md`

```yaml
---
style:
  - brand: brands/elegant-minimal.md
  - image: images/modern-style.png
---

# Artisan Gallery

Content here...
```

**What happens:**
- Both brand guidelines and image are processed
- Brand guidelines are added to the system prompt
- The image is sent to the AI for visual inspiration
- The AI combines written guidelines with visual style from the image
- Results in HTML that follows both brand rules and visual aesthetics

**Access:** `http://localhost:8000/style-combined-example`

## Creating Brand Guidelines

### Structure

A good brand guidelines file should include:

```markdown
# Brand Name

## Brand Identity
Brief description of the brand personality and values

## Color Palette
- Primary: Color Name (#hex)
- Secondary: Color Name (#hex)
- Accent: Color Name (#hex)
- Neutral: Color Name (#hex)
- Text: Color Name (#hex)

## Typography
- Headings: Font families and characteristics
- Body: Font families and specifications
- Special notes about font usage

## Design Principles
1. **Principle 1**: Description
2. **Principle 2**: Description
3. **Principle 3**: Description

## Layout Guidelines
- Content width specifications
- Spacing and padding rules
- Grid or layout system details
- Component styles (cards, buttons, etc.)

## Visual Style
- Specific styling details
- Animation preferences
- Shadow/depth specifications
- Iconography guidelines
```

### Best Practices

1. **Be Specific**: Provide exact hex colors, font names, and measurements
2. **Be Clear**: Use descriptive language about visual appearance
3. **Include Examples**: Describe what you want (and what you don't want)
4. **Prioritize**: Put the most important guidelines first
5. **Stay Consistent**: Use the same brand file across multiple pages for consistency

## Image Guidelines

### Supported Formats

- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- GIF (`.gif`)
- WebP (`.webp`)
- SVG (`.svg`)

### Image Selection Tips

Choose reference images that clearly demonstrate:
- **Color scheme** you want to emulate
- **Layout style** and spatial organization
- **Typography** approach (even if the AI can't use exact fonts)
- **Visual hierarchy** and element prominence
- **Overall aesthetic** (minimalist, bold, elegant, playful, etc.)

### Where to Place Images

Images can be stored in:
- `./images/` - Recommended for style reference images
- `./content/` - For content-specific images
- `./assets/` - For general asset files

## Security Considerations

The style resolution system includes security checks:

- **Brand files** must be in `./brands/` or `./content/` directories
- **Image files** must be in `./images/`, `./content/`, or `./assets/` directories
- Path traversal attempts (using `..`) are blocked
- Files outside allowed directories will not be loaded

## Advanced Usage

### Per-Request Style Override

While the front matter is the primary way to specify style, you can still override system prompts and prompts via API:

```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "---\nstyle:\n  brand: brands/modern-tech.md\n---\n# Content",
    "systemPrompt": "Additional system instructions...",
    "prompt": "Custom prompt..."
  }'
```

The brand guidelines will be appended to your system prompt automatically.

### Combining with Custom Prompts

You can use style configuration alongside custom prompts from the front matter:

```yaml
---
prompt: prompts/landing-page.md
style:
  brand: brands/company-brand.md
  image: images/hero-inspiration.png
---

# Landing Page Content
```

This gives you maximum control over both the content generation instructions and the visual style.

## Troubleshooting

### Brand Guidelines Not Applied

- Check that the brand file path is correct relative to the project root
- Verify the brand file exists in `./brands/` or `./content/`
- Look at server logs for file read errors
- Ensure the markdown format is valid

### Images Not Influencing Style

- Verify the image file exists at the specified path
- Check that the image format is supported
- Ensure the image is in an allowed directory
- Look for errors in server logs about image loading
- Note: The model must support vision capabilities (Gemini 2.5 models do)

### Style Changes Not Visible

- Try with different, more explicit brand guidelines
- Use clearer reference images with distinct visual characteristics
- Remember: AI interpretation may vary; be specific in guidelines
- Consider using both brand guidelines AND images for stronger influence

## Examples in This Repository

1. **`content/style-brand-example.md`** - Uses `brands/modern-tech.md` for a tech company look
2. **`content/style-image-example.md`** - Uses a reference image for style inspiration
3. **`content/style-combined-example.md`** - Combines `brands/elegant-minimal.md` with an image

Try accessing these at:
- http://localhost:8000/style-brand-example
- http://localhost:8000/style-image-example
- http://localhost:8000/style-combined-example

## API Integration

For programmatic access:

```javascript
const response = await fetch('http://localhost:8000/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: `---
style:
  brand: brands/modern-tech.md
---
# My Page
Content here`
  })
});

const html = await response.text();
```

The response will be a streaming HTML response with the applied style.
