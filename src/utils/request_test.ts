import { assertEquals } from "jsr:@std/assert";
import { buildRequestContext, buildFullPrompt } from "./request.ts";

Deno.test("buildRequestContext extracts Accept-Prompt header", () => {
  const req = new Request("http://localhost:8000/", {
    headers: {
      "Accept-Prompt": "I am a person who likes kittens. Please make sure the output has a kitten influence.",
    },
  });

  const context = buildRequestContext(req);
  assertEquals(context.userPromptPreference, "I am a person who likes kittens. Please make sure the output has a kitten influence.");
});

Deno.test("buildRequestContext returns undefined when Accept-Prompt header is not present", () => {
  const req = new Request("http://localhost:8000/", {
    headers: {},
  });

  const context = buildRequestContext(req);
  assertEquals(context.userPromptPreference, undefined);
});

Deno.test("buildFullPrompt includes user preference when Accept-Prompt is provided", () => {
  const requestContext = {
    headers: { "accept-prompt": "I like kittens" },
    method: "GET",
    url: "http://localhost:8000/",
    userAgent: "TestAgent",
    ip: "127.0.0.1",
    userPromptPreference: "I like kittens",
  };

  const result = buildFullPrompt(
    "Generate an HTML page.",
    "# Hello World",
    requestContext,
    {},
    "en-US"
  );

  assertEquals(result.includes("**User Preference:**"), true);
  assertEquals(result.includes("I like kittens"), true);
  assertEquals(result.includes("Please take this into account"), true);
});

Deno.test("buildFullPrompt does not include user preference section when Accept-Prompt is not provided", () => {
  const requestContext = {
    headers: {},
    method: "GET",
    url: "http://localhost:8000/",
    userAgent: "TestAgent",
    ip: "127.0.0.1",
  };

  const result = buildFullPrompt(
    "Generate an HTML page.",
    "# Hello World",
    requestContext,
    {},
    "en-US"
  );

  assertEquals(result.includes("**User Preference:**"), false);
});
