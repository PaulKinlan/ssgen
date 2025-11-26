import { google } from "@ai-sdk/google";
import { streamText, streamObject } from "ai";
import { createCodeFenceStripper, createStreamingHeaders, CacheOptions } from "./streaming.ts";
import { ResolvedStyle } from "./style.ts";
import { z } from "zod";

/**
 * Generate streaming HTML response from AI
 */
export async function generateStreamingResponse(
  systemPrompt: string,
  fullPrompt: string,
  modelName: string,
  styleConfig?: ResolvedStyle,
  cacheOptions?: CacheOptions
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
      headers: createStreamingHeaders(cacheOptions),
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
    headers: createStreamingHeaders(cacheOptions),
  });
}

/**
 * Generate image response from AI
 */
export async function generateImageResponse(
    systemPrompt: string,
    fullPrompt: string,
    modelName: string,
    styleConfig?: ResolvedStyle,
    cacheOptions?: CacheOptions
  ): Promise<Response> {
    const apiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const imageBase64 = data.candidates[0].content.parts[0].inlineData.data;
    const imageBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));

    return new Response(imageBytes, {
      headers: {
        "Content-Type": "image/png"
      },
    });
  }

  /**
   * Generate video response from AI
   */
  export async function generateVideoResponse(
    systemPrompt: string,
    fullPrompt: string,
    modelName: string,
    styleConfig?: ResolvedStyle,
    cacheOptions?: CacheOptions
  ): Promise<Response> {
    // TODO: This implementation uses a synchronous polling loop, which will block
    // the Deno event loop. In a production environment, this should be replaced
    // with a more robust asynchronous solution, such as a webhook or a separate
    // worker process to handle the polling.
    const apiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
    const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    const url = `${baseUrl}/models/veo-3.1-generate-preview:predictLongRunning?key=${apiKey}`;

    const initialResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{
          prompt: fullPrompt
        }]
      }),
    });

    if (!initialResponse.ok) {
      throw new Error(`HTTP error! status: ${initialResponse.status}`);
    }

    const operation = await initialResponse.json();
    const operationName = operation.name;

    let statusResponse;
    let isDone = false;

    while (!isDone) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds

      const statusUrl = `${baseUrl}/${operationName}?key=${apiKey}`;
      const response = await fetch(statusUrl);
      statusResponse = await response.json();
      isDone = statusResponse.done;
    }

    const videoUri = statusResponse.response.generateVideoResponse.generatedSamples[0].video.uri;
    const videoResponse = await fetch(videoUri, {
      headers: {
        "x-goog-api-key": apiKey
      }
    });

    return new Response(videoResponse.body, {
      headers: {
        "Content-Type": "video/mp4"
      },
    });
  }

/**
 * Generate JSON response from AI
 */
export async function generateJsonResponse(
    systemPrompt: string,
    fullPrompt: string,
    modelName: string,
    styleConfig?: ResolvedStyle,
    cacheOptions?: CacheOptions
  ): Promise<Response> {
    const model = google(modelName, {
      apiKey: Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY")
    });

    const result = await streamObject({
      model,
      system: systemPrompt,
      prompt: fullPrompt,
      schema: z.object({
        content: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
      }),
    });

    const jsonResponse = await result.json;

    return new Response(JSON.stringify(jsonResponse, null, 2), {
      headers: {
        "Content-Type": "application/json"
      },
    });
  }