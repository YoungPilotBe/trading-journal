import { convexQuery } from "@convex-dev/react-query";
import { FunctionArgs, FunctionReference } from "convex/server";

export function cQuery<T extends FunctionReference<"query">>(
  fn: T,
  args: FunctionArgs<T>
) {
  return convexQuery(fn, args);
}
