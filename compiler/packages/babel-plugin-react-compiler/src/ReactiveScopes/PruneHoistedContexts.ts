/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '..';
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

const REWRITTEN_HOISTED_CONST: unique symbol = Symbol(
  'REWRITTEN_HOISTED_CONST',
);
const REWRITTEN_HOISTED_LET: unique symbol = Symbol('REWRITTEN_HOISTED_LET');

type HoistedIdentifiers = Map<
  DeclarationId,
  | InstructionKind
  | typeof REWRITTEN_HOISTED_CONST
  | typeof REWRITTEN_HOISTED_LET
>;

class Visitor extends ReactiveFunctionTransform<HoistedIdentifiers> {
  override transformInstruction(
    instruction: ReactiveInstruction,
    state: HoistedIdentifiers,
  ): Transformed<ReactiveStatement> {
    this.visitInstruction(instruction, state);

    /**
     * Remove hoisted declarations to preserve TDZ
     */
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
      instruction.value.kind === 'DeclareContext' &&
      instruction.value.lvalue.kind === 'HoistedFunction'
    ) {
      state.set(
        instruction.value.lvalue.place.identifier.declarationId,
        InstructionKind.Function,
      );
      return {kind: 'remove'};
    }

    if (instruction.value.kind === 'StoreContext') {
      const kind = state.get(
        instruction.value.lvalue.place.identifier.declarationId,
      );
      if (kind != null) {
        CompilerError.invariant(kind !== REWRITTEN_HOISTED_CONST, {
          reason: 'Expected exactly one store to a hoisted const variable',
          loc: instruction.loc,
        });
        if (
          kind === InstructionKind.Const ||
          kind === InstructionKind.Function
        ) {
          state.set(
            instruction.value.lvalue.place.identifier.declarationId,
            REWRITTEN_HOISTED_CONST,
          );
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
        } else if (kind !== REWRITTEN_HOISTED_LET) {
          /**
           * Context variables declared with let may have reassignments. Only
           * insert a `DeclareContext` for the first encountered `StoreContext`
           * instruction.
           */
          state.set(
            instruction.value.lvalue.place.identifier.declarationId,
            REWRITTEN_HOISTED_LET,
          );
          return {
            kind: 'replace-many',
            value: [
              {
                kind: 'instruction',
                instruction: {
                  id: instruction.id,
                  lvalue: null,
                  value: {
                    kind: 'DeclareContext',
                    lvalue: {
                      kind: InstructionKind.Let,
                      place: {...instruction.value.lvalue.place},
                    },
                    loc: instruction.value.loc,
                  },
                  loc: instruction.loc,
                },
              },
              {kind: 'instruction', instruction},
            ],
          };
        }
      }
    }

    return {kind: 'keep'};
  }
}
