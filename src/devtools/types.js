// @flow

export const ElementTypeClass = 1;
export const ElementTypeEventComponent = 2;
export const ElementTypeEventTarget = 3;
export const ElementTypeFunction = 4;
export const ElementTypeContext = 5;
export const ElementTypeForwardRef = 6;
export const ElementTypeMemo = 7;
export const ElementTypeOtherOrUnknown = 8;
export const ElementTypeProfiler = 9;
export const ElementTypeRoot = 10;
export const ElementTypeSuspense = 11;

// Different types of elements displayed in the Elements tree.
// These types may be used to visually distinguish types,
// or to enable/disable certain functionality.
export type ElementType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
