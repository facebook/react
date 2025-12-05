/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CompilerDiagnostic,
  CompilerError,
  Effect,
  ErrorCategory,
  SourceLocation,
} from '..';
import {GeneratedSource, HIRFunction, IdentifierId} from '../HIR';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
} from '../HIR/visitors';
import {createControlDominators} from '../Inference/ControlDominators';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import {Result} from '../Utils/Result';
import {assertExhaustive} from '../Utils/utils';

export function validateNoImpureValuesInRender(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const impure = new Map<IdentifierId, SourceLocation>();
  inferImpureValues(fn, impure);

  const error = new CompilerError();
  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      for (const effect of instr.effects ?? []) {
        if (
          effect.kind !== 'Render' ||
          !impure.has(effect.place.identifier.id)
        ) {
          continue;
        }
        const impureSource = impure.get(effect.place.identifier.id)!;
        error.pushDiagnostic(
          CompilerDiagnostic.create({
            category: ErrorCategory.Purity,
            reason: 'Cannot access impure value during render',
            description:
              'Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent)',
          })
            .withDetails({
              kind: 'error',
              loc: effect.place.loc,
              message: 'Cannot access impure value during render',
            })
            .withDetails({
              kind: 'error',
              loc: impureSource,
              message: 'Impure value created here',
            }),
        );
      }
    }
  }
  return error.asResult();
}

function inferImpureValues(
  fn: HIRFunction,
  impure: Map<IdentifierId, SourceLocation>,
): void {
  const getBlockControl = createControlDominators(fn, place => {
    return impure.has(place.identifier.id);
  });

  let hasChanges = false;
  do {
    hasChanges = false;

    for (const block of fn.body.blocks.values()) {
      const controlTest = getBlockControl(block.id);

      for (const phi of block.phis) {
        if (impure.has(phi.place.identifier.id)) {
          // Already marked reactive on a previous pass
          continue;
        }
        let impurePhiSource = null;
        for (const [, operand] of phi.operands) {
          const operandSource = impure.get(operand.identifier.id);
          if (operandSource != null) {
            impurePhiSource = operandSource;
            break;
          }
        }
        if (impurePhiSource != null) {
          impure.set(phi.place.identifier.id, impurePhiSource);
          hasChanges = true;
        } else {
          for (const [pred] of phi.operands) {
            const predControl = getBlockControl(pred);
            if (predControl != null) {
              impure.set(phi.place.identifier.id, predControl.loc);
              hasChanges = true;
              break;
            }
          }
        }
      }

      for (const instr of block.instructions) {
        const impuritySource = instr.effects?.some(
          effect => effect.kind === 'Impure',
        )
          ? instr.value.loc
          : null;
        if (impuritySource != null) {
          for (const lvalue of eachInstructionLValue(instr)) {
            if (!impure.has(lvalue.identifier.id)) {
              impure.set(lvalue.identifier.id, impuritySource);
              hasChanges = true;
            }
          }
        }
        if (impuritySource != null || controlTest != null) {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            switch (operand.effect) {
              case Effect.Capture:
              case Effect.Store:
              case Effect.ConditionallyMutate:
              case Effect.ConditionallyMutateIterator:
              case Effect.Mutate: {
                if (
                  !impure.has(operand.identifier.id) &&
                  isMutable(instr, operand)
                ) {
                  impure.set(
                    operand.identifier.id,
                    impuritySource ?? controlTest?.loc ?? GeneratedSource,
                  );
                  hasChanges = true;
                }
                break;
              }
              case Effect.Freeze:
              case Effect.Read: {
                // no-op
                break;
              }
              case Effect.Unknown: {
                CompilerError.invariant(false, {
                  reason: 'Unexpected unknown effect',
                  description: null,
                  details: [
                    {
                      kind: 'error',
                      loc: operand.loc,
                      message: null,
                    },
                  ],
                  suggestions: null,
                });
              }
              default: {
                assertExhaustive(
                  operand.effect,
                  `Unexpected effect kind \`${operand.effect}\``,
                );
              }
            }
          }
        }
      }
    }
  } while (hasChanges);
}
