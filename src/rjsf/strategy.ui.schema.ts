import { UiSchema } from "@rjsf/utils";

export const uiSchema: UiSchema = {
  "ui:field": "LayoutGridField",
  "ui:classNames": "grid-cols-6 w-fit gap-0",
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
          children: ["swing"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-3",
          children: ["swing_direction", "swing_strength"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-2",
          children: ["fractal"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-3",
          children: ["fractal_direction", "fractal_strength"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-1",
          children: ["zone"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-2",
          children: ["supply"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-3",
          children: ["supply_range", "supply_pivot"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-4",
          children: ["supply_pivot_extremum_point"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-2",
          children: ["demand"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-3",
          children: ["demand_range", "demand_pivot"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-4",
          children: ["demand_pivot_extremum_point"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-2",
          children: ["obim"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-3",
          children: ["obim_direction"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-3",
          children: ["obim_extension"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-4",
          children: ["obim_extension_type"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-3",
          children: ["obim_caused_wick_bos", "obim_pivot"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-4",
          children: ["obim_pivot_extremum_point"],
        },
      },
      {
        "ui:columns": {
          className: "col-span-1 col-start-3",
          children: [
            "obim_grabbed_liquidity",
            "obim_tooth_liquidity",
            "obim_staircased",
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
  swing_direction: {
    "ui:widget": "RadioToggleBadge",
    "ui:title": "Direction",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  swing_strength: {
    "ui:widget": "RadioToggleBadge",
    "ui:title": "Strength",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  fractal_direction: {
    "ui:widget": "RadioToggleBadge",
    "ui:title": "Direction",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  fractal_strength: {
    "ui:widget": "RadioToggleBadge",
    "ui:title": "Strength",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  zone: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Zone",
    "ui:options": {
      indent: 0,
      label: false,
    },
  },
  supply: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Supply",
    "ui:options": {
      indent: 1,
      label: false,
    },
  },
  demand: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Demand",
    "ui:options": {
      indent: 1,
      label: false,
    },
  },
  obim: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "OBIM",
    "ui:options": {
      indent: 1,
      label: false,
    },
  },
  supply_range: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Range",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  supply_pivot: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Pivot",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  demand_range: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Range",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  demand_pivot: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Pivot",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  supply_pivot_extremum_point: {
    "ui:widget": "RadioToggleBadge",
    "ui:title": "Point Type",
    "ui:options": {
      indent: 3,
      label: false,
    },
  },
  demand_pivot_extremum_point: {
    "ui:widget": "RadioToggleBadge",
    "ui:title": "Point Type",
    "ui:options": {
      indent: 3,
      label: false,
    },
  },
  obim_direction: {
    "ui:widget": "RadioToggleBadge",
    "ui:title": "Direction",
    "ui:options": {
      indent: 2,
      label: false,
    },
  },
  obim_extension: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Extension",
    "ui:options": {
      indent: 3,
      label: false,
    },
  },
  obim_caused_wick_bos: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Caused Wick BOS",
    "ui:options": {
      indent: 3,
      label: false,
    },
  },
  obim_pivot: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Pivot",
    "ui:options": {
      indent: 3,
      label: false,
    },
  },
  obim_grabbed_liquidity: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Grabbed Liquidity",
    "ui:options": {
      indent: 3,
      label: false,
    },
  },
  obim_tooth_liquidity: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Tooth Liquidity",
    "ui:options": {
      indent: 3,
      label: false,
    },
  },
  obim_staircased: {
    "ui:widget": "CheckboxWidget",
    "ui:title": "Staircased",
    "ui:options": {
      indent: 3,
      label: false,
    },
  },
  obim_extension_type: {
    "ui:widget": "RadioToggleBadge",
    "ui:title": "Extension Type",
    "ui:options": {
      indent: 4,
      label: false,
    },
  },
  obim_pivot_extremum_point: {
    "ui:widget": "RadioToggleBadge",
    "ui:title": "Point Type",
    "ui:options": {
      indent: 4,
      label: false,
    },
  },
};
