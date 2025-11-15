import { TIMEFRAMES } from "@/config/timeframe-order";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "./keyboard-styles.css";
import { calculateKeyboardPosition, KeyboardPosition } from "./keyboard-utils";

// Keyboard layout configuration for timeframes - using all timeframes from config
// Organized in a clean grid by time unit
const KEYBOARD_LAYOUT = {
  default: [
    "1m 2m 3m 5m 6m 10m 12m 15m",
    "20m 24m 30m 1h 2h 4h 6h 8h",
    "12h 18h D 2D 3D 4D 5D 6D",
    "W 2W M {bksp}",
  ],
};

const KEYBOARD_DISPLAY = {
  "{bksp}": "⌫",
};

// Keyboard styling and configuration
const KEYBOARD_THEME = "hg-theme-default hg-layout-timeframe timeframe-theme";
const KEYBOARD_ANIMATION_CLASS =
  "fixed z-50 animate-in zoom-in-95 fade-in-0 duration-200";
const KEYBOARD_CONTAINER_CLASS = "bg-card border-2 border-border shadow-lg p-3";

interface TimeframeKeyboardProps {
  enable?: boolean;
  triggerRef: React.RefObject<
    HTMLElement | HTMLButtonElement | HTMLInputElement
  >;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (timeframe: string) => void;
  selectedTimeframes?: string[];
}

/**
 * Timeframe keyboard for selecting trading timeframes
 * Reuses positioning and styling from the numeric keyboard
 */
const TimeframeKeyboard = ({
  enable = true,
  triggerRef,
  isOpen,
  onClose,
  onSelect,
  selectedTimeframes = [],
}: TimeframeKeyboardProps) => {
  const keyboardInstanceRef = useRef<HTMLDivElement | null>(null);
  const keyboardContainerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<KeyboardPosition>({
    top: 0,
    left: 0,
    isReady: false,
  });

  // Create button themes based on selected timeframes
  const buttonTheme = [
    {
      class: "hg-button-bksp",
      buttons: "{bksp}",
    },
    {
      class: "hg-button-timeframe",
      buttons: TIMEFRAMES.filter((tf) => !selectedTimeframes.includes(tf)).join(
        " "
      ),
    },
    {
      class: "hg-button-disabled",
      buttons: selectedTimeframes.join(" "),
    },
  ];

  // Calculate and update keyboard position when opened
  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setPosition((prev) => ({ ...prev, isReady: false }));
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const calculatedPosition = calculateKeyboardPosition(triggerRect);

    setPosition({ ...calculatedPosition, isReady: true });
  }, [isOpen, triggerRef]);

  // Handle click/touch outside to close keyboard
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideInteraction = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const isOutsideTrigger = !triggerRef.current?.contains(target);
      const isOutsideKeyboard = !keyboardContainerRef.current?.contains(target);

      if (isOutsideTrigger && isOutsideKeyboard) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("touchstart", handleOutsideInteraction);

    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("touchstart", handleOutsideInteraction);
    };
  }, [isOpen, onClose, triggerRef]);

  // Handle key press - select timeframe and close
  const handleKeyPress = (button: string) => {
    if (button === "{bksp}") {
      onSelect?.("");
      return;
    }

    // Don't allow selecting already selected timeframes
    if (selectedTimeframes.includes(button)) {
      return;
    }

    // Any timeframe button press
    onSelect?.(button);
    onClose();
  };

  // Don't render if disabled, closed, or position not ready
  if (!enable || !isOpen || !position.isReady) {
    return null;
  }

  return createPortal(
    <div
      ref={keyboardContainerRef}
      className={KEYBOARD_ANIMATION_CLASS}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className={KEYBOARD_CONTAINER_CLASS}>
        <div className="timeframe-keyboard-container">
          <Keyboard
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            keyboardRef={(ref: any) => (keyboardInstanceRef.current = ref)}
            onKeyPress={handleKeyPress}
            theme={KEYBOARD_THEME}
            layout={KEYBOARD_LAYOUT}
            display={KEYBOARD_DISPLAY}
            buttonTheme={buttonTheme}
            mergeDisplay={true}
            disableCaretPositioning={true}
            disableButtonHold={true}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TimeframeKeyboard;
