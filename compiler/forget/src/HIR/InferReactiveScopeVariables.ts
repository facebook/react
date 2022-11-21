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
  makeInstructionId,
  makeScopeId,
  MutableRange,
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
  // Store the mutable range and set of identifiers for each scope
  const scopeVariables: Map<
    ScopeId,
    { range: MutableRange; variables: Set<Identifier> }
  > = new Map();

  /**
   * Iterate over all the identifiers and assign a unique ScopeId
   * for each scope (based on the set identifier).
   *
   * At the same time, group the identifiers in each scope and
   * build a MutableRange that describes the span of mutations
   * across all identifiers in each scope.
   */
  scopes.forEach((identifier, groupIdentifier) => {
    let scopeId = scopeIds.get(groupIdentifier);
    if (scopeId == null) {
      scopeId = makeScopeId(scopeIds.size);
      scopeIds.set(groupIdentifier, scopeId);
    }
    identifier.scope = scopeId;

    let scope = scopeVariables.get(scopeId);
    if (scope === undefined) {
      scope = {
        range: { ...identifier.mutableRange },
        variables: new Set(),
      };
      scopeVariables.set(scopeId, scope);
    } else {
      scope.range.start = makeInstructionId(
        Math.min(scope.range.start, identifier.mutableRange.start)
      );
      scope.range.end = makeInstructionId(
        Math.max(scope.range.end, identifier.mutableRange.end)
      );
    }
    scope.variables.add(identifier);
  });

  // Update all the identifiers for each scope now that we know
  // the scope's full range.
  for (const [_, scope] of scopeVariables) {
    for (const identifier of scope.variables) {
      identifier.mutableRange = scope.range;
    }
  }
}

// Is the operand mutable at this given instruction
function isMutable(instr: Instruction, place: Place): boolean {
  return (
    instr.id >= place.identifier.mutableRange.start &&
    instr.id < place.identifier.mutableRange.end
  );
}
