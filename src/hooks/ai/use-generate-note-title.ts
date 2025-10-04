import { openai } from "@/ai/openai";
import { useMutation } from "@tanstack/react-query";
import { generateObject } from "ai";
import z from "zod";

interface GenerateNoteTitleParams {
  content: string;
}

export const useGenerateNoteTitle = () => {
  return useMutation({
    mutationFn: async ({
      content,
    }: GenerateNoteTitleParams): Promise<string> => {
      if (!content || content.trim().length === 0) {
        throw new Error("Content is required to generate a title");
      }

      try {
        const {
          object: { title },
        } = await generateObject({
          model: openai("gpt-5-mini"),
          schema: z.object({
            title: z.string(),
          }),
          prompt: `Based on the following note content, generate a concise and descriptive title (maximum 60 characters). The title should capture the main topic or key points of the note.

Note content:
${content}

Generate only the title, no additional text or formatting.`,
        });

        return title.trim();
      } catch (error) {
        console.error("Error generating note title:", error);
        throw new Error("Failed to generate note title. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Note title generation failed:", error);
    },
  });
};
