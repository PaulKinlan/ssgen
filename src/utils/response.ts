/**
 * This module handles content negotiation and response generation.
 */

import {
  generateStreamingResponse,
  generateImageResponse,
  generateVideoResponse,
  generateJsonResponse,
} from "./ai.ts";
import { buildFullPrompt, buildRequestContext } from "./request.ts";
import { accepts, acceptsLanguages } from "@std/http/negotiation";
import { validateMediaPassword, createUnauthorizedResponse } from "./auth.ts";

/**
 * Generates a response based on the request's Accept header.
 *
 * @param req The request object.
 * @param systemPrompt The system prompt to use.
 * @param userPrompt The user prompt to use.
 * @param markdownContent The markdown content to use.
 * @param requestContext The request context.
 * @param metadata The metadata to use.
 * @param modelName The name of the model to use.
 * @param styleConfig The style configuration to use.
 * @param cacheOptions The cache options to use.
 * @returns A response object.
 */
export async function generateResponse(
  req: Request,
  systemPrompt: string,
  userPrompt: string,
  markdownContent: string,
  requestContext: ReturnType < typeof buildRequestContext > ,
  metadata: {
    title ? : string;
    description ? : string
  },
  modelName: string,
  styleConfig ? : any,
  cacheOptions ? : any,
): Promise < Response > {
  const acceptHeader = req.headers.get("Accept") || "text/html";

  console.log("[Content Negotiation] Accept header:", acceptHeader);

  // Get the preferred language from the Accept-Language header.
  const languages = acceptsLanguages(req);
  const preferredLanguage = languages && languages.length > 0 ? languages[0] : "en-US";

  const fullPrompt = buildFullPrompt(
    userPrompt,
    markdownContent,
    requestContext,
    metadata,
    preferredLanguage,
  );

  // Manual content negotiation since accepts() doesn't support wildcards as patterns
  let contentType: string;
  
  // Check if Accept header includes image types
  if (acceptHeader.includes("image/")) {
    contentType = "image/*";
  }
  // Check if Accept header includes video types
  else if (acceptHeader.includes("video/")) {
    contentType = "video/*";
  }
  // Check for JSON
  else if (acceptHeader.includes("application/json")) {
    contentType = "application/json";
  }
  // Default to HTML
  else {
    contentType = "text/html";
  }

  console.log("[Content Negotiation] Negotiated content type:", contentType);

  let selectedModel = modelName;
  if (!modelName) {
    if (contentType === "image/*") {
      selectedModel = "gemini-3-pro-image-preview";
    } else if (contentType === "text/html" || contentType === "application/json") {
      selectedModel = "gemini-2.5-flash";
    } else if (contentType === "video/*") {
      selectedModel = "veo-3.1-fast-generate-preview";
    }
  }

  console.log("[Model Selection] Selected model:", selectedModel, "for content type:", contentType);


  if (contentType === "image/*") {
    // Validate password for expensive image generation
    if (!validateMediaPassword(req)) {
      console.log("[Auth] Unauthorized request for image generation");
      return createUnauthorizedResponse();
    }
    console.log("[Response Type] Generating image response");
    return generateImageResponse(
      systemPrompt,
      fullPrompt,
      selectedModel,
    );
  }

  if (contentType === "video/*") {
    // Validate password for expensive video generation
    if (!validateMediaPassword(req)) {
      console.log("[Auth] Unauthorized request for video generation");
      return createUnauthorizedResponse();
    }
    console.log("[Response Type] Generating video response");
    return generateVideoResponse(
      systemPrompt,
      fullPrompt,
      selectedModel,
    );
  }

  if (contentType === "application/json") {
    console.log("[Response Type] Generating JSON response");
    return generateJsonResponse(
        systemPrompt,
        fullPrompt,
        selectedModel,
        );
  }

  console.log("[Response Type] Generating HTML streaming response");
  return generateStreamingResponse(
    systemPrompt,
    fullPrompt,
    selectedModel,
    styleConfig,
    cacheOptions,
  );
}