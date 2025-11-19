/**
 * Extracts plain text from BlockNote document blocks
 * @param blocks - Array of BlockNote blocks
 * @returns Concatenated plain text string
 */
export function extractTextFromBlocks(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) {
    return "";
  }

  const textParts: string[] = [];

  for (const block of blocks) {
    if (!block || typeof block !== "object") {
      continue;
    }

    // Extract text from content array
    if (Array.isArray(block.content)) {
      for (const contentItem of block.content) {
        if (typeof contentItem === "string") {
          textParts.push(contentItem);
        } else if (contentItem && typeof contentItem === "object") {
          // Handle inline content objects (text, links, etc.)
          if (contentItem.text) {
            textParts.push(contentItem.text);
          } else if (contentItem.type === "text" && contentItem.text) {
            textParts.push(contentItem.text);
          }
        }
      }
    }

    // Handle nested blocks (e.g., list items)
    if (Array.isArray(block.children)) {
      const childText = extractTextFromBlocks(block.children);
      if (childText) {
        textParts.push(childText);
      }
    }
  }

  return textParts.join(" ").trim();
}

/**
 * Validates that extracted text has meaningful content
 * @param text - Extracted text string
 * @param minLength - Minimum length required (default: 20)
 * @returns boolean indicating if text is valid
 */
export function isValidDescription(text: string, minLength: number = 20): boolean {
  if (!text || typeof text !== "string") {
    return false;
  }

  const trimmed = text.trim();
  return trimmed.length >= minLength && trimmed.length > 0;
}

