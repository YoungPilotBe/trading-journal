import { z } from "zod";
import type { InputFieldSchema } from "./node-creators";

/**
 * Input field schemas for forms
 */
export const customPrice = (): InputFieldSchema => ({
  schema: z.coerce.number().positive("Price must be positive"),
  placeholder: "Enter price...",
  custom: [{ key: "price", transform: (rawValue: unknown) => rawValue }],
});

export const customDrives = (): InputFieldSchema => ({
  schema: z.coerce
    .number()
    .int("Drives must be a whole number")
    .positive("Drives must be positive"),
  placeholder: "Enter # drives",
  custom: [{ key: "drives", transform: (rawValue: unknown) => rawValue }],
});
