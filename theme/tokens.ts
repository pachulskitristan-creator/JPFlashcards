// theme/tokens.ts
// A named scale for the values already in use across the app (radius,
// spacing), so new screens pull from one set instead of picking a new
// number each time. Existing screens aren't retrofitted to use these —
// that would be a large, purely-mechanical diff for zero visual change
// — but new/edited code should reach for these first.

export const RADII = {
  sm: 14, // small controls: chips, checkboxes, form inputs
  md: 16, // standard cards, rows, buttons
  lg: 20, // primary CTAs, larger cards
  xl: 24, // sheets, modals, hero cards
} as const;

export const SPACING = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
} as const;
