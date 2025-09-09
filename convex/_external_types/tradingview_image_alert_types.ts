/* eslint-disable @typescript-eslint/no-explicit-any */
import { type FunctionReference, anyApi } from "convex/server";
import { type GenericId as Id } from "convex/values";

export const api: PublicApiType = anyApi as unknown as PublicApiType;
export const internal: InternalApiType = anyApi as unknown as InternalApiType;

export type PublicApiType = {
  fileStorage: {
    generateUploadUrl: FunctionReference<
      "mutation",
      "public",
      Record<string, never>,
      any
    >;
    saveFileMetadata: FunctionReference<
      "mutation",
      "public",
      {
        contentType: string;
        fileName: string;
        fileSize: number;
        source?: string;
        storageId: Id<"_storage">;
        uploadedAt: number;
      },
      any
    >;
    getFileById: FunctionReference<
      "query",
      "public",
      { fileId: Id<"files"> },
      any
    >;
    listFiles: FunctionReference<
      "query",
      "public",
      { limit?: number; source?: string },
      any
    >;
    deleteFile: FunctionReference<
      "mutation",
      "public",
      { fileId: Id<"files"> },
      any
    >;
  };
};
export type InternalApiType = {};
