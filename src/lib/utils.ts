import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ParsedFilename {
  asset: string;
  date: string;
  time: string;
  id: string;
}

export function parseFilename(filename: string): ParsedFilename {
  const [asset, date, time, id] = filename.replace(/\.[^/.]+$/, "").split("_");
  return { asset, date, time, id };
}

export function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Formats an R-Multiple value to a specified number of decimal places
 * @param value - The number to format
 * @param decimals - The number of decimal places (default: 2)
 * @param addPrefix - Whether to add a "+" prefix if the value is above zero (default: false)
 * @returns The formatted string
 */
export function formatRMultiple(
  value: number,
  options?: {
    decimals?: number;
    addPrefix?: boolean;
  }
): string {
  const formatted = value.toFixed(options?.decimals ?? 2);
  if (options?.addPrefix && value > 0) {
    return `+ ${formatted}`;
  }
  return formatted;
}
