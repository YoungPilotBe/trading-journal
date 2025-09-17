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
import type * as template_internal from "../template/internal.js";
import type * as template_mutation from "../template/mutation.js";
import type * as template_queries from "../template/queries.js";
import type * as trade_setup_internal from "../trade_setup/internal.js";
import type * as trade_setup_mutations from "../trade_setup/mutations.js";
import type * as trade_setup_queries from "../trade_setup/queries.js";
import type * as tradingview_images_queries from "../tradingview_images/queries.js";
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
  "template/internal": typeof template_internal;
  "template/mutation": typeof template_mutation;
  "template/queries": typeof template_queries;
  "trade_setup/internal": typeof trade_setup_internal;
  "trade_setup/mutations": typeof trade_setup_mutations;
  "trade_setup/queries": typeof trade_setup_queries;
  "tradingview_images/queries": typeof tradingview_images_queries;
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
