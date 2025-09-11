import { RJSFSchema } from "@rjsf/utils";

// Export UI Schema as well
export { uiSchema } from "./strategy.ui.schema";
export { customWidgets } from "./widgets";

export const schema: RJSFSchema = {
  type: "object",
  properties: {
    market_structure: {
      type: "boolean",
      default: false,
    },
    zone: {
      type: "boolean",
      default: false,
    },
  },
  allOf: [
    {
      if: {
        properties: {
          market_structure: { const: true },
        },
      },
      then: {
        properties: {
          swing: {
            type: "boolean",
            default: false,
          },
          fractal: {
            type: "boolean",
            default: false,
          },
        },
      },
    },
    {
      if: {
        allOf: [
          {
            properties: {
              market_structure: { const: true },
            },
          },
          {
            properties: {
              swing: { const: true },
            },
          },
        ],
      },
      then: {
        properties: {
          swing_direction: {
            type: "string",
            enum: ["bullish", "bearish"],
            enumNames: ["Bullish", "Bearish"],
          },
          swing_strength: {
            type: "string",
            enum: ["weakening", "strong"],
            enumNames: ["Weakening", "Strong"],
          },
        },
      },
    },
    {
      if: {
        allOf: [
          {
            properties: {
              market_structure: { const: true },
            },
          },
          {
            properties: {
              fractal: { const: true },
            },
          },
        ],
      },
      then: {
        properties: {
          fractal_direction: {
            type: "string",
            enum: ["bullish", "bearish"],
            enumNames: ["Bullish", "Bearish"],
          },
          fractal_strength: {
            type: "string",
            enum: ["weakening", "strong"],
            enumNames: ["Weakening", "Strong"],
          },
        },
      },
    },
    {
      if: {
        properties: {
          zone: { const: true },
        },
      },
      then: {
        properties: {
          supply: {
            type: "boolean",
            default: false,
          },
          demand: {
            type: "boolean",
            default: false,
          },
          obim: {
            type: "boolean",
            default: false,
          },
          range: {
            type: "boolean",
            default: false,
          },
        },
      },
    },
    {
      if: {
        allOf: [
          {
            properties: {
              zone: { const: true },
            },
          },
          {
            properties: {
              supply: { const: true },
            },
          },
        ],
      },
      then: {
        properties: {
          supply_range: {
            type: "boolean",
            default: false,
          },
          supply_pivot: {
            type: "boolean",
            default: false,
          },
        },
      },
    },
    {
      if: {
        allOf: [
          {
            properties: {
              zone: { const: true },
            },
          },
          {
            properties: {
              supply: { const: true },
            },
          },
          {
            properties: {
              supply_pivot: { const: true },
            },
          },
        ],
      },
      then: {
        properties: {
          supply_pivot_extremum_point: {
            type: "string",
            enum: ["extremum_point", "decision_point"],
            enumNames: ["Extremum Point", "Decision Point"],
          },
        },
      },
    },
    {
      if: {
        allOf: [
          {
            properties: {
              zone: { const: true },
            },
          },
          {
            properties: {
              demand: { const: true },
            },
          },
        ],
      },
      then: {
        properties: {
          demand_range: {
            type: "boolean",
            default: false,
          },
          demand_pivot: {
            type: "boolean",
            default: false,
          },
        },
      },
    },
    {
      if: {
        allOf: [
          {
            properties: {
              zone: { const: true },
            },
          },
          {
            properties: {
              demand: { const: true },
            },
          },
          {
            properties: {
              demand_pivot: { const: true },
            },
          },
        ],
      },
      then: {
        properties: {
          demand_pivot_extremum_point: {
            type: "string",
            enum: ["extremum_point", "decision_point"],
            enumNames: ["Extremum Point", "Decision Point"],
          },
        },
      },
    },
    {
      if: {
        allOf: [
          {
            properties: {
              zone: { const: true },
            },
          },
          {
            properties: {
              obim: { const: true },
            },
          },
        ],
      },
      then: {
        properties: {
          obim_direction: {
            type: "string",
            enum: ["bearish", "bullish"],
            enumNames: ["Bearish", "Bullish"],
          },
          obim_extension: {
            type: "boolean",
            default: false,
          },
          obim_caused_wick_bos: {
            type: "boolean",
            default: false,
          },
          obim_pivot: {
            type: "boolean",
            default: false,
          },
          obim_grabbed_liquidity: {
            type: "boolean",
            default: false,
          },
          obim_tooth_liquidity: {
            type: "boolean",
            default: false,
          },
          obim_staircased: {
            type: "boolean",
            default: false,
          },
        },
      },
    },
    {
      if: {
        allOf: [
          {
            properties: {
              zone: { const: true },
            },
          },
          {
            properties: {
              obim: { const: true },
            },
          },
          {
            properties: {
              obim_extension: { const: true },
            },
          },
        ],
      },
      then: {
        properties: {
          obim_extension_type: {
            type: "string",
            enum: ["fvg", "25%"],
            enumNames: ["FVG", "25%"],
          },
        },
      },
    },
    {
      if: {
        allOf: [
          {
            properties: {
              zone: { const: true },
            },
          },
          {
            properties: {
              obim: { const: true },
            },
          },
          {
            properties: {
              obim_pivot: { const: true },
            },
          },
        ],
      },
      then: {
        properties: {
          obim_pivot_extremum_point: {
            type: "string",
            enum: ["extremum_point", "decision_point"],
            enumNames: ["Extremum Point", "Decision Point"],
          },
        },
      },
    },
    {
      if: {
        allOf: [
          {
            properties: {
              zone: { const: true },
            },
          },
          {
            properties: {
              range: { const: true },
            },
          },
        ],
      },
      then: {
        properties: {
          VAH: {
            type: "boolean",
            default: false,
          },
          POC: {
            type: "boolean",
            default: false,
          },
          VAL: {
            type: "boolean",
            default: false,
          },
        },
      },
    },
  ],
} satisfies RJSFSchema;
