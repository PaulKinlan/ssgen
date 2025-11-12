import { router } from "./src/routes/index.ts";

// Start the server
const port = parseInt(Deno.env.get("PORT") || "8000");

console.log(`Server starting on port ${port}...`);
console.log(`Local: http://localhost:${port}`);

Deno.serve({ port }, router);
