import { DIALOGS, DialogKey } from "@/constants/dialog.constants";
import { useDialog } from "@/contexts/dialog-context";
import { ReactElement } from "react";

export function DialogManager(): ReactElement | null {
  const { dialogState, closeDialog } = useDialog();

  if (!dialogState.key || !dialogState.payload) {
    return null;
  }

  const key = dialogState.key as DialogKey;
  const dialogConfig = DIALOGS[key];

  if (!dialogConfig) {
    return null;
  }

  const Component = dialogConfig.component;

  // Create base props that all dialogs need
  const baseProps = {
    open: true,
    onOpenChange: closeDialog,
  };

  // Combine with payload - this is type-safe at runtime because:
  // 1. The payload was created with openDialog(key, payload) where payload matches the component
  // 2. The key-to-component mapping ensures the right component gets the right props
  const allProps = { ...baseProps, ...dialogState.payload };

  // TypeScript can't prove the union type correlation, but we know it's safe
  // This is the most pragmatic solution that maintains runtime type safety
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Component {...(allProps as any)} />;
}
