import { capitalize } from "lodash";
import type { Branch } from "./tree.utils";

const createContradictingBranch = (
  prefix: string,
  contras: [string, string],
  children?: Branch[]
): NonNullable<Branch["children"]> => {
  return [
    {
      key: `${prefix}_${contras[0]}`,
      title: `${capitalize(contras[0])}`,
      anti: [`${prefix}_${contras[1]}`],
      children,
    },
    {
      key: `${prefix}_${contras[1]}`,
      title: `${capitalize(contras[1])}`,
      anti: [`${prefix}_${contras[0]}`],
      children,
    },
  ];
};

const createOBIMChildren = () => [
  {
    key: "obim_extension",
    title: "Extension",
    children: [
      {
        key: "obim_extension_fvg",
        title: "FVG",
      },
      {
        key: "obim_extension_25%",
        title: "25%",
      },
    ],
  },

  {
    key: "obim_pivot",
    title: "Pivot",
    children: [
      {
        key: "obim_pivot_extremum_point",
        title: "Pivot Point",
      },
    ],
  },
  {
    key: "obim_liquidity",
    title: "Liquidity",
    children: [
      {
        key: "obim_grabbed_liquidity",
        title: "Grabbed Liquidity",
      },
      {
        key: "obim_caused_wick_bos",
        title: "Caused Wick BOS",
      },
    ],
  },

  {
    key: "obim_staircased",
    title: "Staircased",
  },
];

export const strategyTree: Branch = {
  key: "strategy",
  title: "Strategy",
  children: [
    {
      key: "market_structure",
      title: "MS",
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
                ...createContradictingBranch("supply_pivot", [
                  "extremum",
                  "decision",
                ]),
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
                ...createContradictingBranch("demand_pivot", [
                  "extremum",
                  "decision",
                ]),
              ],
            },
          ],
        },
      ],
    },
    {
      key: "obim",
      title: "OBIM",
      children: [
        ...createContradictingBranch(
          "obim_direction",
          ["bullish", "bearish"],
          createOBIMChildren()
        ),
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
    {
      key: "wyckoff",
      title: "Wyckoff",
      children: [
        ...createContradictingBranch(
          "wyckoff",
          ["accumulation", "distribution"],
          createContradictingBranch("wyckoff_model", ["model 1", "model 2"])
        ),
      ],
    },
  ],
};
