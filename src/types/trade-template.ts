import { Id } from "convex/_generated/dataModel";

export interface Drawing {
  _id: Id<"drawings">;
  storageId: Id<"_storage">;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: number;
  tradeTemplateId?: Id<"trade_templates">;
  url?: string; // Added by the useGetDrawing hook
}
