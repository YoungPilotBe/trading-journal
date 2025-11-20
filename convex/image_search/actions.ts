import { v } from "convex/values";
import { action } from "../_generated/server";

interface SerpApiImageResult {
  link: string;
  original?: string;
  thumbnail?: string;
  title?: string;
  source?: string;
}

interface SerpApiResponse {
  images_results?: SerpApiImageResult[];
  error?: string;
}

export const searchImages = action({
  args: {
    query: v.string(),
  },
  handler: async (_, args) => {
    const serpApiKey = process.env.SERPAPI_KEY;
    if (!serpApiKey) {
      throw new Error("SerpAPI key not configured");
    }

    const params = new URLSearchParams({
      engine: "google_images",
      q: args.query,
      api_key: serpApiKey,
      num: "10",
      safe: "active",
    });

    const response = await fetch(
      `https://serpapi.com/search?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status}`);
    }

    const data = (await response.json()) as SerpApiResponse;

    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    if (!data.images_results?.length) {
      return [];
    }

    return data.images_results.map((item, index) => {
      const imageUrl = item.original || item.link;
      return {
        id: imageUrl || `image-${index}`,
        url: imageUrl,
        thumbnailUrl: item.thumbnail || imageUrl,
        description: item.title,
        author: item.source,
      };
    });
  },
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;

  while (i < bytes.length) {
    const a = bytes[i++];
    const b = i < bytes.length ? bytes[i++] : 0;
    const c = i < bytes.length ? bytes[i++] : 0;
    const bitmap = (a << 16) | (b << 8) | c;

    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : "=";
    result += i - 1 < bytes.length ? chars.charAt(bitmap & 63) : "=";
  }

  return result;
}

function isImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.startsWith("image/");
}

function isImageData(arrayBuffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.length < 4) return false;

  // Check common image file signatures
  // PNG: 89 50 4E 47
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return true;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  // GIF: 47 49 46 38
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  )
    return true;
  // WebP: Check for "RIFF" header
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    // Check for "WEBP" further in
    if (
      bytes.length >= 12 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    )
      return true;
  }

  return false;
}

export const downloadImage = action({
  args: {
    imageUrl: v.string(),
  },
  handler: async (_, args) => {
    "use node";

    const response = await fetch(args.imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");

    // Validate content type is an image
    if (!isImageContentType(contentType)) {
      throw new Error(
        `Invalid content type: ${contentType || "unknown"}. Expected an image file.`
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    // Validate the data is actually an image by checking magic bytes
    if (!isImageData(arrayBuffer)) {
      throw new Error("Downloaded file is not a valid image format");
    }

    return {
      data: arrayBufferToBase64(arrayBuffer),
      contentType: contentType || "image/png",
    };
  },
});
