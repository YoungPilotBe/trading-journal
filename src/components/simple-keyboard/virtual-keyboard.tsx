import { isRasp } from "@/utils/env-utils";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "./keyboard-styles.css";

interface VirtualKeyboardProps {
  enable?: boolean;
  triggerRef: React.RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  onChange?: (input: string) => void;
  onKeyPress?: (button: string) => void;
}

const VirtualKeyboard = ({
  enable = isRasp,
  triggerRef,
  isOpen,
  onClose,
  onChange,
  onKeyPress,
}: VirtualKeyboardProps) => {
  const keyboardInstanceRef = useRef<HTMLDivElement | null>(null);
  const keyboardContainerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position based on trigger element
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const keyboardWidth = 380;
    const keyboardHeight = 320;
    const padding = 12;

    let left = rect.right + padding;
    let top = rect.top;

    // Check if keyboard would go off right edge
    if (left + keyboardWidth > window.innerWidth) {
      left = rect.left - keyboardWidth - padding;
    }

    // Check if keyboard would go off left edge
    if (left < 0) {
      left = rect.left;
      top = rect.bottom + padding;
    }

    // Check if keyboard would go off bottom
    if (top + keyboardHeight > window.innerHeight) {
      top = rect.top - keyboardHeight - padding;
    }

    setPosition({ top, left });
  }, [isOpen, triggerRef]);

  // Handle click/touch outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !keyboardContainerRef.current?.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  // Handle keyboard changes
  const handleChange = (value: string) => {
    onChange?.(value);
  };

  const handleKeyPress = (button: string) => {
    onKeyPress?.(button);
  };

  if (!isOpen || !enable) return null;

  return createPortal(
    <div
      ref={keyboardContainerRef}
      className="fixed z-50 fade-in-0 zoom-in-95 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="bg-card border-2 border-border shadow-lg p-3">
        <div className="numeric-keyboard-container">
          <Keyboard
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            keyboardRef={(r: any) => (keyboardInstanceRef.current = r)}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            theme="hg-theme-default hg-layout-numeric numeric-theme"
            layout={{
              default: ["7 8 9", "4 5 6", "1 2 3", ". 0 {bksp}"],
            }}
            display={{
              "{bksp}": "⌫",
            }}
            buttonTheme={[
              {
                class: "hg-button-bksp",
                buttons: "{bksp}",
              },
            ]}
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
