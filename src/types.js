// @flow

export type Bridge = {
  addListener(type: string, callback: Function): void,
  removeListener(type: string, callback: Function): void,
  send(event: string, payload: any, transferable?: Array<any>): void,
};

export type Wall = {|
  // `listen` returns the "unlisten" function.
  listen: (fn: Function) => Function,
  send: (event: string, payload: any, transferable?: Array<any>) => void,
|};

export const ElementTypeClass = 1;
export const ElementTypeContext = 2;
export const ElementTypeEventComponent = 3;
export const ElementTypeEventTarget = 4;
export const ElementTypeFunction = 5;
export const ElementTypeForwardRef = 6;
export const ElementTypeHost = 7;
export const ElementTypeMemo = 8;
export const ElementTypeOtherOrUnknown = 9;
export const ElementTypeProfiler = 10;
export const ElementTypeRoot = 11;
export const ElementTypeSuspense = 12;

// Different types of elements displayed in the Elements tree.
// These types may be used to visually distinguish types,
// or to enable/disable certain functionality.
export type ElementType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
