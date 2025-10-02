import { Button } from "@/components/ui/button";
import React from "react";
import { useFormState } from "react-hook-form";

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: React.ReactNode | string;
  isLoading?: boolean;
}

const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ label, isLoading, className, disabled, ...props }, ref) => {
    const { isSubmitting } = useFormState();
    const isDisabled = disabled || isSubmitting || isLoading;

    return (
      <Button
        ref={ref}
        type="submit"
        className={`absolute bottom-0 right-0 duration-500 ease-out font-mono tracking-wide leading-3 ${className || ""}`}
        disabled={isDisabled}
        {...props}
      >
        {label}
      </Button>
    );
  }
);

SubmitButton.displayName = "SubmitButton";

export default SubmitButton;
