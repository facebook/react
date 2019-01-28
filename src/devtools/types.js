// @flow

import Store from './Store';

export const ElementTypeClassOrFunction = 1;
export const ElementTypeContext = 2;
export const ElementTypeForwardRef = 3;
export const ElementTypeMemo = 4;
export const ElementTypeOtherOrUnknown = 5;
export const ElementTypeProfiler = 6;
export const ElementTypeRoot = 7;
export const ElementTypeSuspense = 8;

export type ElementType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// TODO: Add profiling node

export type Element = {|
  children: Array<number>,
  depth: number,
  displayName: string | null,
  id: number,
  key: number | string | null,
  parentID: number,
  type: ElementType,
  weight: number,
|};

export type InspectedElement = {|
  id: number,
  context: Object | null,
  hooks: Object | null,
  props: Object | null,
  state: Object | null,
  canEditProps: boolean,
  source: Object,
|};

export type TreeMetadataType = {|
  size: number,
  store: Store,
|};
