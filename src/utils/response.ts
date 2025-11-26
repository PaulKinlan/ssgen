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
  const preferredLanguage = parseAcceptLanguage(req.headers.get("Accept-Language") || "")[0] || "en-US";

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

  if (contentType === "image/*") {
    return generateImageResponse(
      systemPrompt,
      fullPrompt,
      modelName,
    );
  }

  if (contentType === "video/*") {
    return generateVideoResponse(
      systemPrompt,
      fullPrompt,
      modelName,
    );
  }

  if (contentType === "application/json") {
    return generateJsonResponse(
        systemPrompt,
        fullPrompt,
        modelName,
        );
  }

  return generateStreamingResponse(
    systemPrompt,
    fullPrompt,
    modelName,
    styleConfig,
    cacheOptions,
  );
}