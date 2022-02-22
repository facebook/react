/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Wall = {|
  // `listen` returns the "unlisten" function.
  listen: (fn: Function) => Function,
  send: (event: string, payload: any, transferable?: Array<any>) => void,
|};

// WARNING
// The values below are referenced by ComponentFilters (which are saved via localStorage).
// Do not change them or it will break previously saved user customizations.
// If new element types are added, use new numbers rather than re-ordering existing ones.
//
// Changing these types is also a backwards breaking change for the standalone shell,
// since the frontend and backend must share the same values-
// and the backend is embedded in certain environments (like React Native).
export const ElementTypeClass = 1;
export const ElementTypeContext = 2;
export const ElementTypeFunction = 5;
export const ElementTypeForwardRef = 6;
export const ElementTypeHostComponent = 7;
export const ElementTypeMemo = 8;
export const ElementTypeOtherOrUnknown = 9;
export const ElementTypeProfiler = 10;
export const ElementTypeRoot = 11;
export const ElementTypeSuspense = 12;
export const ElementTypeSuspenseList = 13;
export const ElementTypeTracingMarker = 14;

// Different types of elements displayed in the Elements tree.
// These types may be used to visually distinguish types,
// or to enable/disable certain functionality.
export type ElementType = 1 | 2 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

// WARNING
// The values below are referenced by ComponentFilters (which are saved via localStorage).
// Do not change them or it will break previously saved user customizations.
// If new filter types are added, use new numbers rather than re-ordering existing ones.
export const ComponentFilterElementType = 1;
export const ComponentFilterDisplayName = 2;
export const ComponentFilterLocation = 3;
export const ComponentFilterHOC = 4;

export type ComponentFilterType = 1 | 2 | 3 | 4;

// Hide all elements of types in this Set.
// We hide host components only by default.
export type ElementTypeComponentFilter = {|
  isEnabled: boolean,
  type: 1,
  value: ElementType,
|};

// Hide all elements with displayNames or paths matching one or more of the RegExps in this Set.
// Path filters are only used when elements include debug source location.
export type RegExpComponentFilter = {|
  isEnabled: boolean,
  isValid: boolean,
  type: 2 | 3,
  value: string,
|};

export type BooleanComponentFilter = {|
  isEnabled: boolean,
  isValid: boolean,
  type: 4,
|};

export type ComponentFilter =
  | BooleanComponentFilter
  | ElementTypeComponentFilter
  | RegExpComponentFilter;

export type HookName = string | null;
// Map of hook source ("<filename>:<line-number>:<column-number>") to name.
// Hook source is used instead of the hook itself because the latter is not stable between element inspections.
// We use a Map rather than an Array because of nested hooks and traversal ordering.
export type HookSourceLocationKey = string;
export type HookNames = Map<HookSourceLocationKey, HookName>;

export type LRUCache<K, V> = {|
  get: (key: K) => V,
  has: (key: K) => boolean,
  remove: (key: K) => void,
  reset: () => void,
  set: (key: K, value: V) => void,
|};

export type StyleXPlugin = {|
  sources: Array<string>,
  resolvedStyles: Object,
|};

export type Plugins = {|
  stylex: StyleXPlugin | null,
|};

export const StrictMode = 1;
