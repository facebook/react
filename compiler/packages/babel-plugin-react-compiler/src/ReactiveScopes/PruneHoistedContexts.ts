/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '..';
import {
  convertHoistedLValueKind,
  Environment,
  IdentifierId,
  InstructionId,
  InstructionKind,
  Place,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
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
 *
 * Detects and bails out on context variables which are:
 * - function declarations, which are hoisted by JS engines to the nearest block scope
 * - referenced before they are defined (i.e. having a `DeclareContext HoistedConst`)
 * - declared
 */
export function pruneHoistedContexts(fn: ReactiveFunction): void {
  visitReactiveFunction(fn, new Visitor(), {
    activeScopes: empty(),
    exceptions: new Set(),
    uninitialized: new Map(),
  });
}

type VisitorState = {
  activeScopes: Stack<Set<IdentifierId>>;
  exceptions: Set<Place>;
  uninitialized: Map<
    IdentifierId,
    | {
        kind: 'maybefunc';
      }
    | {
        kind: 'func';
        definition: Place | null;
      }
  >;
};

/**
 * Oh man what about declarations in nested scopes?? t.t
 * We *might* encounter the following.
 * scope @0
 */
class Visitor extends ReactiveFunctionTransform<VisitorState> {
  override visitScope(scope: ReactiveScopeBlock, state: VisitorState): void {
    state.activeScopes = state.activeScopes.push(
      new Set(scope.scope.declarations.keys()),
    );
    for (const decl of scope.scope.declarations.values()) {
      state.uninitialized.set(decl.identifier.id, {kind: 'maybefunc'});
    }
    this.traverseScope(scope, state);
    state.activeScopes.pop();

    /**
     * References to hoisted functions are now "safe" as it has been assigned
     */
    for (const id of scope.scope.declarations.keys()) {
      state.uninitialized.delete(id);
    }
  }
  override visitPlace(
    _id: InstructionId,
    place: Place,
    state: VisitorState,
  ): void {
    const maybeHoistedFn = state.uninitialized.get(place.identifier.id);
    if (
      maybeHoistedFn?.kind === 'func' &&
      maybeHoistedFn.definition !== place
    ) {
      CompilerError.throwTodo({
        reason: '[PruneHoistedContexts] Rewrite hoisted function references',
        loc: place.loc,
      });
    }
  }
  override transformInstruction(
    instruction: ReactiveInstruction,
    state: VisitorState,
  ): Transformed<ReactiveStatement> {
    /**
     * Remove hoisted declarations to preserve TDZ
     */
    if (instruction.value.kind === 'DeclareContext') {
      const maybeNonHoisted = convertHoistedLValueKind(
        instruction.value.lvalue.kind,
      );
      if (maybeNonHoisted != null) {
        if (
          maybeNonHoisted === InstructionKind.Function &&
          state.uninitialized.has(instruction.value.lvalue.place.identifier.id)
        ) {
          state.uninitialized.set(
            instruction.value.lvalue.place.identifier.id,
            {
              kind: 'func',
              definition: null,
            },
          );
        }
        return {kind: 'remove'};
      }
    }
    if (
      instruction.value.kind === 'StoreContext' &&
      instruction.value.lvalue.kind !== InstructionKind.Reassign
    ) {
      /**
       * Rewrite StoreContexts let/const that will be pre-declared in
       * codegen to reassignments.
       */
      const lvalueId = instruction.value.lvalue.place.identifier.id;
      const isDeclaredByScope = state.activeScopes.find(scope =>
        scope.has(lvalueId),
      );
      if (isDeclaredByScope) {
        if (
          instruction.value.lvalue.kind === InstructionKind.Let ||
          instruction.value.lvalue.kind === InstructionKind.Const
        ) {
          instruction.value.lvalue.kind = InstructionKind.Reassign;
        } else if (instruction.value.lvalue.kind === InstructionKind.Function) {
          state.exceptions.add(instruction.value.lvalue.place);
          const maybeHoistedFn = state.uninitialized.get(lvalueId);
          if (maybeHoistedFn != null) {
            CompilerError.invariant(maybeHoistedFn.kind === 'func', {
              reason: '[PruneHoistedContexts] Unexpected hoisted function',
              loc: instruction.loc,
            });
            maybeHoistedFn.definition = instruction.value.lvalue.place;
          }
        } else {
          CompilerError.throwTodo({
            reason: '[PruneHoistedContexts] Unexpected kind ',
            description: `(${instruction.value.lvalue.kind})`,
            loc: instruction.loc,
          });
        }
      }
    }

    this.visitInstruction(instruction, state);
    return {kind: 'keep'};
  }
}

/**
 * For functions whose declarations span block boundaries,
 */
