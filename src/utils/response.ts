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
import { accepts, parseAcceptLanguage } from "@std/http/negotiation";

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

  // Get the preferred language from the Accept-Language header.
  const languages = parseAcceptLanguage(req.headers.get("Accept-Language") || "");
  const preferredLanguage = languages && languages.length > 0 ? languages[0] : "en-US";

  const fullPrompt = buildFullPrompt(
    userPrompt,
    markdownContent,
    requestContext,
    metadata,
    preferredLanguage,
  );

  const contentType = accepts(req, {
    header: "Accept",
    supports: [
      "text/html",
      "image/*",
      "video/*",
      "application/json",
    ],
    default: "text/html",
  });

  let selectedModel = modelName;
  if (!modelName) {
    if (contentType === "image/*") {
      selectedModel = "gemini-2.5-flash-image";
    } else if (contentType === "text/html" || contentType === "application/json") {
      selectedModel = "gemini-1.5-flash";
    } else if (contentType === "video/*") {
      selectedModel = "veo-3.1-generate-preview";
    }
  }


  if (contentType === "image/*") {
    return generateImageResponse(
      systemPrompt,
      fullPrompt,
      selectedModel,
    );
  }

  if (contentType === "video/*") {
    return generateVideoResponse(
      systemPrompt,
      fullPrompt,
      selectedModel,
    );
  }

  if (contentType === "application/json") {
    return generateJsonResponse(
        systemPrompt,
        fullPrompt,
        selectedModel,
        );
  }

  return generateStreamingResponse(
    systemPrompt,
    fullPrompt,
    selectedModel,
    styleConfig,
    cacheOptions,
  );
}