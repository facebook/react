/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Effect, HIRFunction, Identifier, Place} from '../HIR';
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {IdentifierState} from './AnalyseFunctions';

/*
 * This pass infers which of the given function's context (free) variables
 * are definitively mutated by the function. This analysis is *partial*,
 * and only annotates provable mutations, and may miss mutations via indirections.
 * The intent of this pass is to drive validations, rejecting known-bad code
 * while avoiding false negatives, and the inference should *not* be used to
 * drive changes in output.
 *
 * Note that a complete analysis is possible but would have too many false negatives.
 * The approach would be to run LeaveSSA and InferReactiveScopeVariables in order to
 * find all possible aliases of a context variable which may be mutated. However, this
 * can lead to false negatives:
 *
 * ```
 * const [x, setX] = useState(null); // x is frozen
 * const fn = () => { // context=[x]
 *    const z = {}; // z is mutable
 *    foo(z, x); // potentially mutate z and x
 *    z.a = true; // definitively mutate z
 * }
 * fn();
 * ```
 *
 * When we analyze function expressions we assume that context variables are mutable,
 * so we assume that `x` is mutable. We infer that `foo(z, x)` could be mutating the
 * two variables to alias each other, such that `z.a = true` could be mutating `x`,
 * and we would infer that `x` is definitively mutated. Then when we run
 * InferReferenceEffects on the outer code we'd reject it, since there is a definitive
 * mutation of a frozen value.
 *
 * Thus the actual implementation looks at only basic aliasing. The above example would
 * pass, since z does not directly alias `x`. However, mutations through trivial aliases
 * are detected:
 *
 * ```
 * const [x, setX] = useState(null); // x is frozen
 * const fn = () => { // context=[x]
 *    const z = x;
 *    z.a = true; // ERROR: mutates x
 * }
 * fn();
 * ```
 */
export function inferMutableContextVariables(fn: HIRFunction): void {
  const state = new IdentifierState();
  const knownMutatedIdentifiers = new Set<Identifier>();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'PropertyLoad': {
          state.declareProperty(
            instr.lvalue,
            instr.value.object,
            instr.value.property,
          );
          break;
        }
        case 'ComputedLoad': {
          /*
           * The path is set to an empty string as the path doesn't really
           * matter for a computed load.
           */
          state.declareProperty(instr.lvalue, instr.value.object, '');
          break;
        }
        case 'LoadLocal':
        case 'LoadContext': {
          if (instr.lvalue.identifier.name === null) {
            state.declareTemporary(instr.lvalue, instr.value.place);
          }
          break;
        }
        default: {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            visitOperand(state, knownMutatedIdentifiers, operand);
          }
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      visitOperand(state, knownMutatedIdentifiers, operand);
    }
  }
  for (const operand of fn.context) {
    if (knownMutatedIdentifiers.has(operand.identifier)) {
      operand.effect = Effect.Mutate;
    }
  }
}

function visitOperand(
  state: IdentifierState,
  knownMutatedIdentifiers: Set<Identifier>,
  operand: Place,
): void {
  const resolved = state.resolve(operand.identifier);
  if (operand.effect === Effect.Mutate || operand.effect === Effect.Store) {
    knownMutatedIdentifiers.add(resolved);
  }
}
