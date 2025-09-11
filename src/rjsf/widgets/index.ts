import { RegistryWidgetsType } from "@rjsf/utils";
export { RadioToggleBadge } from "./RadioToggleBadge";
export { ToggleBadge } from "./ToggleBadge";

// Import the actual widget and field components
import { RadioToggleBadge } from "./RadioToggleBadge";
import { ToggleBadge } from "./ToggleBadge";

// Widget registry for RJSF - using correct widget keys
export const customWidgets: RegistryWidgetsType = {
  CheckboxWidget: ToggleBadge,
  RadioToggleBadge: RadioToggleBadge,
};
