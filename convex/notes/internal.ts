import { v } from "convex/values";
import { api } from "../_generated/api";
import { Doc } from "../_generated/dataModel";
import { internalQuery } from "../_generated/server";

/**
 * Collect all notes from multiple snapshots
 */
export const collectAllNotesFromSnapshots = internalQuery({
  args: {
    snapshotIds: v.array(v.id("snapshots")),
  },

  handler: async (ctx, { snapshotIds }) => {
    const allNotes: Doc<"notes">[] = [];

    for (const snapshotId of snapshotIds) {
      const snapshotNotes = await ctx.runQuery(
        api.notes.queries.getNotesSnapshot,
        { snapshotId }
      );
      allNotes.push(...snapshotNotes);
    }

    return allNotes;
  },
});
