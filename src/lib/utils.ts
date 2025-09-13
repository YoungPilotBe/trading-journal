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
