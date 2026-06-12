/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Facade} from './DevToolsFacade';
import type {
  TreeNode,
  NodeInfo,
  ComponentSource,
  OwnersStack,
  OwnerEntry,
  FindComponentsResult,
  ToolError,
} from './DevToolsFacadeTreeTools';

import {createTreeTools} from './DevToolsFacadeTreeTools';

export type {
  TreeNode,
  NodeInfo,
  HookNode,
  ComponentSource,
  SourceLocation,
  OwnersStack,
  OwnerEntry,
  FindComponentsResult,
  ToolError,
} from './DevToolsFacadeTreeTools';

// The set of tools assembled from a Facade. Each tool returns a plain
// JavaScript value (see the types in ./DevToolsFacadeTreeTools); serialization is the
// integrator's responsibility. Integrators decide whether to expose these on
// globals or call them directly.
export type Tools = {
  getComponentTree: (
    depth?: number,
    rootLabel?: string,
  ) => Array<TreeNode> | ToolError,
  getComponentByLabel: (label: string) => NodeInfo | ToolError,
  findComponents: (
    name: string,
    rootLabel?: string,
    page?: number,
    pageSize?: number,
  ) => FindComponentsResult | ToolError,
  getComponentSource: (label: string) => ComponentSource | ToolError,
  getOwnersStack: (label: string) => OwnersStack | ToolError,
  getOwnersBranch: (label: string) => Array<OwnerEntry> | ToolError,
};

/**
 * Assemble the set of tools from a Facade. The tools read the facade's tracked
 * runtime state (fiber roots, per-renderer internals) lazily on each call and
 * never touch globals, so the integrator fully owns both the facade and the
 * returned tools.
 *
 * @param facade - A Facade returned by installFacade().
 */
export function createTools(facade: Facade): Tools {
  const tree = createTreeTools(facade.fiberRoots, facade.rendererInternals);

  return {
    getComponentTree: tree.getComponentTree,
    getComponentByLabel: tree.getComponentByLabel,
    findComponents: tree.findComponents,
    getComponentSource: tree.getComponentSource,
    getOwnersStack: tree.getOwnersStack,
    getOwnersBranch: tree.getOwnersBranch,
  };
}
