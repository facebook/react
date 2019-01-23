// @flow

export const ElementTypeClassOrFunction = 1;
export const ElementTypeContext = 2;
export const ElementTypeForwardRef = 3;
export const ElementTypeMemo = 4;
export const ElementTypeOtherOrUnknown = 5;
export const ElementTypeProfiler = 6;
export const ElementTypeSuspense = 7;

export type ElementType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// TODO: Add profiling node

export type Element = {|
  id: string,
  type: ElementType,
  key: React$Key | null,
  displayName: string | null,
  children: Array<string>,
|};

export type InspectedElement = {|
  id: string,
  context: Object | null,
  hooks: Object | null,
  props: Object | null,
  state: Object | null,
  canEditProps: boolean,
  source: Object,
|};
