/**
 * Shared constants used across the application
 */

// Default markdown content
export const DEFAULT_CONTENT = `# Welcome to Server-Side Generation

This is a demo of server-side generation with AI.

You can customize this content by providing markdown in your request.`;

// Default system prompt
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant that generates web pages based on markdown content.
You should convert the markdown into well-structured HTML with appropriate styling.
Make the output visually appealing and professional.
IMPORTANT: Output only raw HTML without any markdown code fences or backticks. Do not wrap the HTML in \`\`\`html or any other code fence markers.`;

// Default model
export const DEFAULT_MODEL = "gemini-2.5-flash";
