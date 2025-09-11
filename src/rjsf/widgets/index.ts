import { RegistryWidgetsType } from "@rjsf/utils";
export { ToggleBadge } from "./ToggleBadge";

// Import the actual widget and field components
import { ToggleBadge } from "./ToggleBadge";

// Widget registry for RJSF - using correct widget keys
export const customWidgets: RegistryWidgetsType = {
  CheckboxWidget: ToggleBadge,
};
