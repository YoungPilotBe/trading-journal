/* eslint-disable react-refresh/only-export-components */
import { DialogKey, DialogPayload } from "@/constants/dialog.constants";
import React, { createContext, useCallback, useContext, useState } from "react";

// Dialog state type
interface DialogState {
  key: DialogKey | null;
  payload: unknown | null;
}

// Context value type
interface DialogContextValue {
  dialogState: DialogState;
  openDialog: <K extends DialogKey>(key: K, payload: DialogPayload<K>) => void;
  closeDialog: () => void;
  isDialogOpen: (key: DialogKey) => boolean;
}

// Create context
const DialogContext = createContext<DialogContextValue | undefined>(undefined);

// Provider component
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>({
    key: null,
    payload: null,
  });

  const openDialog = useCallback(
    <K extends DialogKey>(key: K, payload: DialogPayload<K>) => {
      setDialogState({ key, payload });
    },
    []
  );

  const closeDialog = useCallback(() => {
    setDialogState({ key: null, payload: null });
  }, []);

  const isDialogOpen = useCallback(
    (key: DialogKey) => {
      return dialogState.key === key;
    },
    [dialogState.key]
  );

  const value: DialogContextValue = {
    dialogState,
    openDialog,
    closeDialog,
    isDialogOpen,
  };

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}

// Hook to use dialog context
export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

// Re-export for convenience
export { DIALOGS } from "@/constants/dialog.constants";
