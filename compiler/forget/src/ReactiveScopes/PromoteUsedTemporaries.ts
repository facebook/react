/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ReactiveFunction, ReactiveScopeBlock } from "../HIR/HIR";
import { ReactiveFunctionVisitor, visitReactiveFunction } from "./visitors";

type VisitorState = {
  nextId: number;
};
class Visitor extends ReactiveFunctionVisitor<VisitorState> {
  override visitScope(block: ReactiveScopeBlock, state: VisitorState) {
    this.traverseScope(block, state);
    for (const dep of block.scope.dependencies) {
      const { identifier } = dep.place;
      if (identifier.name == null) {
        identifier.name = `t${state.nextId++}`;
      }
    }
    // This is technically optional. We could prune ReactiveScopes
    // whose outputs are not used in another computation or return
    // value.
    // Many of our current test fixtures do not return a value, so
    // it is better for now to promote (and memoize) every output.
    for (const identifier of block.scope.outputs) {
      if (identifier.name == null) {
        identifier.name = `t${state.nextId++}`;
      }
    }
  }
}
export function promoteUsedTemporaries(fn: ReactiveFunction) {
  visitReactiveFunction(fn, new Visitor(), { nextId: 0 });
}
