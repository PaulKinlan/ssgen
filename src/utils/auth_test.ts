import { assertEquals } from "jsr:@std/assert";
import { validateMediaPassword, createUnauthorizedResponse } from "./auth.ts";

// Helper to temporarily set environment variable
function withEnv(key: string, value: string | undefined, fn: () => void): void {
  const original = Deno.env.get(key);
  if (value !== undefined) {
    Deno.env.set(key, value);
  } else {
    Deno.env.delete(key);
  }
  try {
    fn();
  } finally {
    if (original !== undefined) {
      Deno.env.set(key, original);
    } else {
      Deno.env.delete(key);
    }
  }
}

Deno.test("validateMediaPassword - allows all requests when no password is set", () => {
  withEnv("MEDIA_PASSWORD", undefined, () => {
    const req = new Request("http://localhost:8000/", {
      headers: {},
    });
    assertEquals(validateMediaPassword(req), true);
  });
});

Deno.test("validateMediaPassword - allows all requests when password is empty string", () => {
  withEnv("MEDIA_PASSWORD", "", () => {
    const req = new Request("http://localhost:8000/", {
      headers: {},
    });
    assertEquals(validateMediaPassword(req), true);
  });
});

Deno.test("validateMediaPassword - denies requests without Authorization header when password is set", () => {
  withEnv("MEDIA_PASSWORD", "secret123", () => {
    const req = new Request("http://localhost:8000/", {
      headers: {},
    });
    assertEquals(validateMediaPassword(req), false);
  });
});

Deno.test("validateMediaPassword - denies requests with wrong Bearer token", () => {
  withEnv("MEDIA_PASSWORD", "secret123", () => {
    const req = new Request("http://localhost:8000/", {
      headers: {
        "Authorization": "Bearer wrongpassword",
      },
    });
    assertEquals(validateMediaPassword(req), false);
  });
});

Deno.test("validateMediaPassword - allows requests with correct Bearer token", () => {
  withEnv("MEDIA_PASSWORD", "secret123", () => {
    const req = new Request("http://localhost:8000/", {
      headers: {
        "Authorization": "Bearer secret123",
      },
    });
    assertEquals(validateMediaPassword(req), true);
  });
});

Deno.test("validateMediaPassword - denies requests with invalid Authorization format", () => {
  withEnv("MEDIA_PASSWORD", "secret123", () => {
    const req = new Request("http://localhost:8000/", {
      headers: {
        "Authorization": "Basic dXNlcjpwYXNz", // Basic auth format
      },
    });
    assertEquals(validateMediaPassword(req), false);
  });
});

Deno.test("validateMediaPassword - denies requests with malformed Bearer token", () => {
  withEnv("MEDIA_PASSWORD", "secret123", () => {
    const req = new Request("http://localhost:8000/", {
      headers: {
        "Authorization": "Bearersecret123", // Missing space
      },
    });
    assertEquals(validateMediaPassword(req), false);
  });
});

Deno.test("createUnauthorizedResponse - returns 401 status", async () => {
  const response = createUnauthorizedResponse();
  assertEquals(response.status, 401);
});

Deno.test("createUnauthorizedResponse - returns JSON content type", async () => {
  const response = createUnauthorizedResponse();
  assertEquals(response.headers.get("Content-Type"), "application/json");
});

Deno.test("createUnauthorizedResponse - includes WWW-Authenticate header", async () => {
  const response = createUnauthorizedResponse();
  assertEquals(response.headers.get("WWW-Authenticate"), 'Bearer realm="Media Generation"');
});

Deno.test("createUnauthorizedResponse - includes error message in body", async () => {
  const response = createUnauthorizedResponse();
  const body = await response.json();
  assertEquals(body.error, "Unauthorized");
  assertEquals(typeof body.message, "string");
});
