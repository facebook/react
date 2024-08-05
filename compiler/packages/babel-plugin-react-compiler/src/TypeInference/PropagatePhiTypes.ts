/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, IdentifierId, Type, typeEquals} from '../HIR';

/**
 * Temporary workaround for InferTypes not propagating the types of phis.
 * Previously, LeaveSSA would replace all the identifiers for each phi (operands and
 * the phi itself) with a single "canonical" identifier, generally chosen as the first
 * operand to flow into the phi. In case of a phi whose operand was a phi, this could
 * sometimes be an operand from the earlier phi.
 *
 * As a result, even though InferTypes did not propagate types for phis, LeaveSSA
 * could end up replacing the phi Identifier with another identifer from an operand,
 * which _did_ have a type inferred.
 *
 * This didn't affect the initial construction of mutable ranges because InferMutableRanges
 * runs before LeaveSSA - thus, the types propagated by LeaveSSA only affected later optimizations,
 * notably MergeScopesThatInvalidateTogether which uses type to determine if a scope's output
 * will always invalidate with its input.
 *
 * The long-term correct approach is to update InferTypes to infer the types of phis,
 * but this is complicated because InferMutableRanges inadvertently depends on phis
 * never having a known type, such that a Store effect cannot occur on a phi value.
 * Once we fix InferTypes to infer phi types, then we'll also have to update InferMutableRanges
 * to handle this case.
 *
 * As a temporary workaround, this pass propagates the type of phis and can be called
 * safely *after* InferMutableRanges. Unlike LeaveSSA, this pass only propagates the
 * type if all operands have the same type, it's its more correct.
 */
export function propagatePhiTypes(fn: HIRFunction): void {
  /**
   * We track which SSA ids have had their types propagated to handle nested ternaries,
   * see the StoreLocal handling below
   */
  const propagated = new Set<IdentifierId>();
  for (const [, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      /*
       * We replicate the previous LeaveSSA behavior and only propagate types for
       * unnamed variables. LeaveSSA would have chosen one of the operands as the
       * canonical id and taken its type as the type of all identifiers. We're
       * more conservative and only propagate if the types are the same and the
       * phi didn't have a type inferred.
       *
       * Note that this can change output slightly in cases such as
       * `cond ? <div /> : null`.
       *
       * Previously the first operand's type (BuiltInJsx) would have been propagated,
       * and this expression may have been merged with subsequent reactive scopes
       * since it appears (based on that type) to always invalidate.
       *
       * But the correct type is `BuiltInJsx | null`, which we can't express and
       * so leave as a generic `Type`, which does not always invalidate and therefore
       * does not merge with subsequent scopes.
       *
       * We also don't propagate scopes for named variables, to preserve compatibility
       * with previous LeaveSSA behavior.
       */
      if (phi.id.type.kind !== 'Type' || phi.id.name !== null) {
        continue;
      }
      let type: Type | null = null;
      for (const [, operand] of phi.operands) {
        if (type === null) {
          type = operand.type;
        } else if (!typeEquals(type, operand.type)) {
          type = null;
          break;
        }
      }
      if (type !== null) {
        phi.id.type = type;
        phi.type = type;
        propagated.add(phi.id.id);
      }
    }
    for (const instr of block.instructions) {
      const {value} = instr;
      switch (value.kind) {
        case 'StoreLocal': {
          /**
           * Nested ternaries can lower to a form with an intermediate StoreLocal where
           * the value.lvalue is the temporary of the outer ternary, and the value.value
           * is the result of the inner ternary.
           *
           * This is a common pattern in practice and easy enough to support. Again, the
           * long-term approach is to update InferTypes and InferMutableRanges.
           */
          const lvalue = value.lvalue.place;
          if (
            propagated.has(value.value.identifier.id) &&
            lvalue.identifier.type.kind === 'Type' &&
            lvalue.identifier.name === null
          ) {
            lvalue.identifier.type = value.value.identifier.type;
            propagated.add(lvalue.identifier.id);
          }
        }
      }
    }
  }
}
