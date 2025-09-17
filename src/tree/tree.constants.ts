import { capitalize } from "lodash";
import type { Branch } from "./tree.utils";

const createContradictingBranch = (
  prefix: string,
  contras: [string, string]
): NonNullable<Branch["children"]> => {
  return [
    {
      key: `${prefix}_${contras[0]}`,
      title: `${capitalize(contras[0])}`,
      anti: [`${prefix}_${contras[1]}`],
    },
    {
      key: `${prefix}_${contras[1]}`,
      title: `${capitalize(contras[1])}`,
      anti: [`${prefix}_${contras[0]}`],
    },
  ];
};

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
            ...createContradictingBranch("swing_direction", [
              "bullish",
              "bearish",
            ]),
            ...createContradictingBranch("swing_strength", [
              "strong",
              "weakening",
            ]),
          ],
        },
        {
          key: "fractal",
          title: "Fractal",
          children: [
            ...createContradictingBranch("fractal_direction", [
              "bullish",
              "bearish",
            ]),
            ...createContradictingBranch("fractal_strength", [
              "strong",
              "weakening",
            ]),
          ],
        },
      ],
    },
    {
      key: "zone",
      title: "Zone",
      children: [
        {
          key: "zone_supply",
          anti: ["zone_demand"],
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
          key: "zone_demand",
          anti: ["zone_supply"],
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
