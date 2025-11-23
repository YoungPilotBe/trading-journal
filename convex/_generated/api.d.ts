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
import type * as analytics_internal from "../analytics/internal.js";
import type * as analytics_queries from "../analytics/queries.js";
import type * as base_titles_mutation from "../base_titles/mutation.js";
import type * as base_titles_queries from "../base_titles/queries.js";
import type * as base_titles_utilities from "../base_titles/utilities.js";
import type * as charts_constants from "../charts/constants.js";
import type * as charts_progression_queries from "../charts/progression/queries.js";
import type * as charts_progression_services from "../charts/progression/services.js";
import type * as charts_queries from "../charts/queries.js";
import type * as charts_services_r_multiple from "../charts/services/r_multiple.js";
import type * as config_analytics from "../config/analytics.js";
import type * as constants_unions from "../constants/unions.js";
import type * as drawings from "../drawings.js";
import type * as image_search_actions from "../image_search/actions.js";
import type * as notes_internal from "../notes/internal.js";
import type * as notes_mutation from "../notes/mutation.js";
import type * as notes_queries from "../notes/queries.js";
import type * as orchestration_internal from "../orchestration/internal.js";
import type * as orchestration_mutations from "../orchestration/mutations.js";
import type * as snaphot_internal from "../snaphot/internal.js";
import type * as snaphot_mutation from "../snaphot/mutation.js";
import type * as snaphot_queries from "../snaphot/queries.js";
import type * as snaphot_services from "../snaphot/services.js";
import type * as template_internal from "../template/internal.js";
import type * as template_mutation from "../template/mutation.js";
import type * as template_queries from "../template/queries.js";
import type * as tpsl_mutations from "../tpsl/mutations.js";
import type * as tpsl_queries from "../tpsl/queries.js";
import type * as trade_setup_internal from "../trade_setup/internal.js";
import type * as trade_setup_mutations from "../trade_setup/mutations.js";
import type * as trade_setup_queries from "../trade_setup/queries.js";
import type * as tradingview_images_mutations from "../tradingview_images/mutations.js";
import type * as tradingview_images_queries from "../tradingview_images/queries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "analytics/internal": typeof analytics_internal;
  "analytics/queries": typeof analytics_queries;
  "base_titles/mutation": typeof base_titles_mutation;
  "base_titles/queries": typeof base_titles_queries;
  "base_titles/utilities": typeof base_titles_utilities;
  "charts/constants": typeof charts_constants;
  "charts/progression/queries": typeof charts_progression_queries;
  "charts/progression/services": typeof charts_progression_services;
  "charts/queries": typeof charts_queries;
  "charts/services/r_multiple": typeof charts_services_r_multiple;
  "config/analytics": typeof config_analytics;
  "constants/unions": typeof constants_unions;
  drawings: typeof drawings;
  "image_search/actions": typeof image_search_actions;
  "notes/internal": typeof notes_internal;
  "notes/mutation": typeof notes_mutation;
  "notes/queries": typeof notes_queries;
  "orchestration/internal": typeof orchestration_internal;
  "orchestration/mutations": typeof orchestration_mutations;
  "snaphot/internal": typeof snaphot_internal;
  "snaphot/mutation": typeof snaphot_mutation;
  "snaphot/queries": typeof snaphot_queries;
  "snaphot/services": typeof snaphot_services;
  "template/internal": typeof template_internal;
  "template/mutation": typeof template_mutation;
  "template/queries": typeof template_queries;
  "tpsl/mutations": typeof tpsl_mutations;
  "tpsl/queries": typeof tpsl_queries;
  "trade_setup/internal": typeof trade_setup_internal;
  "trade_setup/mutations": typeof trade_setup_mutations;
  "trade_setup/queries": typeof trade_setup_queries;
  "tradingview_images/mutations": typeof tradingview_images_mutations;
  "tradingview_images/queries": typeof tradingview_images_queries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
