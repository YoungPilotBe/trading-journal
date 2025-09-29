import { DeleteTradeSetupDialog } from "@/components/dialog/delete-trade-setup-dialog";
import { DeleteTradeTemplateDialog } from "@/components/dialog/delete-trade-template-dialog";
import { StatusChangeConfirmationDialog } from "@/components/dialog/status-change-confirmation-dialog";
import { TagsComparisonDialog } from "@/components/dialog/tags-comparison-dialog";
import { ComponentType } from "react";

// Base dialog props that all dialogs must have
interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Extract component props without the base dialog props
type ExtractDialogPayload<T> =
  T extends ComponentType<infer P> ? Omit<P, keyof BaseDialogProps> : never;

// Dialog configuration with keys, components, and inferred payload types
export const DIALOGS = {
  DELETE_TRADE_SETUP: {
    key: "DELETE_TRADE_SETUP" as const,
    component: DeleteTradeSetupDialog,
  },
  DELETE_TRADE_TEMPLATE: {
    key: "DELETE_TRADE_TEMPLATE" as const,
    component: DeleteTradeTemplateDialog,
  },
  STATUS_CHANGE_CONFIRMATION: {
    key: "STATUS_CHANGE_CONFIRMATION" as const,
    component: StatusChangeConfirmationDialog,
  },
  TAGS_COMPARISON: {
    key: "TAGS_COMPARISON" as const,
    component: TagsComparisonDialog,
  },
} as const;

export type DialogKey = keyof typeof DIALOGS;

// Infer payload types from the actual component props
export type DialogPayload<K extends DialogKey> = ExtractDialogPayload<
  (typeof DIALOGS)[K]["component"]
>;

// Helper type to get component type for a specific dialog key
export type DialogComponent<K extends DialogKey> =
  (typeof DIALOGS)[K]["component"];
