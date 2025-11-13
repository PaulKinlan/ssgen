import { resolve, normalize, isAbsolute } from "@std/path";

/**
 * Load prompt from file or return inline prompt
 * If prompt starts with a path-like string (contains .md), treat it as a file path
 * Otherwise, treat it as an inline prompt
 * 
 * Path resolution treats the prompts/ directory as the root (chroot):
 * - "/element.md" -> prompts/element.md
 * - "element.md" -> prompts/element.md
 * - "./element.md" -> prompts/element.md
 * - "subdir/file.md" -> prompts/subdir/file.md
 * - Paths with ".." are blocked if they escape the prompts directory
 */
export async function resolvePrompt(prompt: string): Promise<string> {
  // Check if this looks like a file path (ends with .md or contains /)
  if (prompt.endsWith('.md') || prompt.includes('/')) {
    try {
      const cwd = Deno.cwd();
      const promptsDir = resolve(cwd, "./prompts");
      
      // Strip leading slash if present to treat prompts/ as root
      let relativePath = prompt;
      if (isAbsolute(prompt)) {
        // Remove the leading slash(es) to make it relative
        relativePath = prompt.replace(/^\/+/, '');
      }
      
      // Normalize the path to remove any ./ and resolve ..
      relativePath = normalize(relativePath);
      
      // Resolve the full path relative to prompts directory
      const promptPath = resolve(promptsDir, relativePath);
      
      // Security check: ensure path is within prompts directory (chroot)
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
