import { useRef, useState } from "react";

/**
 * Hook to manage timeframe keyboard state and interactions
 * Similar to the virtual keyboard hook pattern
 */
export const useTimeframeKeyboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLInputElement>(null);

  const openKeyboard = () => setIsOpen(true);
  const closeKeyboard = () => setIsOpen(false);
  const toggleKeyboard = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    triggerRef,
    openKeyboard,
    closeKeyboard,
    toggleKeyboard,
  };
};

