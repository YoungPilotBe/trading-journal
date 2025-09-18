# Analytics Configuration

This directory contains configuration files for the similarity engine and analytics features.

## Quick Start

To change the similarity weights, simply modify the `getAnalyticsConfig()` function in `analytics.ts`:

```typescript
export function getAnalyticsConfig(): AnalyticsConfig {
  // Switch to a different preset
  return EXECUTION_FOCUSED_CONFIG;

  // Or return a custom configuration
  return {
    similarityWeights: {
      tagsPerStatus: 0.6, // 60% - Your custom weight
      template: 0.3, // 30% - Your custom weight
      asset: 0.1, // 10% - Your custom weight
    },
    defaultMinSimilarityScore: 0.15,
    defaultLimit: 8,
    enabledFactors: {
      tagsPerStatus: true,
      template: true,
      asset: true,
    },
  };
}
```

## Available Presets

### `DEFAULT_ANALYTICS_CONFIG` (Recommended)

- **Tags Per Status**: 50% - Most important factor
- **Template**: 30% - Strategy similarity
- **Asset**: 20% - Market context
- **Best for**: General trading analysis

### `EXECUTION_FOCUSED_CONFIG`

- **Tags Per Status**: 70% - Heavy focus on execution
- **Template**: 30% - Strategy matters
- **Asset**: 0% - Asset ignored
- **Best for**: Learning from execution patterns regardless of asset

### `STRATEGY_FOCUSED_CONFIG`

- **Tags Per Status**: 30% - Less focus on execution details
- **Template**: 50% - Strategy is most important
- **Asset**: 20% - Asset context
- **Best for**: Finding trades with similar strategies

### `BALANCED_CONFIG`

- **Tags Per Status**: 33% - Equal weight
- **Template**: 33% - Equal weight
- **Asset**: 34% - Equal weight
- **Best for**: Experimental analysis

## Understanding the Weights

### Tags Per Status (Execution Patterns)

This compares how similar the trading decisions were at each stage:

- **Idea stage**: Initial analysis tags
- **Watching stage**: Confirmation signals
- **Executed stage**: Entry and management tags
- **Closed stage**: Exit and review tags

**Higher weight = More focus on "how was the trade executed?"**

### Template (Strategy)

This compares if trades used the same core strategy template.

- Exact match: 100% similarity
- Different templates: 0% similarity

**Higher weight = More focus on "same strategy type?"**

### Asset (Market Context)

This compares if trades were on the same asset/pair.

- Same asset: 100% similarity
- Different assets: 0% similarity

**Higher weight = More focus on "same market conditions?"**

## Making Changes

1. **Quick preset switch**: Change the return value in `getAnalyticsConfig()`
2. **Custom weights**: Create your own config object
3. **Advanced**: Modify the preset objects directly

## Important Notes

- **Weights should sum to 1.0** for best results (the system will normalize if they don't)
- **Changes require restarting** your development server to take effect
- **Server and client configs** must match (both files are automatically updated)
- **Test your changes** with real data to see if the results make sense

## Examples

### Focus on Execution Only

```typescript
return {
  similarityWeights: { tagsPerStatus: 1.0, template: 0.0, asset: 0.0 },
  // ... other settings
};
```

### Strategy and Asset Only

```typescript
return {
  similarityWeights: { tagsPerStatus: 0.0, template: 0.7, asset: 0.3 },
  // ... other settings
};
```

### Disable Asset Comparison

```typescript
return {
  similarityWeights: { tagsPerStatus: 0.7, template: 0.3, asset: 0.0 },
  enabledFactors: { tagsPerStatus: true, template: true, asset: false },
  // ... other settings
};
```
