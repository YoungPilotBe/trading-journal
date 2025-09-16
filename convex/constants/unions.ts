import { v } from "convex/values";

export const statusUnion = v.union(
  v.literal("idea"),
  v.literal("watching"),
  v.literal("executed"),
  v.literal("closed"),
  v.literal("reviewed")
);

export const sortBy = v.optional(
  v.union(v.literal("createdAt"), v.literal("updatedAt"))
);
export const sortOrder = v.optional(
  v.union(v.literal("asc"), v.literal("desc"))
);
