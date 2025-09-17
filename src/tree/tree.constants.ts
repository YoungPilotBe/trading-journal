import type { Branch } from "./tree.utils";

export const strategyTree: Branch = {
  key: "strategy",
  title: "Strategy",
  children: [
    {
      key: "market_structure",
      title: "Market Structure",
      children: [
        {
          key: "swing",
          title: "Swing",
          children: [
            {
              key: "swing_direction_bullish",
              title: "Swing Direction - Bullish",
              anti: ["swing_direction_bearish"],
            },
            {
              key: "swing_direction_bearish",
              title: "Swing Direction - Bearish",
              anti: ["swing_direction_bullish"],
            },
            {
              key: "swing_strength_weakening",
              title: "Swing Strength - Weakening",
              anti: ["swing_strength_strong"],
            },
            {
              key: "swing_strength_strong",
              title: "Swing Strength - Strong",
              anti: ["swing_strength_weakening"],
            },
          ],
        },
        {
          key: "fractal",
          title: "Fractal",
          children: [
            {
              key: "fractal_direction_bullish",
              title: "Fractal Direction - Bullish",
              anti: ["fractal_direction_bearish"],
            },
            {
              key: "fractal_direction_bearish",
              title: "Fractal Direction - Bearish",
              anti: ["fractal_direction_bullish"],
            },
            {
              key: "fractal_strength_weakening",
              title: "Fractal Strength - Weakening",
              anti: ["fractal_strength_strong"],
            },
            {
              key: "fractal_strength_strong",
              title: "Fractal Strength - Strong",
              anti: ["fractal_strength_weakening"],
            },
          ],
        },
      ],
    },
    {
      key: "zone",
      title: "Zone",
      children: [
        {
          key: "supply",
          title: "Supply",
          children: [
            {
              key: "supply_range",
              title: "Supply Range",
            },
            {
              key: "supply_pivot",
              title: "Supply Pivot",
              children: [
                {
                  key: "supply_pivot_extremum_point",
                  title: "Supply Pivot Point",
                },
              ],
            },
          ],
        },
        {
          key: "demand",
          title: "Demand",
          children: [
            {
              key: "demand_range",
              title: "Demand Range",
            },
            {
              key: "demand_pivot",
              title: "Demand Pivot",
              children: [
                {
                  key: "demand_pivot_extremum_point",
                  title: "Demand Pivot Point",
                },
              ],
            },
          ],
        },
        {
          key: "obim",
          title: "OBIM",
          children: [
            {
              key: "obim_direction",
              title: "OBIM Direction",
            },
            {
              key: "obim_extension",
              title: "OBIM Extension",
              children: [
                {
                  key: "obim_extension_type",
                  title: "OBIM Extension Type",
                },
              ],
            },
            {
              key: "obim_caused_wick_bos",
              title: "OBIM Caused Wick BOS",
            },
            {
              key: "obim_pivot",
              title: "OBIM Pivot",
              children: [
                {
                  key: "obim_pivot_extremum_point",
                  title: "OBIM Pivot Point",
                },
              ],
            },
            {
              key: "obim_grabbed_liquidity",
              title: "OBIM Grabbed Liquidity",
            },
            {
              key: "obim_tooth_liquidity",
              title: "OBIM Tooth Liquidity",
            },
            {
              key: "obim_staircased",
              title: "OBIM Staircased",
            },
          ],
        },
        {
          key: "range",
          title: "Range",
          children: [
            {
              key: "VAH",
              title: "VAH",
            },
            {
              key: "POC",
              title: "POC",
            },
            {
              key: "VAL",
              title: "VAL",
            },
          ],
        },
      ],
    },
    {
      key: "wyckoff",
      title: "Wyckoff",
      children: [
        {
          key: "wyckoff_phase",
          title: "Wyckoff Phase",
        },
      ],
    },
  ],
};
