import { resolve } from "@std/path";

/**
 * Load prompt from file or return inline prompt
 * If prompt starts with a path-like string (contains .md), treat it as a file path
 * Otherwise, treat it as an inline prompt
 */
export async function resolvePrompt(prompt: string): Promise<string> {
  // Check if this looks like a file path (ends with .md or contains /)
  if (prompt.endsWith('.md') || prompt.includes('/')) {
    try {
      // Resolve path relative to the current working directory
      const promptPath = resolve(Deno.cwd(), prompt);
      
      // Security check: ensure path is within allowed directories
      const cwd = Deno.cwd();
      const promptsDir = resolve(cwd, "./prompts");

      console.log(promptPath, promptsDir)
      
      if (!promptPath.startsWith(promptsDir + "/") && promptPath !== promptsDir) {
        console.error("Prompt file path outside of prompts directory:", prompt);
        return prompt; // Return as inline prompt if path is invalid
      }
      
      // Read the prompt file
      const promptContent = await Deno.readTextFile(promptPath);
      return promptContent.trim();
    } catch (error) {
      console.error("Error reading prompt file:", error);
      return prompt; // Fall back to treating it as inline prompt
    }
  }
  
  // Treat as inline prompt
  return prompt;
}
