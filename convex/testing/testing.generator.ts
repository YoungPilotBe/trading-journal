import { faker } from "@faker-js/faker";
import { TagsGenerator } from "./tags.generator";
import {
  STRATEGY_TEMPLATES,
  TESTING_BASE_TITLES,
  TIMEFRAMES,
  TRADE_DIRECTIONS,
  TRADE_STATUSES,
  TRADING_ASSETS,
} from "./testing.constants";

export class Generator {
  private seed: number | undefined;
  private faker: typeof faker;
  private amountOfTradeSetups: number = 5;

  //   Init faker with optional seed
  constructor(seed?: number, amountOfTradeSetups?: number) {
    this.faker = faker;
    if (amountOfTradeSetups) this.amountOfTradeSetups = amountOfTradeSetups;
    if (seed !== undefined) {
      this.faker.seed(seed);
      this.seed = seed;
    }
  }

  private generateSnapshot(status: string) {
    const tagsGenerator = new TagsGenerator(this.seed);
    const tags = tagsGenerator.generateStrategyConfig();
    const imageId = "jd7dnjvky94cbnzhv4tyk35nwx7rfdbe";
    const timeframe = "4h";
    const tagsConfig = {};
    return { status, tags, tagsConfig, imageId, timeframe };
  }

  public generate() {
    const tradeSetups = [];
    for (let i = 0; i < this.amountOfTradeSetups; i++) {
      tradeSetups.push(this.generateTradeSetup());
    }
    return tradeSetups;
  }

  private generateTradeSetup() {
    const title = this.faker.helpers.arrayElement(TESTING_BASE_TITLES);
    const asset = this.faker.helpers.arrayElement(TRADING_ASSETS);
    const direction = this.faker.helpers.arrayElement(TRADE_DIRECTIONS);
    const template = this.faker.helpers.arrayElement(STRATEGY_TEMPLATES);
    const timeframes = this.faker.helpers.arrayElements(TIMEFRAMES, 3);
    const result = this.faker.helpers.arrayElement([
      "win",
      "loss",
      "breakeven",
    ]);
    const riskReward = this.faker.number.float({
      min: 0.4,
      max: 10.0,
      fractionDigits: 1,
    });

    // INSERT_YOUR_CODE
    const randomCount = this.faker.number.int({
      min: 0,
      max: TRADE_STATUSES.length,
    });

    const snapshots = [];
    for (let i = 0; i < randomCount; i++) {
      const snapshot = this.generateSnapshot(TRADE_STATUSES[i]);
      snapshots.push(snapshot);
    }

    return {
      title,
      asset,
      direction,
      template,
      riskReward,
      snapshots,
      timeframes,
      result,
    };
  }
}
