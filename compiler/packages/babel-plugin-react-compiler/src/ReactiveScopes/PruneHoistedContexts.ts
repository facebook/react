/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  DeclarationId,
  InstructionKind,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveStatement,
} from '../HIR';
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
  const hoistedIdentifiers: HoistedIdentifiers = new Map();
  visitReactiveFunction(fn, new Visitor(), hoistedIdentifiers);
}

type HoistedIdentifiers = Map<DeclarationId, InstructionKind>;

class Visitor extends ReactiveFunctionTransform<HoistedIdentifiers> {
  override transformInstruction(
    instruction: ReactiveInstruction,
    state: HoistedIdentifiers,
  ): Transformed<ReactiveStatement> {
    this.visitInstruction(instruction, state);
    if (
      instruction.value.kind === 'DeclareContext' &&
      instruction.value.lvalue.kind === 'HoistedConst'
    ) {
      state.set(
        instruction.value.lvalue.place.identifier.declarationId,
        InstructionKind.Const,
      );
      return {kind: 'remove'};
    }

    if (
      instruction.value.kind === 'DeclareContext' &&
      instruction.value.lvalue.kind === 'HoistedLet'
    ) {
      state.set(
        instruction.value.lvalue.place.identifier.declarationId,
        InstructionKind.Let,
      );
      return {kind: 'remove'};
    }

    if (
      instruction.value.kind === 'StoreContext' &&
      state.has(instruction.value.lvalue.place.identifier.declarationId)
    ) {
      const kind = state.get(
        instruction.value.lvalue.place.identifier.declarationId,
      )!;
      return {
        kind: 'replace',
        value: {
          kind: 'instruction',
          instruction: {
            ...instruction,
            value: {
              ...instruction.value,
              lvalue: {
                ...instruction.value.lvalue,
                kind,
              },
              type: null,
              kind: 'StoreLocal',
            },
          },
        },
      };
    }

    return {kind: 'keep'};
  }
}
