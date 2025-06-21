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
  IdentifierId,
  LoweredFunction,
  isRefOrRefValue,
  makeInstructionId,
} from '../HIR';
import {deadCodeElimination} from '../Optimization';
import {inferReactiveScopeVariables} from '../ReactiveScopes';
import {rewriteInstructionKindsBasedOnReassignment} from '../SSA';
import {inferMutableRanges} from './InferMutableRanges';
import inferReferenceEffects from './InferReferenceEffects';
import {assertExhaustive} from '../Utils/utils';
import {inferMutationAliasingEffects} from './InferMutationAliasingEffects';
import {inferFunctionExpressionAliasingEffectsSignature} from './InferFunctionExpressionAliasingEffectsSignature';
import {inferMutationAliasingRanges} from './InferMutationAliasingRanges';

export default function analyseFunctions(func: HIRFunction): void {
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'ObjectMethod':
        case 'FunctionExpression': {
          if (!func.env.config.enableNewMutationAliasingModel) {
            lower(instr.value.loweredFunc.func);
            infer(instr.value.loweredFunc);
          } else {
            lowerWithMutationAliasing(instr.value.loweredFunc.func);
          }

          /**
           * Reset mutable range for outer inferReferenceEffects
           */
          for (const operand of instr.value.loweredFunc.func.context) {
            /**
             * NOTE: inferReactiveScopeVariables makes identifiers in the scope
             * point to the *same* mutableRange instance. Resetting start/end
             * here is insufficient, because a later mutation of the range
             * for any one identifier could affect the range for other identifiers.
             */
            operand.identifier.mutableRange = {
              start: makeInstructionId(0),
              end: makeInstructionId(0),
            };
            operand.identifier.scope = null;
          }
          break;
        }
      }
    }
  }
}

function lowerWithMutationAliasing(fn: HIRFunction): void {
  /**
   * Phase 1: similar to lower(), but using the new mutation/aliasing inference
   */
  analyseFunctions(fn);
  inferMutationAliasingEffects(fn, {isFunctionExpression: true});
  deadCodeElimination(fn);
  const mutationEffects = inferMutationAliasingRanges(fn, {
    isFunctionExpression: true,
  }).unwrap();
  rewriteInstructionKindsBasedOnReassignment(fn);
  inferReactiveScopeVariables(fn);
  const aliasingEffects = inferFunctionExpressionAliasingEffectsSignature(fn);
  if (aliasingEffects == null) {
    /**
     * If the data flow within the function expression is too complex to resolve,
     * we null out the function expressions' alisingEffects. This ensures that
     * InferMutationAliasingEffects at the outer level will fall back to a more
     * conservative of the function as a plain mutable value — see the handling of
     * 'Apply' in applyEffect(). As part of this we also set all context variables
     * to Capture, which will downgrade if they turn out to be primitives, frozen,
     * globals, etc.
     */
    fn.aliasingEffects = null;
    for (const operand of fn.context) {
      operand.effect = Effect.Capture;
    }
  } else {
    /**
     * We were able to determine a precise set of mutation and aliasing (data flow)
     * effects for the function. Annotate which context variables are Capture based
     * on which are mutated and/or captured into some other value. Capture is used
     * as a signal to InferMutationAliasingEffects (at the outer function level) that
     * the function itself has to be treated as mutable. See 'CreateFunction' handling
     * in applyEffect().
     */
    const functionEffects = [...mutationEffects, ...aliasingEffects];
    fn.aliasingEffects = functionEffects;

    /**
     * Phase 2: populate the Effect of each context variable to use in inferring
     * the outer function. For example, InferMutationAliasingEffects uses context variable
     * effects to decide if the function may be mutable or not.
     */
    const capturedOrMutated = new Set<IdentifierId>();
    for (const effect of functionEffects) {
      switch (effect.kind) {
        case 'Assign':
        case 'Alias':
        case 'Capture':
        case 'CreateFrom': {
          capturedOrMutated.add(effect.from.identifier.id);
          break;
        }
        case 'Apply': {
          CompilerError.invariant(false, {
            reason: `[AnalyzeFunctions] Expected Apply effects to be replaced with more precise effects`,
            loc: effect.function.loc,
          });
        }
        case 'Mutate':
        case 'MutateConditionally':
        case 'MutateTransitive':
        case 'MutateTransitiveConditionally': {
          capturedOrMutated.add(effect.value.identifier.id);
          break;
        }
        case 'Impure':
        case 'Render':
        case 'MutateFrozen':
        case 'MutateGlobal':
        case 'CreateFunction':
        case 'Create':
        case 'Freeze':
        case 'ImmutableCapture': {
          // no-op
          break;
        }
        default: {
          assertExhaustive(
            effect,
            `Unexpected effect kind ${(effect as any).kind}`,
          );
        }
      }
    }

    for (const operand of fn.context) {
      if (
        capturedOrMutated.has(operand.identifier.id) ||
        operand.effect === Effect.Capture
      ) {
        operand.effect = Effect.Capture;
      } else {
        operand.effect = Effect.Read;
      }
    }
  }

  fn.env.logger?.debugLogIRs?.({
    kind: 'hir',
    name: 'AnalyseFunction (inner)',
    value: fn,
  });
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
