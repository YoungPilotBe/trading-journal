import { Id } from "convex/_generated/dataModel";

export interface TradeTemplate {
  _id: Id<"trade_templates">;
  document: any; // BlockNote document structure
  drawingId?: Id<"drawings">;
  imageIds: Id<"tradingview_images">[];
  createdAt: number;
  updatedAt: number;
}

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
