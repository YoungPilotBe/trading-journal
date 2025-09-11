export const Strategies = {
  ENTRY_STRATEGY: {
    // In here can go zones with their own strategies
  },
  EXIT_STRATEGY: {
    // In here can go zones with their own strategies
  },
  STOP_LOSS_STRATEGY: {
    // In here can go zones with their own strategies
  },
};

export const MARKET_STRUCTURE = ["Swing", "Fractal"] as const;
export const MARKET_STRUCTURE_OPTIONS = [
  "Bullish",
  "Bearish",
  "Weakening",
  "Strong",
] as const;

export const ZONE_BASED = ["Supply", "Demand", "OBIM"] as const;

export const SUPPLY_DEMAND_OPTIONS = ["Range", "Pivot"] as const;

export const PIVOT_OPTIONS = ["Extremum Point", "Decision Point"] as const;

export const OBIM_OPTIONS = [
  "Bearish",
  "Bullish",
  "Extension",
  "Caused Wick BOS",
  "Pivot",
  "Grabbed Liquidity",
  "Tooth Liquidity Sweep",
  "Staircased",
] as const;

export const EXTENSION_OPTIONS = ["FVG", "25%"] as const;

export const RANGE_OPTIONS = [
  "Discount",
  "Premium",
  "Inducement",
  "Unmitigated",
  "VAH",
  "VAL",
  "POC",
];

export const LIQUIDITY_OPTIONS = [
  "Rounded Return",
  "Corrective Return",
  "Liquidity Sweep Return",
  "Pivot Return",
];

export type MarketStructure = (typeof MARKET_STRUCTURE)[number];
export type MarketStructureOptions = (typeof MARKET_STRUCTURE_OPTIONS)[number];
export type ZoneBased = (typeof ZONE_BASED)[number];
export type SupplyDemandOptions = (typeof SUPPLY_DEMAND_OPTIONS)[number];
export type ObimOption = (typeof OBIM_OPTIONS)[number];
export type ExtensionOption = (typeof EXTENSION_OPTIONS)[number];
export type RangeOption = (typeof RANGE_OPTIONS)[number];
export type LiquidityOption = (typeof LIQUIDITY_OPTIONS)[number];
export type PivotOption = (typeof PIVOT_OPTIONS)[number];

// Market Structure
export type StrategyConfig = {
  market_structure?: {
    [K in MarketStructure]?: {
      [O in MarketStructureOptions]?: boolean;
    };
  };
  zone?: {
    [K in ZoneBased]?: K extends "Supply" | "Demand"
      ? {
          [O in SupplyDemandOptions]?: boolean;
        }
      : K extends "OBIM"
        ? ObimConfig
        : never;
  };
};

// Extension Options
// type ExtensionOptions<T extends ObimOption>= T extends "Extension" ? ExtensionOption : never

// OBIM specific configuration type
// OBIM specific configuration type
type ObimConfig = {
  [K in ObimOption]?: K extends "Extension"
    ? {
        [E in ExtensionOption]?: boolean;
      }
    : K extends "Pivot"
      ? {
          [P in PivotOption]?: boolean;
        }
      : boolean;
};
