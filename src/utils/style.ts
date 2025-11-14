import { resolve } from "@std/path";
import { StyleConfig } from "./content.ts";

export interface ResolvedStyle {
  brandGuidelines: string[];
  images: ImageContent[];
}

export interface ImageContent {
  path: string;
  mimeType: string;
  data: string; // base64 encoded
}

/**
 * Resolve style configuration from YAML front matter
 * Handles both single style object and array of style objects
 */
export async function resolveStyleConfig(
  style: StyleConfig | StyleConfig[] | undefined
): Promise<ResolvedStyle> {
  const result: ResolvedStyle = {
    brandGuidelines: [],
    images: [],
  };

  if (!style) {
    return result;
  }

  // Normalize to array
  const styleArray = Array.isArray(style) ? style : [style];

  // Process each style configuration
  for (const styleItem of styleArray) {
    if (styleItem.brand) {
      const brandContent = await resolveBrandFile(styleItem.brand);
      if (brandContent) {
        result.brandGuidelines.push(brandContent);
      }
    }

    if (styleItem.image) {
      const imageContent = await resolveImageFile(styleItem.image);
      if (imageContent) {
        result.images.push(imageContent);
      }
    }
  }

  return result;
}

/**
 * Load brand guidelines from file
 * Similar to prompt resolution but for brand files
 */
async function resolveBrandFile(brandPath: string): Promise<string | null> {
  try {
    // Resolve path relative to the current working directory
    const fullPath = resolve(Deno.cwd(), brandPath);
    
    // Security check: ensure path is within allowed directories
    const cwd = Deno.cwd();
    const brandsDir = resolve(cwd, "./brands");
    const contentDir = resolve(cwd, "./content");
    
    // Allow brand files in ./brands or ./content directories
    const isInBrandsDir = fullPath.startsWith(brandsDir + "/") || fullPath === brandsDir;
    const isInContentDir = fullPath.startsWith(contentDir + "/") || fullPath === contentDir;
    
    if (!isInBrandsDir && !isInContentDir) {
      console.error("Brand file path outside of allowed directories:", brandPath);
      return null;
    }
    
    // Read the brand file
    const brandContent = await Deno.readTextFile(fullPath);
    return brandContent.trim();
  } catch (error) {
    console.error("Error reading brand file:", error);
    return null;
  }
}

/**
 * Load and encode image file to base64
 */
async function resolveImageFile(imagePath: string): Promise<ImageContent | null> {
  try {
    // Resolve path relative to the current working directory
    const fullPath = resolve(Deno.cwd(), imagePath);
    
    // Security check: ensure path is within allowed directories
    const cwd = Deno.cwd();
    const imagesDir = resolve(cwd, "./images");
    const contentDir = resolve(cwd, "./content");
    const assetsDir = resolve(cwd, "./assets");
    
    // Allow images in ./images, ./content, or ./assets directories
    const isInImagesDir = fullPath.startsWith(imagesDir + "/") || fullPath === imagesDir;
    const isInContentDir = fullPath.startsWith(contentDir + "/") || fullPath === contentDir;
    const isInAssetsDir = fullPath.startsWith(assetsDir + "/") || fullPath === assetsDir;
    
    if (!isInImagesDir && !isInContentDir && !isInAssetsDir) {
      console.error("Image file path outside of allowed directories:", imagePath);
      return null;
    }
    
    // Read the image file
    const imageData = await Deno.readFile(fullPath);
    
    // Determine MIME type based on file extension
    const mimeType = getMimeType(imagePath);
    
    // Encode to base64 efficiently by building binary string in chunks to avoid stack overflow
    // We build the binary string first, then encode it all at once to produce valid base64
    let binaryString = '';
    const chunkSize = 8192; // Process 8KB at a time
    for (let i = 0; i < imageData.length; i += chunkSize) {
      const chunk = imageData.slice(i, Math.min(i + chunkSize, imageData.length));
      // Build binary string without spread operator to avoid stack overflow
      for (let j = 0; j < chunk.length; j++) {
        binaryString += String.fromCharCode(chunk[j]);
      }
    }
    
    // Now encode the complete binary string to base64
    const base64Data = btoa(binaryString);
    
    return {
      path: imagePath,
      mimeType,
      data: base64Data,
    };
  } catch (error) {
    console.error("Error reading image file:", error);
    return null;
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const extension = filePath.toLowerCase().split(".").pop();
  
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  
  return mimeTypes[extension || ""] || "image/jpeg";
}
