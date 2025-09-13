import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

export const useUploadDrawing = () => {
  const generateUploadUrl = useConvexMutation(api.drawings.generateUploadUrl);
  const saveDrawing = useConvexMutation(api.drawings.saveDrawing);

  return useMutation({
    mutationFn: async ({ file }: { file: Blob }) => {
      // Step 1: Generate upload URL
      const uploadUrl = await generateUploadUrl({});

      // Step 2: Upload the file
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await uploadResponse.json();

      // Step 3: Save drawing metadata
      const drawingId = await saveDrawing({
        storageId,
        fileName: `drawing_${Date.now()}.png`,
        fileSize: file.size,
        contentType: file.type,
      });

      return { drawingId, storageId };
    },
  });
};
