import VirtualKeyboard from "@/components/simple-keyboard/virtual-keyboard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import clsx from "clsx";
import React, { useCallback, useRef, useState } from "react";
import { useFormState } from "react-hook-form";

type Props = {
  label:
    | string
    | {
        value: string;
        className: string;
      };
  enableVirtualKeyboard?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

const NumberField = React.forwardRef<HTMLInputElement, Props>(
  ({ label, name, className, enableVirtualKeyboard = true, ...props }, ref) => {
    const { errors } = useFormState({ name });
    const error = name ? errors[name]?.message : undefined;
    const hasError = !!error;

    const [showKeyboard, setShowKeyboard] = useState(false);
    const [inputType, setInputType] = useState<"number" | "text">("number");
    const [shouldClearOnFirstInput, setShouldClearOnFirstInput] =
      useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Merge refs to maintain both internal and forwarded ref
    const setRefs = useCallback(
      (element: HTMLInputElement | null) => {
        inputRef.current = element;
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

    // Handle keyboard value changes
    const handleKeyboardChange = (value: string) => {
      if (!inputRef.current) return;

      // Clear field on first input after opening keyboard
      let finalValue = value;
      if (shouldClearOnFirstInput) {
        finalValue = value.slice(-1); // Take only the last character (the new input)
        setShouldClearOnFirstInput(false);
      }

      // Update input value natively to trigger react-hook-form
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeInputValueSetter?.call(inputRef.current, finalValue);

      // Dispatch input event for react-hook-form validation
      const event = new Event("input", { bubbles: true });
      inputRef.current.dispatchEvent(event);
    };

    // Show keyboard on focus and switch to text input to allow decimal point display
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (enableVirtualKeyboard) {
        setShowKeyboard(true);
        setInputType("text"); // Switch to text to allow "." to be displayed
        setShouldClearOnFirstInput(true); // Mark to clear on first input
      }
      props.onFocus?.(e);
    };

    // Hide keyboard on blur and switch back to number input
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (enableVirtualKeyboard) {
        // Small delay to allow clicking on keyboard
        setTimeout(() => {
          setInputType("number");
        }, 100);
      }
      props.onBlur?.(e);
    };

    return (
      <>
      <div className="grid grid-cols-[30%_1fr_2.25rem] items-center font-mono ">
        <label
          className={clsx(
            "font-mono text-xs text-muted",
            typeof label === "object" && label.className
          )}
          htmlFor={name}
        >
          {typeof label === "string" ? label : label.value}
        </label>
        <div className="flex justify-end pr-2">
          <input
              ref={setRefs}
              type={inputType}
            id={name}
            name={name}
            step={0.01}
              inputMode="decimal"
              readOnly={enableVirtualKeyboard && showKeyboard}
            className={clsx(
              "text-muted-foreground placeholder:text-muted border-none !bg-transparent !font-mono !text-xs text-end !p-0 w-fit !outline-0 !ring-0 focus-visible:underline !m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]",
              className
            )}
              onFocus={handleFocus}
              onBlur={handleBlur}
            {...props}
          />
        </div>
        <div className="flex items-center justify-center">
          {hasError ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse starting:size-0 transition-all " />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">{String(error)}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
              <div className="w-2 h-2" />
          )}
        </div>
      </div>

        <VirtualKeyboard
          triggerRef={inputRef}
          isOpen={showKeyboard}
          onClose={() => {
            setShowKeyboard(false);
            setInputType("number"); // Switch back to number input when keyboard closes
          }}
          onChange={handleKeyboardChange}
        />
      </>
    );
  }
);

NumberField.displayName = "NumberField";

export default NumberField;
