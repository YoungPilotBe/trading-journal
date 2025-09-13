import { useMemo } from "react";

export const useDocumentTitle = (document: unknown) => {
  return useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (document as any)?.[0]?.content?.[0]?.text ?? "Untitled";
    } catch (error) {
      console.warn("Error extracting document title:", error);
      return "Untitled";
    }
  }, [document]);
};
