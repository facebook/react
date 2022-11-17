/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import DisjointSet from "./DisjointSet";
import {
  HIRFunction,
  Identifier,
  Instruction,
  makeScopeId,
  Place,
  ScopeId,
} from "./HIR";
import { eachInstructionOperand } from "./visitors";

/**
 * For each mutable variable, infers a reactive scope which will construct that
 * variable. Variables that co-mutate are assigned to the same reactive scope.
 * This pass does *not* infer the set of instructions necessary to compute each
 * variable/scope, only the set of variables that will be computed by each scope.
 *
 * Examples:
 * ```javascript
 * // Mutable arguments
 * let x = {};
 * let y = [];
 * foo(x, y); // both args mutable, could alias each other
 * y.push(x); // y is part of callee, counts as operand
 *
 * let z = {};
 * y.push(z);
 *
 * // Mutable assignment
 * let x = {};
 * let y = [];
 * x.y = y; // trivial aliasing
 * ```
 *
 * More generally, all mutable operands (incl lvalue) of an instruction must go in the
 * same scope.
 *
 * ## Implementation
 *
 * 1. Iterate over all instructions in all blocks (order does not matter, single pass),
 *    and create disjoint sets ({@link DisjointSet}) for each set of operands that
 *    mutate together per above rules.
 * 2. Iterate the contents of each set, and assign a new {@link ScopeId} to each set,
 *    and update the `scope` property of each item in that set to that scope id.
 *
 * ## Other Issues Uncovered
 *
 * Mutable lifetimes need to account for aliasing (known todo, already described in InferMutableLifetimes.ts)
 *
 * ```javascript
 * let x = {};
 * let y = [];
 * x.y = y; // RHS is not considered mutable here bc not further mutation
 * mutate(x); // bc y is aliased here, it should still be considered mutable above
 * ```
 */
export function inferReactiveScopeVariables(fn: HIRFunction) {
  // Represents the set of reactive scopes as disjoint sets of identifiers
  // that mutate together.
  const scopes = new DisjointSet<Identifier>();
  for (const [_, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      const operands: Array<Identifier> = [phi.id, ...phi.operands.values()];
      scopes.union(operands);
    }

    for (const instr of block.instructions) {
      const operands: Array<Identifier> = [];
      if (instr.lvalue !== null) {
        // invariant(
        //   isMutable(instr, instr.lvalue!.place),
        //   "Assignment always means the value is mutable:\n" +
        //     printMixedHIR(instr)
        // );
        operands.push(instr.lvalue!.place.identifier);
      }
      for (const operand of eachInstructionOperand(instr)) {
        if (isMutable(instr, operand)) {
          operands.push(operand.identifier);
        }
      }
      if (operands.length !== 0) {
        scopes.union(operands);
      }
    }
  }

  // Maps each scope (by its identifying member) to a ScopeId value
  const scopeIds: Map<Identifier, ScopeId> = new Map();

  // Iterate over all the identifiers in all scopes, and assign each
  // identifier to its group's scope id. The first identifier in each
  // group assigns the scope id for that group.
  scopes.forEach((identifier, groupIdentifier) => {
    let scopeId = scopeIds.get(groupIdentifier);
    if (scopeId == null) {
      scopeId = makeScopeId(scopeIds.size);
      scopeIds.set(groupIdentifier, scopeId);
    }
    identifier.scope = scopeId;
  });
}

// Is the operand mutable at this given instruction
function isMutable(instr: Instruction, place: Place): boolean {
  return (
    // TODO: should start really be exclusive?
    instr.id > place.identifier.mutableRange.start &&
    instr.id <= place.identifier.mutableRange.end
  );
}
