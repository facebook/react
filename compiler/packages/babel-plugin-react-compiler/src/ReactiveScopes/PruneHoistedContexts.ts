/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  convertHoistedLValueKind,
  IdentifierId,
  InstructionKind,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScopeBlock,
  ReactiveStatement,
} from '../HIR';
import {empty, Stack} from '../Utils/Stack';
import {
  ReactiveFunctionTransform,
  Transformed,
  visitReactiveFunction,
} from './visitors';

/*
 * Prunes DeclareContexts lowered for HoistedConsts, and transforms any references back to its
 * original instruction kind.
 */
export function pruneHoistedContexts(fn: ReactiveFunction): void {
  visitReactiveFunction(fn, new Visitor(), {
    activeScopes: empty(),
  });
}

type VisitorState = {
  activeScopes: Stack<Set<IdentifierId>>;
};

class Visitor extends ReactiveFunctionTransform<VisitorState> {
  override visitScope(scope: ReactiveScopeBlock, state: VisitorState) {
    state.activeScopes = state.activeScopes.push(
      new Set(scope.scope.declarations.keys()),
    );
    this.traverseScope(scope, state);
    state.activeScopes.pop();
  }
  override transformInstruction(
    instruction: ReactiveInstruction,
    state: VisitorState,
  ): Transformed<ReactiveStatement> {
    this.visitInstruction(instruction, state);

    /**
     * Remove hoisted declarations to preserve TDZ
     */
    if (instruction.value.kind === 'DeclareContext') {
      const maybeNonHoisted = convertHoistedLValueKind(
        instruction.value.lvalue.kind,
      );
      if (maybeNonHoisted != null) {
        return {kind: 'remove'};
      }
    }
    if (
      instruction.value.kind === 'StoreContext' &&
      instruction.value.lvalue.kind !== InstructionKind.Reassign
    ) {
      /**
       * Rewrite StoreContexts let/const/functions that will be pre-declared in
       * codegen to reassignments.
       */
      const lvalueId = instruction.value.lvalue.place.identifier.id;
      const isDeclaredByScope = state.activeScopes.find(scope =>
        scope.has(lvalueId),
      );
      if (isDeclaredByScope) {
        instruction.value.lvalue.kind = InstructionKind.Reassign;
      }
    }

    return {kind: 'keep'};
  }
}
