interface TransformerContext {
  buffer: string;
  hasStarted: boolean;
  hasEnded: boolean;
}

/**
 * Create a transform stream to strip markdown code fences from AI output
 * This removes ```html or ``` markers that the AI might add
 */
export function createCodeFenceStripper(): TransformStream<Uint8Array, Uint8Array> {
  return new TransformStream<Uint8Array, Uint8Array>({
    start(this: TransformerContext) {
      this.buffer = '';
      this.hasStarted = false;
      this.hasEnded = false;
    },
    transform(this: TransformerContext, chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) {
      const text = new TextDecoder().decode(chunk);
      this.buffer += text;

      // Check if we haven't started outputting yet and we have a code fence
      if (!this.hasStarted) {
        // Look for opening code fence pattern (```html or ``` at the start)
        const codeFenceMatch = this.buffer.match(/^```(?:html)?\s*\n/);
        if (codeFenceMatch) {
          // Strip the opening fence
          this.buffer = this.buffer.slice(codeFenceMatch[0].length);
          this.hasStarted = true;
        } else if (this.buffer.length > 10 && !this.buffer.startsWith('```')) {
          // If we have enough content and no fence, start outputting
          this.hasStarted = true;
        }
      }

      // Output content if we've started
      if (this.hasStarted && !this.hasEnded) {
        // Check for closing code fence
        const closingFenceIndex = this.buffer.indexOf('```');
        if (closingFenceIndex !== -1) {
          // Output everything before the closing fence
          const content = this.buffer.slice(0, closingFenceIndex);
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
          this.buffer = '';
          this.hasEnded = true;
        } else {
          // Output all but the last few characters (in case closing fence is split across chunks)
          const safeLength = Math.max(0, this.buffer.length - 3);
          if (safeLength > 0) {
            const content = this.buffer.slice(0, safeLength);
            controller.enqueue(new TextEncoder().encode(content));
            this.buffer = this.buffer.slice(safeLength);
          }
        }
      }
    },
    flush(this: TransformerContext, controller: TransformStreamDefaultController<Uint8Array>) {
      // Output any remaining buffered content
      if (this.hasStarted && this.buffer) {
        controller.enqueue(new TextEncoder().encode(this.buffer));
      }
    }
  });
}

export interface CacheOptions {
  enabled?: boolean;
  ttl?: number;
}

/**
 * Create streaming response headers
 * @param cacheOptions - Optional cache configuration from YAML front matter
 */
export function createStreamingHeaders(cacheOptions?: CacheOptions): HeadersInit {
  // Determine Cache-Control header value
  let cacheControl: string;
  
  if (cacheOptions?.enabled === false) {
    // Explicitly disabled in YAML
    cacheControl = "no-cache, no-store, must-revalidate";
  } else if (cacheOptions?.ttl !== undefined) {
    // Custom TTL specified in YAML
    cacheControl = `public, max-age=${cacheOptions.ttl}`;
  } else {
    // Default from environment or fallback
    const defaultTTL = parseInt(Deno.env.get("CACHE_TTL") || "3600");
    const cacheEnabled = Deno.env.get("CACHE_ENABLED") !== "false";
    
    if (cacheEnabled) {
      cacheControl = `public, max-age=${defaultTTL}`;
    } else {
      cacheControl = "no-cache, no-store, must-revalidate";
    }
  }
  
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": cacheControl,
    "Connection": "keep-alive",
    "X-Content-Type-Options": "nosniff",
  };
}
