/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Identifier,
  InstructionId,
  Place,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScopeBlock,
} from "../HIR/HIR";
import { ReactiveFunctionVisitor, visitReactiveFunction } from "./visitors";

type VisitorState = {
  temporaries: Map<Identifier, number>;
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
    for (const [, identifier] of block.scope.declarations) {
      if (identifier.name == null) {
        identifier.name = `t${state.nextId++}`;
      }
    }
  }
  override visitPlace(
    id: InstructionId,
    place: Place,
    state: VisitorState
  ): void {
    let count = state.temporaries.get(place.identifier);
    if (count !== undefined) {
      state.temporaries.set(place.identifier, count + 1);
    }
  }
  override visitInstruction(
    instruction: ReactiveInstruction,
    state: VisitorState
  ): void {
    this.traverseInstruction(instruction, state);
    if (
      instruction.lvalue !== null &&
      instruction.lvalue.identifier.name === null &&
      instruction.value.kind !== "LoadLocal"
    ) {
      state.temporaries.set(instruction.lvalue.identifier, 0);
    }
  }
}
export function promoteUsedTemporaries(fn: ReactiveFunction): void {
  const state: VisitorState = {
    nextId: 0,
    temporaries: new Map(),
  };
  visitReactiveFunction(fn, new Visitor(), state);
  for (const [identifier, count] of state.temporaries) {
    if (count > 1) {
      identifier.name = `t${state.nextId++}`;
    }
  }
}
