# TP/SL Dialog to Form Integration Plan

## Overview

Add checkbox functionality to TP/SL entries, integrate TP/SL data into the trade setup form via callback, and display an overview in the main form when TP/SL is configured.

## Implementation Steps

### 1. Update TP/SL Schema to Include Checkbox (`isHit`)

- **File**: `src/components/form/schemas/tpsl-schema.ts`
- Add `isHit: z.boolean().optional()` to `tpslEntrySchema`
- Default value should be `false` for new entries
- Update `TPSLEntry` type to include `isHit?: boolean`

### 2. Add Checkbox UI to TP/SL Dialog

- **File**: `src/components/dialog/tpsl-dialog.tsx`
- Add checkbox component next to each TP/SL entry (price and margin fields)
- Use a standard checkbox input or create a checkbox component if needed
- Position checkbox appropriately in the grid layout (consider adding to the entry card)
- Register checkbox with react-hook-form using `Controller` or `register`
- Default `isHit` to `false` for new entries

### 3. Update TP/SL Dialog to Pass Data Back via Callback

- **File**: `src/components/dialog/tpsl-dialog.tsx`
- Update `TPSLDialogProps` interface to include `onSave?: (data: TPSLFormData) => void`
- Modify `onSubmit` to call `onSave` callback with validated form data before closing
- Keep validation but remove server action (toast can stay for now)
- Update dialog constants to support the callback prop

### 4. Integrate TP/SL Schema into Add Trade Schema

- **File**: `src/components/form/schemas/add-trade-schema.ts`
- Import `TPSLFormData` from `tpsl-schema.ts`
- Add optional `tpsl` field to `baseTradeFormSchema` using the TP/SL schema structure
- Make it optional so form can be submitted without TP/SL configured
- Update `splitAddTradeSetupData` to extract TP/SL data separately (for future use)
- Export TP/SL type for use in form

### 5. Store TP/SL Data in Add Trade Form State

- **File**: `src/components/form/forms/add_trade_form.tsx`
- Add state to store TP/SL data (use `useState`)
- Update the "Configure TP/SL" button's `onClick` to pass `onSave` callback
- Callback should store TP/SL data in form state and update form value via `setValue`
- Pass existing TP/SL data to dialog when reopening (via dialog payload)
- Update dialog open call to include `onSave` callback and existing data

### 6. Show TP/SL Overview Instead of Button When Configured

- **File**: `src/components/form/forms/add_trade_form.tsx`
- Conditionally render either:
  - "Configure TP/SL" button when no TP/SL data exists
  - TP/SL overview component when TP/SL data exists
- Overview should display:
  - Summary of Take Profits (count, total margin, hit status if any)
  - Summary of Stop Losses (count, total margin, hit status if any)
  - Clickable to reopen dialog for editing
- Overview should be styled as a card or compact display
- Include an edit button or make the overview clickable to reopen the dialog

### 7. Handle Direction Changes

- **File**: `src/components/form/forms/add_trade_form.tsx`
- When direction changes, clear or invalidate TP/SL data (since validation depends on direction)
- Clear TP/SL state and form value when direction changes
- Show appropriate message or reset TP/SL state when direction changes
- Consider showing a warning when direction changes after TP/SL is configured

## Technical Notes

- Checkbox should be editable in the dialog for planning purposes
- TP/SL data persists in form state until main form submission
- Dialog can be reopened to reconfigure TP/SL
- Validation errors will occur if direction changes after TP/SL is configured (expected behavior)
- Database persistence will be handled in a future phase
- Overview component should be compact and informative
