import { DeleteSnapshotDialog } from "@/components/dialog/delete-snapshot-dialog";
import { DeleteTradeSetupDialog } from "@/components/dialog/delete-trade-setup-dialog";
import { DeleteTradeTemplateDialog } from "@/components/dialog/delete-trade-template-dialog";
import { FindDrawingDialog } from "@/components/dialog/find-drawing-dialog";
import NotesDialog from "@/components/dialog/notes-dialog";
import { RemoveTimeframeConfirmationDialog } from "@/components/dialog/remove-timeframe-confirmation-dialog";
import { StatusChangeConfirmationDialog } from "@/components/dialog/status-change-confirmation-dialog";
import TagViewTable from "@/components/tag-view-table";
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
  DELETE_SNAPSHOT: {
    key: "DELETE_SNAPSHOT" as const,
    component: DeleteSnapshotDialog,
  },
  DELETE_TRADE_SETUP: {
    key: "DELETE_TRADE_SETUP" as const,
    component: DeleteTradeSetupDialog,
  },
  DELETE_TRADE_TEMPLATE: {
    key: "DELETE_TRADE_TEMPLATE" as const,
    component: DeleteTradeTemplateDialog,
  },
  NOTES: {
    key: "NOTES" as const,
    component: NotesDialog,
  },
  STATUS_CHANGE_CONFIRMATION: {
    key: "STATUS_CHANGE_CONFIRMATION" as const,
    component: StatusChangeConfirmationDialog,
  },
  REMOVE_TIMEFRAME_CONFIRMATION: {
    key: "REMOVE_TIMEFRAME_CONFIRMATION" as const,
    component: RemoveTimeframeConfirmationDialog,
  },
  TAGS_COMPARISON: {
    key: "TAGS_COMPARISON" as const,
    component: TagViewTable,
  },
  FIND_DRAWING: {
    key: "FIND_DRAWING" as const,
    component: FindDrawingDialog,
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
