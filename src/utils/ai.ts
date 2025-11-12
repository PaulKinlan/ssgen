import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { createCodeFenceStripper, createStreamingHeaders } from "./streaming.ts";
import { ResolvedStyle } from "./style.ts";

/**
 * Generate streaming HTML response from AI
 */
export async function generateStreamingResponse(
  systemPrompt: string,
  fullPrompt: string,
  modelName: string,
  styleConfig?: ResolvedStyle
): Promise<Response> {
  // Initialize Gemini model
  const model = google(modelName, {
    apiKey: Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY")
  });

  // Enhance system prompt with brand guidelines if provided
  let enhancedSystemPrompt = systemPrompt;
  if (styleConfig && styleConfig.brandGuidelines.length > 0) {
    const brandSection = styleConfig.brandGuidelines
      .map((brand, idx) => `\n\n**Brand Guidelines ${idx + 1}:**\n${brand}`)
      .join("");
    enhancedSystemPrompt = `${systemPrompt}${brandSection}\n\nIMPORTANT: Follow the brand guidelines above when generating the HTML output.`;
  }

  // Check if we have images to include (multimodal content)
  if (styleConfig && styleConfig.images.length > 0) {
    // Build multimodal content array
    const contentParts = [
      { type: "text" as const, text: fullPrompt },
      ...styleConfig.images.map((img) => ({
        type: "image" as const,
        image: `data:${img.mimeType};base64,${img.data}`,
      })),
    ];

    // Add instruction about the images
    contentParts.unshift({
      type: "text" as const,
      text: "The following images represent the visual style and design aesthetic that should influence the generated HTML output. Use these as inspiration for colors, layout, typography, and overall design direction.",
    });

    // Stream with multimodal content
    const result = streamText({
      model,
      system: enhancedSystemPrompt,
      messages: [
        {
          role: "user",
          content: contentParts,
        },
      ],
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

  // Stream the response (text-only mode)
  const result = streamText({
    model,
    system: enhancedSystemPrompt,
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
