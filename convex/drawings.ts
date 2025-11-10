import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for drawings
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Save drawing metadata after successful upload
export const saveDrawing = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const drawingId = await ctx.db.insert("drawings", {
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      contentType: args.contentType,
      uploadedAt: Date.now(),
    });

    return drawingId;
  },
});

// Get drawing by ID
export const getDrawing = query({
  args: {
    id: v.optional(v.id("drawings")),
  },
  handler: async (ctx, args) => {
    if (!args.id) return null;
    const drawing = await ctx.db.get(args.id);

    if (!drawing) {
      return null;
    }

    const url = await ctx.storage.getUrl(drawing.storageId);

    return {
      ...drawing,
      url,
    };
  },
});

// Delete a drawing
export const deleteDrawing = mutation({
  args: {
    id: v.id("drawings"),
  },
  handler: async (ctx, args) => {
    const drawing = await ctx.db.get(args.id);

    if (!drawing) {
      throw new Error("Drawing not found");
    }

    // Delete the file from storage
    await ctx.storage.delete(drawing.storageId);

    // Delete the database record
    await ctx.db.delete(args.id);

    return { success: true, deletedId: args.id };
  },
});

export const updateDrawing = mutation({
  args: {
    id: v.id("drawings"),
    offsetY: v.number(),
  },
  handler: async (ctx, { id, ...args }) => {
    const image = await ctx.db.get(id);

    if (!image) {
      throw new ConvexError("Image not found");
    }

    await ctx.db.patch(id, args);
  },
});
