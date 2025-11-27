/**
 * Authentication utilities for password-protected endpoints.
 * Used to protect expensive operations like image and video generation.
 */

/**
 * Validates the media password from the request's Authorization header.
 * Supports Bearer token authentication.
 * 
 * @param req The request object to check for authorization.
 * @returns true if authentication is successful, false otherwise.
 */
export function validateMediaPassword(req: Request): boolean {
  const mediaPassword = Deno.env.get("MEDIA_PASSWORD");
  
  // If no password is configured, allow all requests (backwards compatible)
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
    return token === mediaPassword;
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
