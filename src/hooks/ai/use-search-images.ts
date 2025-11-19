import { openai } from "@/ai/openai";
import { useMutation } from "@tanstack/react-query";
import { generateText } from "ai";
import { toast } from "sonner";

export interface ImageSearchResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  description?: string;
  author?: string;
}

interface SearchImagesParams {
  description: string;
}

interface GoogleImageSearchItem {
  link: string;
  title?: string;
  snippet?: string;
  image?: {
    thumbnailLink?: string;
    width?: number;
    height?: number;
  };
}

interface GoogleCustomSearchError {
  error?: {
    message?: string;
    reason?: string;
    errors?: Array<{
      message?: string;
      reason?: string;
    }>;
  };
}

interface GoogleCustomSearchResponse {
  items?: GoogleImageSearchItem[];
  searchInformation?: {
    searchTime?: number;
    totalResults?: string;
  };
}

/**
 * Hook to search for images using OpenAI to generate search query and Google Custom Search API
 */
export const useSearchImages = () => {
  return useMutation({
    mutationFn: async ({
      description,
    }: SearchImagesParams): Promise<ImageSearchResult[]> => {
      console.log("[useSearchImages] 🚀 Starting image search");
      console.log(
        "[useSearchImages] Input description length:",
        description.length
      );
      console.log(
        "[useSearchImages] Input description preview:",
        description.substring(0, 100) + "..."
      );

      // Step 1: Use OpenAI to generate an optimized search query
      console.log(
        "[useSearchImages] 📝 Step 1: Generating search query with OpenAI..."
      );
      let searchQuery: string;
      try {
        const startTime = Date.now();
        const result = await generateText({
          model: openai("gpt-4o-mini"),
          prompt: `Based on the following trading template description, generate a concise search query (2-5 words) that would help find relevant illustrations or diagrams. Focus on visual concepts, trading patterns, or technical analysis elements. the idea behind is to find a fitting illustration of the concept that is explained below

Description: ${description}

Generate only the search query, nothing else:`,
        });
        const duration = Date.now() - startTime;
        searchQuery = result.text.trim();
        console.log(
          "[useSearchImages] ✅ Generated search query:",
          searchQuery
        );
        console.log("[useSearchImages] Query generation took:", duration, "ms");
        toast.info(`Search query: ${searchQuery}`);
      } catch (error) {
        console.error("[useSearchImages] ❌ OpenAI error:", error);
        console.error("[useSearchImages] Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw new Error(
          `Failed to generate search query: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      if (!searchQuery) {
        console.error("[useSearchImages] ❌ Empty search query generated");
        throw new Error("Failed to generate search query - empty result");
      }

      // Step 2: Search Google Images using Custom Search API
      console.log("[useSearchImages] 🔍 Step 2: Searching Google Images...");
      const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const googleCx = import.meta.env.VITE_GOOGLE_CX;

      console.log("[useSearchImages] Environment variables check:", {
        hasApiKey: !!googleApiKey,
        hasCx: !!googleCx,
        apiKeyPrefix: googleApiKey
          ? googleApiKey.substring(0, 10) + "..."
          : "missing",
        cxPrefix: googleCx ? googleCx.substring(0, 10) + "..." : "missing",
      });

      if (!googleApiKey) {
        console.error("[useSearchImages] ❌ Missing VITE_GOOGLE_API_KEY");
        throw new Error("Google API key not configured (VITE_GOOGLE_API_KEY)");
      }

      if (!googleCx) {
        console.error("[useSearchImages] ❌ Missing VITE_GOOGLE_CX");
        throw new Error(
          "Google Custom Search Engine ID (CX) not configured (VITE_GOOGLE_CX)"
        );
      }

      // Build URL with proper parameters
      // Note: 'num' parameter must be between 1-10 for Google Custom Search API
      const params = new URLSearchParams({
        key: googleApiKey,
        cx: googleCx,
        q: searchQuery,
        searchType: "image",
        num: "10", // Max 10 results per request
        safe: "active", // Safe search: active, medium, or off
      });

      const apiUrl = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
      const sanitizedUrl = apiUrl
        .replace(/key=[^&]+/, "key=***")
        .replace(/cx=[^&]+/, "cx=***");
      console.log("[useSearchImages] API URL (sanitized):", sanitizedUrl);
      console.log("[useSearchImages] Request parameters:", {
        query: searchQuery,
        searchType: "image",
        num: "10",
        safe: "active",
      });

      let response: Response;
      try {
        const fetchStartTime = Date.now();
        response = await fetch(apiUrl);
        const fetchDuration = Date.now() - fetchStartTime;
        console.log("[useSearchImages] 📡 Fetch response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          duration: fetchDuration + "ms",
          headers: Object.fromEntries(response.headers.entries()),
        });
      } catch (error) {
        console.error("[useSearchImages] ❌ Network fetch error:", error);
        console.error("[useSearchImages] Error details:", {
          message: error instanceof Error ? error.message : "Unknown error",
          name: error instanceof Error ? error.name : undefined,
        });
        throw new Error(
          `Network error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      if (!response.ok) {
        let errorData: GoogleCustomSearchError = {};
        let errorText: string = "";
        try {
          errorText = await response.text();
          console.error("[useSearchImages] ❌ Error response text:", errorText);
          errorData = JSON.parse(errorText) as GoogleCustomSearchError;
          console.error(
            "[useSearchImages] ❌ Google API error response:",
            JSON.stringify(errorData, null, 2)
          );
        } catch (parseError) {
          console.error(
            "[useSearchImages] ❌ Failed to parse error response:",
            parseError
          );
          console.error("[useSearchImages] Raw error text:", errorText);
        }

        const errorMessage = errorData.error?.message || response.statusText;
        const errorDetails =
          errorData.error?.errors?.[0]?.message ||
          errorData.error?.message ||
          "Unknown error";
        const errorReason =
          errorData.error?.errors?.[0]?.reason ||
          errorData.error?.reason ||
          "unknown";

        console.error("[useSearchImages] Error summary:", {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          details: errorDetails,
          reason: errorReason,
          fullError: errorData,
        });

        throw new Error(
          `Google Custom Search API error (${response.status}): ${errorMessage}. Reason: ${errorReason}. Details: ${errorDetails}`
        );
      }

      let data: GoogleCustomSearchResponse;
      try {
        const parseStartTime = Date.now();
        const responseText = await response.text();
        console.log(
          "[useSearchImages] Response text length:",
          responseText.length
        );
        data = JSON.parse(responseText) as GoogleCustomSearchResponse;
        const parseDuration = Date.now() - parseStartTime;
        console.log("[useSearchImages] ✅ Successfully parsed response:", {
          hasItems: !!data.items,
          itemsCount: data.items?.length || 0,
          searchInformation: data.searchInformation,
          parseDuration: parseDuration + "ms",
        });
      } catch (parseError) {
        console.error(
          "[useSearchImages] ❌ Failed to parse response JSON:",
          parseError
        );
        console.error("[useSearchImages] Parse error details:", {
          message:
            parseError instanceof Error ? parseError.message : "Unknown error",
        });
        throw new Error("Failed to parse Google API response");
      }

      if (!data.items || !Array.isArray(data.items)) {
        console.warn("[useSearchImages] ⚠️ No items found in response");
        console.warn("[useSearchImages] Response structure:", {
          keys: Object.keys(data),
          itemsType: typeof data.items,
          itemsValue: data.items,
          searchInformation: data.searchInformation,
        });
        return [];
      }

      // Step 3: Transform Google Custom Search results to our format
      console.log(
        "[useSearchImages] 🔄 Step 3: Transforming",
        data.items.length,
        "results..."
      );
      const results = data.items.map(
        (item: GoogleImageSearchItem, index: number) => {
          const result = {
            id: item.link || `google-image-${index}`,
            url: item.link,
            thumbnailUrl: item.image?.thumbnailLink || item.link,
            description: item.title || item.snippet,
            author: undefined, // Google Images doesn't provide author info in Custom Search API
          };

          if (index < 3) {
            // Log first 3 items for debugging
            console.log(`[useSearchImages] Result ${index + 1}:`, {
              id: result.id.substring(0, 50) + "...",
              url: result.url.substring(0, 50) + "...",
              hasThumbnail: !!item.image?.thumbnailLink,
              thumbnailUrl:
                item.image?.thumbnailLink?.substring(0, 50) + "..." || "none",
              description:
                result.description?.substring(0, 50) + "..." || "none",
            });
          }

          return result;
        }
      );

      console.log(
        "[useSearchImages] ✅ Successfully found",
        results.length,
        "images"
      );
      console.log("[useSearchImages] 🎉 Image search completed successfully");
      return results;
    },
  });
};
