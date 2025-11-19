import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "./keyboard-styles.css";
import { calculateKeyboardPosition, KeyboardPosition } from "./keyboard-utils";

// Keyboard dimensions and positioning

// Keyboard layout configuration
const KEYBOARD_LAYOUT = {
  default: ["7 8 9", "4 5 6", "1 2 3", ". 0 - {bksp}"],
};

const KEYBOARD_DISPLAY = {
  "{bksp}": "⌫",
};

const KEYBOARD_BUTTON_THEME = [
  {
    class: "hg-button-bksp",
    buttons: "{bksp}",
  },
];

// Keyboard styling and configuration
const KEYBOARD_THEME = "hg-theme-default hg-layout-numeric numeric-theme";
const KEYBOARD_ANIMATION_CLASS =
  "fixed z-50 animate-in zoom-in-95 fade-in-0 duration-200";
const KEYBOARD_CONTAINER_CLASS = "bg-card border-2 border-border shadow-lg p-3";

interface VirtualKeyboardProps {
  enable?: boolean;
  triggerRef: React.RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  onChange?: (input: string) => void;
  onKeyPress?: (button: string) => void;
}

/**
 * Calculate optimal keyboard position relative to trigger element
 * with viewport boundary detection
 */

const VirtualKeyboard = ({
  enable = true,
  triggerRef,
  isOpen,
  onClose,
  onChange,
  onKeyPress,
}: VirtualKeyboardProps) => {
  const keyboardInstanceRef = useRef<HTMLDivElement | null>(null);
  const keyboardContainerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<KeyboardPosition>({
    top: 0,
    left: 0,
    isReady: false,
  });

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
        <div className="numeric-keyboard-container">
          <Keyboard
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            keyboardRef={(ref: any) => (keyboardInstanceRef.current = ref)}
            onChange={onChange}
            onKeyPress={onKeyPress}
            theme={KEYBOARD_THEME}
            layout={KEYBOARD_LAYOUT}
            display={KEYBOARD_DISPLAY}
            buttonTheme={KEYBOARD_BUTTON_THEME}
            mergeDisplay={true}
            disableCaretPositioning={true}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VirtualKeyboard;
