// Add this method to your Generator class

import { faker } from "@faker-js/faker";

export class TagsGenerator {
  private faker: typeof faker;

  //   Init faker with optional seed
  constructor(seed?: number) {
    this.faker = faker;
    if (seed !== undefined) {
      this.faker.seed(seed);
    }
  }

  public generateStrategyConfig() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: Record<string, any> = {};

    // Market Structure
    const hasMarketStructure = this.faker.datatype.boolean();
    if (hasMarketStructure) {
      config.market_structure = {};

      // Swing (bullish vs bearish - mutually exclusive)
      const hasSwing = this.faker.datatype.boolean();
      if (hasSwing) {
        const swingType = this.faker.helpers.arrayElement([
          "bullish",
          "bearish",
        ]);
        config.market_structure.swing = { [`swing_${swingType}`]: true };
      }

      // Fractal (bullish vs bearish - mutually exclusive)
      const hasFractal = this.faker.datatype.boolean();
      if (hasFractal) {
        const fractalType = this.faker.helpers.arrayElement([
          "bullish",
          "bearish",
        ]);
        config.market_structure.fractal = { [`fractal_${fractalType}`]: true };
      }

      // Optional Settings
      const hasOptionalSettings = this.faker.datatype.boolean();
      if (hasOptionalSettings) {
        config.market_structure.optional_settings = {};

        // Protected Levels (high vs low - mutually exclusive)
        const hasProtectedLevels = this.faker.datatype.boolean();
        if (hasProtectedLevels) {
          config.market_structure.optional_settings.protected_levels = {};
          const protectedType = this.faker.helpers.arrayElement([
            "high",
            "low",
          ]);
          config.market_structure.optional_settings.protected_levels[
            `protected_${protectedType}`
          ] = {
            price: this.faker.number.float({
              min: 1,
              max: 10000,
              fractionDigits: 2,
            }),
          };
        }

        // Weak Levels (high vs low - mutually exclusive)
        const hasWeakLevels = this.faker.datatype.boolean();
        if (hasWeakLevels) {
          config.market_structure.optional_settings.weak_levels = {};
          const weakType = this.faker.helpers.arrayElement(["high", "low"]);
          config.market_structure.optional_settings.weak_levels[
            `weak_${weakType}`
          ] = {
            price: this.faker.number.float({
              min: 1,
              max: 10000,
              fractionDigits: 2,
            }),
          };
        }

        // Market Structure Liquidity
        const hasLiquidity = this.faker.datatype.boolean();
        if (hasLiquidity) {
          config.market_structure.optional_settings.market_structure_liquidity =
            {};

          // Wicking options
          const hasWickingTops = this.faker.datatype.boolean();
          if (hasWickingTops) {
            config.market_structure.optional_settings.market_structure_liquidity.wicking_tops = true;
          }

          const hasWickingBottoms = this.faker.datatype.boolean();
          if (hasWickingBottoms) {
            config.market_structure.optional_settings.market_structure_liquidity.wicking_bottoms = true;
          }

          // Liquidity Curve (up vs down - mutually exclusive)
          const hasLiquidityCurve = this.faker.datatype.boolean();
          if (hasLiquidityCurve) {
            const curveDirection = this.faker.helpers.arrayElement([
              "up",
              "down",
            ]);
            config.market_structure.optional_settings.market_structure_liquidity.liquidity_curve =
              {
                [`liquidity_curve_${curveDirection}`]: true,
              };
          }
        }
      }
    }

    // Entry (demand vs supply - mutually exclusive)
    const hasEntry = this.faker.datatype.boolean();
    if (hasEntry) {
      const entryType = this.faker.helpers.arrayElement(["demand", "supply"]);
      config.entry = {};
      config.entry[`entry_${entryType}`] = {};

      // Range or OBIM
      const entryMethod = this.faker.helpers.arrayElement(["range", "obim"]);
      config.entry[`entry_${entryType}`][`entry_${entryType}_${entryMethod}`] =
        {};

      if (entryMethod === "range") {
        this.addRangeChildren(
          config.entry[`entry_${entryType}`][
            `entry_${entryType}_${entryMethod}`
          ],
          `entry_${entryType}`,
          entryType
        );
      } else {
        this.addOBIMChildren(
          config.entry[`entry_${entryType}`][
            `entry_${entryType}_${entryMethod}`
          ],
          `entry_${entryType}`
        );
      }
    }

    // Exit (demand vs supply - mutually exclusive)
    const hasExit = this.faker.datatype.boolean();
    if (hasExit) {
      const exitType = this.faker.helpers.arrayElement(["demand", "supply"]);
      config.exit = {};
      config.exit[`exit_${exitType}`] = {};

      // Range or OBIM
      const exitMethod = this.faker.helpers.arrayElement(["range", "obim"]);
      config.exit[`exit_${exitType}`][`exit_${exitType}_${exitMethod}`] = {};

      if (exitMethod === "range") {
        this.addRangeChildren(
          config.exit[`exit_${exitType}`][`exit_${exitType}_${exitMethod}`],
          `exit_${exitType}`,
          exitType
        );
      } else {
        this.addOBIMChildren(
          config.exit[`exit_${exitType}`][`exit_${exitType}_${exitMethod}`],
          `exit_${exitType}`
        );
      }
    }

    return config;
  }

  private addRangeChildren(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: Record<string, any>,
    prefix: string,
    type: string
  ) {
    // Inducement
    const hasInducement = this.faker.datatype.boolean();
    if (hasInducement) {
      target[`${prefix}_range_inducement`] = true;
    }

    // S2B for demand, B2S for supply
    const hasTransition = this.faker.datatype.boolean();
    if (hasTransition) {
      const transitionKey = type === "demand" ? "s2b" : "b2s";
      target[`${prefix}_range_${transitionKey}`] = true;
    }

    // Chain
    const hasChain = this.faker.datatype.boolean();
    if (hasChain) {
      target[`${prefix}_range_chain`] = {
        drives: this.faker.number.int({ min: 1, max: 10 }),
      };
    }

    // Fixed Range Confluence
    const hasFixedRange = this.faker.datatype.boolean();
    if (hasFixedRange) {
      target[`${prefix}_range_fixed_range_confluence`] = {};
      const confluenceOptions = ["vah", "poc", "val"];
      const selectedConfluences = this.faker.helpers.arrayElements(
        confluenceOptions,
        { min: 1, max: 3 }
      );

      selectedConfluences.forEach((confluence) => {
        target[`${prefix}_range_fixed_range_confluence`][
          `${prefix}_range_fixed_range_confluence_${confluence}`
        ] = true;
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private addOBIMChildren(target: Record<string, any>, prefix: string) {
    // Extension
    const hasExtension = this.faker.datatype.boolean();
    if (hasExtension) {
      target[`${prefix}_obim_extension`] = {};

      const hasFVG = this.faker.datatype.boolean();
      if (hasFVG) {
        target[`${prefix}_obim_extension`][`${prefix}_obim_extension_fvg`] =
          true;
      }

      const has25Percent = this.faker.datatype.boolean();
      if (has25Percent) {
        target[`${prefix}_obim_extension`][
          `${prefix}_obim_extension_25_percent`
        ] = true;
      }
    }

    // Inducement
    const hasInducement = this.faker.datatype.boolean();
    if (hasInducement) {
      target[`${prefix}_obim_inducement`] = true;
    }

    // Pivot
    const hasPivot = this.faker.datatype.boolean();
    if (hasPivot) {
      target[`${prefix}_obim_pivot`] = {};

      const hasEP = this.faker.datatype.boolean();
      if (hasEP) {
        target[`${prefix}_obim_pivot`][`${prefix}_obim_pivot_ep`] = true;
      }

      const hasDP = this.faker.datatype.boolean();
      if (hasDP) {
        target[`${prefix}_obim_pivot`][`${prefix}_obim_pivot_dp`] = true;
      }
    }

    // Fixed Range Confluence
    const hasFixedRange = this.faker.datatype.boolean();
    if (hasFixedRange) {
      target[`${prefix}_obim_fixed_range_confluence`] = {};
      const confluenceOptions = ["vah", "poc", "val"];
      const selectedConfluences = this.faker.helpers.arrayElements(
        confluenceOptions,
        { min: 1, max: 3 }
      );

      selectedConfluences.forEach((confluence) => {
        target[`${prefix}_obim_fixed_range_confluence`][
          `${prefix}_obim_fixed_range_confluence_${confluence}`
        ] = true;
      });
    }

    // Liquidity
    const hasLiquidity = this.faker.datatype.boolean();
    if (hasLiquidity) {
      target[`${prefix}_obim_liquidity`] = {};

      const hasFueled = this.faker.datatype.boolean();
      if (hasFueled) {
        target[`${prefix}_obim_liquidity`][`${prefix}_obim_liquidity_fueled`] =
          true;
      }

      const hasWicked = this.faker.datatype.boolean();
      if (hasWicked) {
        target[`${prefix}_obim_liquidity`][`${prefix}_obim_liquidity_wicked`] =
          true;
      }
    }
  }
}
