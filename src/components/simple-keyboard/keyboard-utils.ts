const KEYBOARD_WIDTH = 380;
const KEYBOARD_HEIGHT = 320;
const POSITION_PADDING = 12;

export interface KeyboardPosition {
  top: number;
  left: number;
  isReady: boolean;
}

export function calculateKeyboardPosition(
  triggerRect: DOMRect
): Omit<KeyboardPosition, "isReady"> {
  let left = triggerRect.right + POSITION_PADDING;
  let top = triggerRect.top;

  const wouldOverflowRight = left + KEYBOARD_WIDTH > window.innerWidth;
  const wouldOverflowLeft = left < 0;
  const wouldOverflowBottom = top + KEYBOARD_HEIGHT > window.innerHeight;

  // Try positioning to the left if overflowing right
  if (wouldOverflowRight) {
    left = triggerRect.left - KEYBOARD_WIDTH - POSITION_PADDING;
  }

  // Fallback to below trigger if still overflowing left
  if (wouldOverflowLeft) {
    left = triggerRect.left;
    top = triggerRect.bottom + POSITION_PADDING;
  }

  // Move above trigger if overflowing bottom
  if (wouldOverflowBottom) {
    top = triggerRect.top - KEYBOARD_HEIGHT - POSITION_PADDING;
  }

  return { top, left };
}
