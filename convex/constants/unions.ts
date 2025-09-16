import { v } from "convex/values";

export const statusUnion = v.union(
  v.literal("idea"),
  v.literal("watching"),
  v.literal("executed"),
  v.literal("closed"),
  v.literal("reviewed")
);
