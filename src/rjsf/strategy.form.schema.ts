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
          swing_bullish: {
            type: "boolean",
            default: false,
          },
          swing_bearish: {
            type: "boolean",
            default: false,
          },
          swing_weakening: {
            type: "boolean",
            default: false,
          },
          swing_strong: {
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
              fractal: { const: true },
            },
          },
        ],
      },
      then: {
        properties: {
          fractal_bullish: {
            type: "boolean",
            default: false,
          },
          fractal_bearish: {
            type: "boolean",
            default: false,
          },
          fractal_weakening: {
            type: "boolean",
            default: false,
          },
          fractal_strong: {
            type: "boolean",
            default: false,
          },
        },
      },
    },
  ],
} satisfies RJSFSchema;
