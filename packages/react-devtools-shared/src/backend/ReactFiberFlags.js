// This list of flags must be synced with the following file:
// https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberFlags.js

export const NoFlags = /*                      */ 0b00000000000000000000000000;
export const PerformedWork = /*                */ 0b00000000000000000000000001;
export const Placement = /*                    */ 0b00000000000000000000000010;
export const Hydrating = /*                    */ 0b00000000000000100000000000;
export const DidCapture = /*                   */ 0b00000000000000000001000000;
export const Incomplete = /*                   */ 0b00000000000100000000000000;
