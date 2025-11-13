import { globalCache, createCacheKey } from "./cache.ts";
import { generateStreamingResponse } from "./ai.ts";
import { ResolvedStyle } from "./style.ts";

/**
 * Generate a response with caching support
 * If cache is enabled and a cached version exists, return it immediately
 * Otherwise, generate new content, cache it, and return it
 */
export async function getCachedOrGenerateResponse(
  cacheKey: string,
  systemPrompt: string,
  fullPrompt: string,
  modelName: string,
  styleConfig?: ResolvedStyle
): Promise<Response> {
  // Try to get from cache
  const cached = globalCache.get(cacheKey);
  
  if (cached) {
    console.log("Cache HIT for key:", cacheKey.substring(0, 50) + "...");
    // Return cached content as a regular response
    return new Response(cached, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Cache": "HIT",
      },
    });
  }

  console.log("Cache MISS for key:", cacheKey.substring(0, 50) + "...");
  
  // Generate new content
  const response = await generateStreamingResponse(
    systemPrompt,
    fullPrompt,
    modelName,
    styleConfig
  );

  // For streaming responses, we need to consume the stream, cache it, and return a new response
  if (response.body) {
    // Read the entire stream
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      // Combine all chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Convert to string and cache
      const text = new TextDecoder().decode(combined);
      globalCache.set(cacheKey, text);
      
      // Return the content
      return new Response(text, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Cache": "MISS",
        },
      });
    } catch (error) {
      console.error("Error reading stream:", error);
      // If there's an error reading the stream, just return the original response
      return response;
    }
  }

  // If there's no body (shouldn't happen), return the response as-is
  return response;
}
