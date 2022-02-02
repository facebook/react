/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Source} from 'shared/ReactElementType';
import type {
  Dehydrated,
  Unserializable,
} from 'react-devtools-shared/src/hydration';
import type {ElementType, Plugins} from 'react-devtools-shared/src/types';

// Each element on the frontend corresponds to a Fiber on the backend.
// Some of its information (e.g. id, type, displayName) come from the backend.
// Other bits (e.g. weight and depth) are computed on the frontend for windowing and display purposes.
// Elements are updated on a push basis– meaning the backend pushes updates to the frontend when needed.
export type Element = {|
  id: number,
  parentID: number,
  children: Array<number>,
  type: ElementType,
  displayName: string | null,
  key: number | string | null,

  hocDisplayNames: null | Array<string>,

  // Should the elements children be visible in the tree?
  isCollapsed: boolean,

  // Owner (if available)
  ownerID: number,

  // How many levels deep within the tree is this element?
  // This determines how much indentation (left padding) should be used in the Elements tree.
  depth: number,

  // How many nodes (including itself) are below this Element within the tree.
  // This property is used to quickly determine the total number of Elements,
  // and the Element at any given index (for windowing purposes).
  weight: number,

  // This element is not in a StrictMode compliant subtree.
  // Only true for React versions supporting StrictMode.
  isStrictModeNonCompliant: boolean,
|};

export type SerializedElement = {|
  displayName: string | null,
  id: number,
  key: number | string | null,
  hocDisplayNames: Array<string> | null,
  type: ElementType,
|};

export type OwnersList = {|
  id: number,
  owners: Array<SerializedElement> | null,
|};

export type InspectedElementResponseType =
  | 'error'
  | 'full-data'
  | 'hydrated-path'
  | 'no-change'
  | 'not-found';

export type InspectedElement = {|
  id: number,

  // Does the current renderer support editable hooks and function props?
  canEditHooks: boolean,
  canEditFunctionProps: boolean,

  // Does the current renderer support advanced editing interface?
  canEditHooksAndDeletePaths: boolean,
  canEditHooksAndRenamePaths: boolean,
  canEditFunctionPropsDeletePaths: boolean,
  canEditFunctionPropsRenamePaths: boolean,

  // Is this Error, and can its value be overridden now?
  isErrored: boolean,
  canToggleError: boolean,
  targetErrorBoundaryID: ?number,

  // Is this Suspense, and can its value be overridden now?
  canToggleSuspense: boolean,

  // Can view component source location.
  canViewSource: boolean,

  // Does the component have legacy context attached to it.
  hasLegacyContext: boolean,

  // Inspectable properties.
  context: Object | null,
  hooks: Object | null,
  props: Object | null,
  state: Object | null,
  key: number | string | null,
  errors: Array<[string, number]>,
  warnings: Array<[string, number]>,

  // List of owners
  owners: Array<SerializedElement> | null,

  // Location of component in source code.
  source: Source | null,

  type: ElementType,

  // Meta information about the root this element belongs to.
  rootType: string | null,

  // Meta information about the renderer that created this element.
  rendererPackageName: string | null,
  rendererVersion: string | null,

  // UI plugins/visualizations for the inspected element.
  plugins: Plugins,
|};

// TODO: Add profiling type

export type DehydratedData = {|
  cleaned: Array<Array<string | number>>,
  data:
    | string
    | Dehydrated
    | Unserializable
    | Array<Dehydrated>
    | Array<Unserializable>
    | {[key: string]: string | Dehydrated | Unserializable, ...},
  unserializable: Array<Array<string | number>>,
|};
