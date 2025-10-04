import { v } from "convex/values";
import { api } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import { Generator } from "./testing.generator";

export const createTestDataSet = internalMutation({
  args: {
    amountOfTradeSetup: v.number(),
    seed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const generator = new Generator(args.seed, args.amountOfTradeSetup);

    const tradeSetups = generator.generate();

    // Create Trade setups with the snapshots
    for (const tradeSetup of tradeSetups) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { snapshots, template, ...args } = tradeSetup;
      const createdTradeSetup = await ctx.runMutation(
        api.orchestration.mutations.createTradeSetupWithSnapshot,
        {
          ...args,
          status: snapshots[0].status as Doc<"snapshots">["status"],
          imageId: snapshots[0].imageId as Id<"tradingview_images">,
        }
      );

      await ctx.runMutation(api.snaphot.mutation.updateSnapshot, {
        snapshotId: createdTradeSetup.snapshotId,
        tags: snapshots[0].tags as Doc<"snapshots">["tags"],
        tags_config: snapshots[0].tagsConfig as Doc<"snapshots">["tags_config"],
      });

      // Pop the first item in the array before iterating
      snapshots.shift();
      for (const snapshot of snapshots) {
        await ctx.runMutation(api.snaphot.mutation.createSnapshot, {
          tradeSetupId: createdTradeSetup.tradeSetupId as Id<"trade_setups">,
          status: snapshot.status as Doc<"snapshots">["status"],
          imageId: snapshot.imageId as Id<"tradingview_images">,
          timeframe: snapshot.timeframe,
        });
      }
    }
  },
});
