import { assertEquals } from "jsr:@std/assert";
import { generateResponse } from "./response.ts";
import * as ai from "./ai.ts";
import { mock } from "jsr:@std/testing/mock";

Deno.test("generateResponse should return HTML by default", async () => {
  const req = new Request("http://localhost:8000/", {
    headers: {},
  });

  const generateStreamingResponseMock = mock(ai, "generateStreamingResponse", () => {
    return new Response("<html></html>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  });

  try {
    const response = await generateResponse(
      req,
      "system",
      "user",
      "markdown",
      { headers: new Headers() },
      {},
      "gemini-1.5-flash",
    );
    assertEquals(response.headers.get("Content-Type"), "text/html; charset=utf-8");
  } finally {
    generateStreamingResponseMock.restore();
  }
});

Deno.test("generateResponse should return JSON when Accept header is application/json", async () => {
  const req = new Request("http://localhost:8000/", {
    headers: {
      "Accept": "application/json",
    },
  });

  const generateJsonResponseMock = mock(ai, "generateJsonResponse", () => {
    return new Response("{}", {
      headers: { "Content-Type": "application/json" },
    });
  });

  try {
    const response = await generateResponse(
      req,
      "system",
      "user",
      "markdown",
      { headers: new Headers() },
      {},
      "gemini-1.5-flash",
    );
    assertEquals(response.headers.get("Content-Type"), "application/json");
  } finally {
    generateJsonResponseMock.restore();
  }
});

Deno.test("generateResponse should return an image when Accept header is image/*", async () => {
    const req = new Request("http://localhost:8000/", {
      headers: {
        "Accept": "image/*",
      },
    });

    const generateImageResponseMock = mock(ai, "generateImageResponse", () => {
      return new Response("image data", {
        headers: { "Content-Type": "image/png" },
      });
    });

    try {
      const response = await generateResponse(
        req,
        "system",
        "user",
        "markdown",
        { headers: new Headers() },
        {},
        "gemini-1.5-flash",
      );
      assertEquals(response.headers.get("Content-Type"), "image/png");
    } finally {
      generateImageResponseMock.restore();
    }
  });

  Deno.test("generateResponse should return a video when Accept header is video/*", async () => {
    const req = new Request("http://localhost:8000/", {
      headers: {
        "Accept": "video/*",
      },
    });

    const generateVideoResponseMock = mock(ai, "generateVideoResponse", () => {
      return new Response("video data", {
        headers: { "Content-Type": "video/mp4" },
      });
    });

    try {
      const response = await generateResponse(
        req,
        "system",
        "user",
        "markdown",
        { headers: new Headers() },
        {},
        "gemini-1.5-flash",
      );
      assertEquals(response.headers.get("Content-Type"), "video/mp4");
    } finally {
      generateVideoResponseMock.restore();
    }
  });