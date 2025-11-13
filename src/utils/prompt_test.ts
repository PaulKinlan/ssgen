import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resolve } from "@std/path";
import { resolvePrompt } from "./prompt.ts";

// Test helper to create temporary prompt files
async function setupTestPrompt(filename: string, content: string): Promise<void> {
  const promptsDir = resolve(Deno.cwd(), "./prompts");
  const testPath = resolve(promptsDir, filename);
  await Deno.writeTextFile(testPath, content);
}

async function cleanupTestPrompt(filename: string): Promise<void> {
  const promptsDir = resolve(Deno.cwd(), "./prompts");
  const testPath = resolve(promptsDir, filename);
  try {
    await Deno.remove(testPath);
  } catch {
    // Ignore errors if file doesn't exist
  }
}

Deno.test("resolvePrompt - inline prompt", async () => {
  const result = await resolvePrompt("This is an inline prompt");
  assertEquals(result, "This is an inline prompt");
});

Deno.test("resolvePrompt - file path without leading slash", async () => {
  const testContent = "Test prompt content from file";
  await setupTestPrompt("test-prompt.md", testContent);
  
  try {
    const result = await resolvePrompt("test-prompt.md");
    assertEquals(result, testContent);
  } finally {
    await cleanupTestPrompt("test-prompt.md");
  }
});

Deno.test("resolvePrompt - file path with leading slash (chroot behavior)", async () => {
  const testContent = "Test prompt with leading slash";
  await setupTestPrompt("test-slash.md", testContent);
  
  try {
    // Leading slash should be treated as relative to prompts/ directory
    const result = await resolvePrompt("/test-slash.md");
    assertEquals(result, testContent);
  } finally {
    await cleanupTestPrompt("test-slash.md");
  }
});

Deno.test("resolvePrompt - file path with ./ prefix", async () => {
  const testContent = "Test prompt with ./ prefix";
  await setupTestPrompt("test-dot.md", testContent);
  
  try {
    const result = await resolvePrompt("./test-dot.md");
    assertEquals(result, testContent);
  } finally {
    await cleanupTestPrompt("test-dot.md");
  }
});

Deno.test("resolvePrompt - subdirectory path", async () => {
  const testContent = "Test prompt in subdirectory";
  const promptsDir = resolve(Deno.cwd(), "./prompts");
  const subdir = resolve(promptsDir, "subdir");
  
  // Create subdirectory
  await Deno.mkdir(subdir, { recursive: true });
  await setupTestPrompt("subdir/test-sub.md", testContent);
  
  try {
    const result = await resolvePrompt("subdir/test-sub.md");
    assertEquals(result, testContent);
  } finally {
    await cleanupTestPrompt("subdir/test-sub.md");
    try {
      await Deno.remove(subdir);
    } catch {
      // Ignore errors
    }
  }
});

Deno.test("resolvePrompt - path with .. that escapes prompts directory (should fail gracefully)", async () => {
  // Attempting to escape prompts directory should return the prompt as inline
  const result = await resolvePrompt("../outside.md");
  assertEquals(result, "../outside.md"); // Returns as inline prompt when path is invalid
});

Deno.test("resolvePrompt - existing element.md prompt", async () => {
  // Test with actual existing file
  const result = await resolvePrompt("element.md");
  // Should successfully read the element.md file
  assertEquals(typeof result, "string");
  assertEquals(result.length > 0, true);
});

Deno.test("resolvePrompt - existing testprompt.md prompt", async () => {
  // Test with actual existing file
  const result = await resolvePrompt("testprompt.md");
  // Should successfully read the testprompt.md file
  assertEquals(typeof result, "string");
  assertEquals(result.length > 0, true);
});

Deno.test("resolvePrompt - non-existent file (should fail gracefully)", async () => {
  // Non-existent file should return the prompt as inline
  const result = await resolvePrompt("non-existent-file.md");
  assertEquals(result, "non-existent-file.md"); // Falls back to inline prompt
});
