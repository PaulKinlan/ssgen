import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { createCodeFenceStripper, createStreamingHeaders } from "./streaming.ts";

/**
 * Generate streaming HTML response from AI
 */
export async function generateStreamingResponse(
  systemPrompt: string,
  fullPrompt: string,
  modelName: string
): Promise<Response> {
  // Initialize Gemini model
  const model = google(modelName, {
    apiKey: Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY")
  });

  // Stream the response
  const result = streamText({
    model,
    system: systemPrompt,
    prompt: fullPrompt,
  });

  // Create a streaming response
  const stream = result.toTextStreamResponse();

  // Create transform stream to strip code fences
  const transformStream = createCodeFenceStripper();

  // Pipe the stream through the transformer
  const transformedStream = stream.body?.pipeThrough(transformStream);

  // Return the streaming response with appropriate headers
  return new Response(transformedStream, {
    headers: createStreamingHeaders(),
  });
}
