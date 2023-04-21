/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScopeBlock,
} from "../HIR/HIR";
import { ReactiveFunctionVisitor, visitReactiveFunction } from "./visitors";

type VisitorState = {
  nextId: number;
};
class Visitor extends ReactiveFunctionVisitor<VisitorState> {
  override visitScope(block: ReactiveScopeBlock, state: VisitorState): void {
    this.traverseScope(block, state);
    for (const dep of block.scope.dependencies) {
      const { identifier } = dep;
      if (identifier.name == null) {
        identifier.name = `t${state.nextId++}`;
      }
    }
    // This is technically optional. We could prune ReactiveScopes
    // whose outputs are not used in another computation or return
    // value.
    // Many of our current test fixtures do not return a value, so
    // it is better for now to promote (and memoize) every output.
    for (const [, declaration] of block.scope.declarations) {
      if (declaration.identifier.name == null) {
        declaration.identifier.name = `t${state.nextId++}`;
      }
    }
  }
  override visitInstruction(
    instruction: ReactiveInstruction,
    state: VisitorState
  ): void {
    this.traverseInstruction(instruction, state);
  }
}
export function promoteUsedTemporaries(fn: ReactiveFunction): void {
  const state: VisitorState = {
    nextId: 0,
  };
  visitReactiveFunction(fn, new Visitor(), state);
}
