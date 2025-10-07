import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { InputFieldConfig } from "../TreeNode.class";

interface InputFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "onBlur" | "onKeyDown" | "value"
  > {
  config: InputFieldConfig;
  parentPath: string;
  fieldName: string;
  initialValue?: string;
  shouldFocus?: boolean;
  onSave: (data: { key: string; values: Record<string, unknown> }) => void;
}

export const InputField = ({
  config,
  parentPath: _parentPath, // eslint-disable-line @typescript-eslint/no-unused-vars
  fieldName,
  initialValue = "",
  shouldFocus = false,
  onSave,
  ...inputProps
}: InputFieldProps) => {
  const [value, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only update value when initialValue changes and there's no current value
  useEffect(() => {
    if (!value) {
      setValue(initialValue);
    }
  }, [initialValue, value]);

  useEffect(() => {
    const shouldAutoFocus =
      shouldFocus && !inputProps.disabled && !inputProps.readOnly;
    if (shouldAutoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [shouldFocus, inputProps.disabled, inputProps.readOnly]);

  const validateAndTransform = (
    rawValue: string
  ):
    | { success: true; data: Record<string, unknown> }
    | { success: false; error: string } => {
    try {
      // Validate with Zod schema
      const validatedValue = config.schema.parse(rawValue);

      // Create the result object with the raw value
      const result: Record<string, unknown> = {
        value: validatedValue,
      };

      // Apply custom transformations
      config.custom?.forEach(({ key, transform }) => {
        result[key] = transform(validatedValue);
      });

      return { success: true, data: result };
    } catch (err) {
      const errorMessage =
        err instanceof z.ZodError
          ? (err.errors[0]?.message ?? "Invalid input")
          : "Validation failed";
      return { success: false, error: errorMessage };
    }
  };

  const handleBlur = () => {
    if (!value.trim()) {
      setError(null);
      return;
    }

    const result = validateAndTransform(value);

    if (result.success) {
      setError(null);
      onSave({
        key: fieldName,
        values: result.data,
      });
    } else {
      setError(result.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setValue("");
      setError(null);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null); // Clear error on typing
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={config.placeholder || "Enter value..."}
        {...inputProps}
        className={clsx(
          // Base styles matching ToggleBadge dimensions and appearance
          "w-full h-fit px-1 py-0.5 rounded-sm text-xs font-thin border duration-200",
          "text-center leading-tight font-mono",
          // Background and border styles
          "bg-gradient-to-t from-muted/20 to-muted/10 border-muted/50 text-foreground",
          "focus:bg-primary/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20",
          // Active state (when input has value) - same as focused state
          value.trim() &&
            !error &&
            "bg-primary/10 border-primary ring-1 ring-primary/20",
          // Error state
          error && "border-red-500 bg-red-50/50 text-red-700",
          // Disabled/readonly state
          (inputProps.disabled || inputProps.readOnly) &&
            "opacity-50 cursor-not-allowed",
          // Interactive cursor
          !inputProps.disabled &&
            !inputProps.readOnly &&
            "cursor-text hover:border-muted",
          inputProps.className
        )}
      />

      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 px-2 py-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
};
