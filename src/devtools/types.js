// @flow

export const ElementTypeClass = 1;
export const ElementTypeFunction = 2;
export const ElementTypeContext = 3;
export const ElementTypeForwardRef = 4;
export const ElementTypeMemo = 5;
export const ElementTypeOtherOrUnknown = 6;
export const ElementTypeProfiler = 7;
export const ElementTypeRoot = 8;
export const ElementTypeSuspense = 9;

// Different types of elements displayed in the Elements tree.
// These types may be used to visually distinguish types,
// or to enable/disable certain functionality.
export type ElementType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
