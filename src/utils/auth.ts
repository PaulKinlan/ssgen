/**
 * Authentication utilities for password-protected endpoints.
 * Used to protect expensive operations like image and video generation.
 */

/**
 * Constant-time string comparison to prevent timing attacks.
 * @param a First string to compare
 * @param b Second string to compare
 * @returns true if strings are equal, false otherwise
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // To avoid leaking length information, we still compare against b
    // with a dummy string of the same length, then return false
    let result = 0;
    for (let i = 0; i < b.length; i++) {
      result |= b.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Validates the media password from the request's Authorization header.
 * Supports Bearer token authentication.
 * 
 * @param req The request object to check for authorization.
 * @returns true if authentication is successful, false otherwise.
 */
export function validateMediaPassword(req: Request): boolean {
  const mediaPassword = Deno.env.get("MEDIA_PASSWORD");
  
  // If no password is configured or explicitly empty, allow all requests (backwards compatible)
  // Note: Setting MEDIA_PASSWORD="" explicitly means "no protection"
  if (!mediaPassword) {
    return true;
  }
  
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    return false;
  }
  
  // Support Bearer token authentication
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return constantTimeEqual(token, mediaPassword);
  }
  
  return false;
}

/**
 * Creates a 401 Unauthorized response for media generation endpoints.
 * 
 * @returns A Response object with 401 status and appropriate headers.
 */
export function createUnauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required for media generation. Please provide a valid Bearer token in the Authorization header.",
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="Media Generation"',
      },
    }
  );
}
