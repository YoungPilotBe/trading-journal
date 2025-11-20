import { openai } from "@/ai/openai";
import { useMutation } from "@tanstack/react-query";
import { generateText } from "ai";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
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

export const useSearchImages = () => {
  const searchImagesAction = useAction(api.image_search.actions.searchImages);

  return useMutation({
    mutationFn: async ({
      description,
    }: SearchImagesParams): Promise<ImageSearchResult[]> => {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `Based on the following trading template description, generate a concise search query (2-5 words) that would help find relevant illustrations or diagrams. Focus on visual concepts, trading patterns, or technical analysis elements. the idea behind is to find a fitting illustration of the concept that is explained below

Description: ${description}

Generate only the search query, nothing else:`,
      });

      const searchQuery = result.text.trim();
      if (!searchQuery) {
        throw new Error("Failed to generate search query");
      }

      toast.info(`Search query: ${searchQuery}`);
      const results = await searchImagesAction({ query: searchQuery });
      return results || [];
    },
  });
};
