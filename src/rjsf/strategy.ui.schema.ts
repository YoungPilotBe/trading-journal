import { UiSchema } from "@rjsf/utils";

export const uiSchema: UiSchema = {
  "ui:field": "LayoutGridField",
  "ui:classNames": "grid-cols-3 w-fit gap-0",
  "ui:layoutGrid": {
    "ui:row": [
      {
        "ui:columns": {
          className: "col-span-1",
          children: ["market_structure"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-2",
          "ui:condition": {
            field: "market_structure",
            value: true,
            operator: "all",
          },
          children: ["swing"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-3",
          "ui:condition": {
            field: "swing",
            value: true,
            operator: "all",
          },
          children: [
            "swing_bullish",
            "swing_bearish",
            "swing_weakening",
            "swing_strong",
          ],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-2",
          "ui:condition": {
            field: "market_structure",
            value: true,
            operator: "all",
          },
          children: ["fractal"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-3",
          "ui:condition": {
            field: "fractal",
            value: true,
            operator: "all",
          },
          children: [
            "fractal_bullish",
            "fractal_bearish",
            "fractal_weakening",
            "fractal_strong",
          ],
        },
      },
    ],
  },
  market_structure: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Market Structure",
    "ui:options": {
      // badgeStyle: "border-blue-500 text-blue-500 bg-blue-50",
      indent: 0,
      label: false,
    },
  },
  swing: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Swing",
    "ui:options": {
      // badgeStyle: "border-green-500 text-green-500 bg-green-50",
      indent: 1,
      label: false,
    },
  },
  fractal: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Fractal",
    "ui:options": {
      // badgeStyle: "border-purple-500 text-purple-500 bg-purple-50",
      indent: 1,
      label: false,
    },
  },
  swing_bullish: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Bullish",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  swing_bearish: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Bearish",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  swing_weakening: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Weakening",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  swing_strong: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Strong",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  fractal_bullish: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Bullish",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  fractal_bearish: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Bearish",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  fractal_weakening: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Weakening",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  fractal_strong: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Strong",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
};
