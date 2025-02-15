/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '../CompilerError';
import {
  Effect,
  HIRFunction,
  Identifier,
  LoweredFunction,
  isRefOrRefValue,
  makeInstructionId,
} from '../HIR';
import {deadCodeElimination} from '../Optimization';
import {inferReactiveScopeVariables} from '../ReactiveScopes';
import {rewriteInstructionKindsBasedOnReassignment} from '../SSA';
import {inferMutableRanges} from './InferMutableRanges';
import inferReferenceEffects from './InferReferenceEffects';

export default function analyseFunctions(func: HIRFunction): void {
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'ObjectMethod':
        case 'FunctionExpression': {
          lower(instr.value.loweredFunc.func);
          infer(instr.value.loweredFunc);

          /**
           * Reset mutable range for outer inferReferenceEffects
           */
          for (const operand of instr.value.loweredFunc.func.context) {
            operand.identifier.mutableRange.start = makeInstructionId(0);
            operand.identifier.mutableRange.end = makeInstructionId(0);
            operand.identifier.scope = null;
          }
          break;
        }
      }
    }
  }
}

function lower(func: HIRFunction): void {
  analyseFunctions(func);
  inferReferenceEffects(func, {isFunctionExpression: true});
  deadCodeElimination(func);
  inferMutableRanges(func);
  rewriteInstructionKindsBasedOnReassignment(func);
  inferReactiveScopeVariables(func);
  func.env.logger?.debugLogIRs?.({
    kind: 'hir',
    name: 'AnalyseFunction (inner)',
    value: func,
  });
}

function infer(loweredFunc: LoweredFunction): void {
  for (const operand of loweredFunc.func.context) {
    const identifier = operand.identifier;
    CompilerError.invariant(operand.effect === Effect.Unknown, {
      reason:
        '[AnalyseFunctions] Expected Function context effects to not have been set',
      loc: operand.loc,
    });
    if (isRefOrRefValue(identifier)) {
      /*
       * TODO: this is a hack to ensure we treat functions which reference refs
       * as having a capture and therefore being considered mutable. this ensures
       * the function gets a mutable range which accounts for anywhere that it
       * could be called, and allows us to help ensure it isn't called during
       * render
       */
      operand.effect = Effect.Capture;
    } else if (isMutatedOrReassigned(identifier)) {
      /**
       * Reflects direct reassignments, PropertyStores, and ConditionallyMutate
       * (directly or through maybe-aliases)
       */
      operand.effect = Effect.Capture;
    } else {
      operand.effect = Effect.Read;
    }
  }
}

function isMutatedOrReassigned(id: Identifier): boolean {
  /*
   * This check checks for mutation and reassingnment, so the usual check for
   * mutation (ie, `mutableRange.end - mutableRange.start > 1`) isn't quite
   * enough.
   *
   * We need to track re-assignments in context refs as we need to reflect the
   * re-assignment back to the captured refs.
   */
  return id.mutableRange.end > id.mutableRange.start;
}
