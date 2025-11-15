# Keyboard Components

This directory contains reusable keyboard components for the trading journal application.

## Components

### VirtualKeyboard (Numeric)

A numeric keyboard for entering numbers and decimals.

**Features:**
- Numeric input (0-9)
- Decimal point support
- Backspace functionality
- Touch-optimized
- Auto-positioning relative to trigger element
- Click-outside-to-close

**Usage:**

```tsx
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard";
import VirtualKeyboard from "@/components/simple-keyboard/virtual-keyboard";

const MyComponent = () => {
  const [value, setValue] = useState("");
  const { isOpen, triggerRef, openKeyboard, closeKeyboard } = useVirtualKeyboard();

  return (
    <>
      <Input
        ref={triggerRef}
        value={value}
        onClick={openKeyboard}
        readOnly
      />
      <VirtualKeyboard
        triggerRef={triggerRef}
        isOpen={isOpen}
        onClose={closeKeyboard}
        onChange={setValue}
      />
    </>
  );
};
```

### TimeframeKeyboard

A keyboard for selecting trading timeframes (1m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 1D, 1W, 1M).

**Features:**
- Predefined timeframe options
- Quick selection
- Backspace to clear
- Touch-optimized
- Auto-positioning relative to trigger element
- Click-outside-to-close

**Usage:**

```tsx
import { useTimeframeKeyboard } from "@/hooks/use-timeframe-keyboard";
import TimeframeKeyboard from "@/components/simple-keyboard/timeframe-keyboard";

const MyComponent = () => {
  const [timeframe, setTimeframe] = useState("");
  const { isOpen, triggerRef, openKeyboard, closeKeyboard } = useTimeframeKeyboard();

  return (
    <>
      <Input
        ref={triggerRef}
        value={timeframe}
        onClick={openKeyboard}
        readOnly
      />
      <TimeframeKeyboard
        triggerRef={triggerRef}
        isOpen={isOpen}
        onClose={closeKeyboard}
        onSelect={setTimeframe}
      />
    </>
  );
};
```

## Shared Utilities

### `keyboard-utils.ts`

Contains shared utilities for keyboard positioning:

- `calculateKeyboardPosition()` - Calculates optimal position with viewport boundary detection
- `KeyboardPosition` - Type definition for keyboard positioning

### `keyboard-styles.css`

Contains shared styles for both keyboard components:

- `.numeric-theme` - Styles for numeric keyboard
- `.timeframe-theme` - Styles for timeframe keyboard
- Responsive button sizing
- Hover/active states
- Color theming using CSS variables

## Hooks

### `use-virtual-keyboard.ts`

Hook for managing numeric keyboard state.

### `use-timeframe-keyboard.ts`

Hook for managing timeframe keyboard state.

## Customization

Both keyboards support the following props:

- `enable` - Enable/disable keyboard rendering
- `triggerRef` - Reference to trigger element for positioning
- `isOpen` - Control visibility state
- `onClose` - Callback when keyboard should close

Styling can be customized by:
1. Modifying `keyboard-styles.css`
2. Using CSS variables defined in your theme
3. Overriding button theme classes

## Development

Both keyboards use:
- React Simple Keyboard library
- React Portals for rendering outside normal DOM hierarchy
- Shared positioning utilities
- CSS custom properties for theming

