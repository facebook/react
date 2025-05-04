/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Effect,
  HIRFunction,
  Identifier,
  isMutableEffect,
  isRefOrRefLikeMutableType,
  makeInstructionId,
} from '../HIR/HIR';
import {eachInstructionValueOperand} from '../HIR/visitors';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import DisjointSet from '../Utils/DisjointSet';

/**
 * If a function captures a mutable value but never gets called, we don't infer a
 * mutable range for that function. This means that we also don't alias the function
 * with its mutable captures.
 *
 * This case is tricky, because we don't generally know for sure what is a mutation
 * and what may just be a normal function call. For example:
 *
 * ```
 * hook useFoo() {
 *   const x = makeObject();
 *   return () => {
 *     return readObject(x); // could be a mutation!
 *   }
 * }
 * ```
 *
 * If we pessimistically assume that all such cases are mutations, we'd have to group
 * lots of memo scopes together unnecessarily. However, if there is definitely a mutation:
 *
 * ```
 * hook useFoo(createEntryForKey) {
 *   const cache = new WeakMap();
 *   return (key) => {
 *     let entry = cache.get(key);
 *     if (entry == null) {
 *       entry = createEntryForKey(key);
 *       cache.set(key, entry); // known mutation!
 *     }
 *     return entry;
 *   }
 * }
 * ```
 *
 * Then we have to ensure that the function and its mutable captures alias together and
 * end up in the same scope. However, aliasing together isn't enough if the function
 * and operands all have empty mutable ranges (end = start + 1).
 *
 * This pass finds function expressions and object methods that have an empty mutable range
 * and known-mutable operands which also don't have a mutable range, and ensures that the
 * function and those operands are aliased together *and* that their ranges are updated to
 * end after the function expression. This is sufficient to ensure that a reactive scope is
 * created for the alias set.
 */
export function inferAliasForUncalledFunctions(
  fn: HIRFunction,
  aliases: DisjointSet<Identifier>,
): void {
  for (const block of fn.body.blocks.values()) {
    instrs: for (const instr of block.instructions) {
      const {lvalue, value} = instr;
      if (
        value.kind !== 'ObjectMethod' &&
        value.kind !== 'FunctionExpression'
      ) {
        continue;
      }
      /*
       * If the function is known to be mutated, we will have
       * already aliased any mutable operands with it
       */
      const range = lvalue.identifier.mutableRange;
      if (range.end > range.start + 1) {
        continue;
      }
      /*
       * If the function already has operands with an active mutable range,
       * then we don't need to do anything — the function will have already
       * been visited and included in some mutable alias set. This case can
       * also occur due to visiting the same function in an earlier iteration
       * of the outer fixpoint loop.
       */
      for (const operand of eachInstructionValueOperand(value)) {
        if (isMutable(instr, operand)) {
          continue instrs;
        }
      }
      const operands: Set<Identifier> = new Set();
      for (const effect of value.loweredFunc.func.effects ?? []) {
        if (effect.kind !== 'ContextMutation') {
          continue;
        }
        /*
         * We're looking for known-mutations only, so we look at the effects
         * rather than function context
         */
        if (effect.effect === Effect.Store || effect.effect === Effect.Mutate) {
          for (const operand of effect.places) {
            /*
             * It's possible that function effect analysis thinks there was a context mutation,
             * but then InferReferenceEffects figures out some operands are globals and therefore
             * creates a non-mutable effect for those operands.
             * We should change InferReferenceEffects to swap the ContextMutation for a global
             * mutation in that case, but for now we just filter them out here
             */
            if (
              isMutableEffect(operand.effect, operand.loc) &&
              !isRefOrRefLikeMutableType(operand.identifier.type)
            ) {
              operands.add(operand.identifier);
            }
          }
        }
      }
      if (operands.size !== 0) {
        operands.add(lvalue.identifier);
        aliases.union([...operands]);
        // Update mutable ranges, if the ranges are empty then a reactive scope isn't created
        for (const operand of operands) {
          operand.mutableRange.end = makeInstructionId(instr.id + 1);
        }
      }
    }
  }
}
