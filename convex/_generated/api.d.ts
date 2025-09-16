/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as constants_unions from "../constants/unions.js";
import type * as drawings from "../drawings.js";
import type * as orchestration_mutations from "../orchestration/mutations.js";
import type * as snaphot_mutation from "../snaphot/mutation.js";
import type * as snaphot_queries from "../snaphot/queries.js";
import type * as snaphot_services from "../snaphot/services.js";
import type * as trade_setup_mutations from "../trade_setup/mutations.js";
import type * as trade_setup_queries from "../trade_setup/queries.js";
import type * as trade_template from "../trade_template.js";
import type * as tradingview_images from "../tradingview_images.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "constants/unions": typeof constants_unions;
  drawings: typeof drawings;
  "orchestration/mutations": typeof orchestration_mutations;
  "snaphot/mutation": typeof snaphot_mutation;
  "snaphot/queries": typeof snaphot_queries;
  "snaphot/services": typeof snaphot_services;
  "trade_setup/mutations": typeof trade_setup_mutations;
  "trade_setup/queries": typeof trade_setup_queries;
  trade_template: typeof trade_template;
  tradingview_images: typeof tradingview_images;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
