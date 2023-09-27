/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  IdentifierId,
  InstructionId,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveScope,
  ReactiveScopeBlock,
  ReactiveScopeDependency,
  makeInstructionId,
} from "../HIR";
import {
  ReactiveFunctionTransform,
  ReactiveFunctionVisitor,
  visitReactiveFunction,
} from "./visitors";

/**
 * The primary goal of this pass is to reduce memoization overhead, specifically:
 * - Use fewer memo slots
 * - Reduce the number of comparisons and other memoization-related instructions
 *
 * This is achieved by merging consecutive reactive scopes when the two scopes
 * will always invalidate together. The idea is that if two scopes would always
 * invalidate together, it's more efficient to group the scopes together to save
 * on memoization overhead.
 *
 * This optimization is necessarily somewhat limited. First, we only merge
 * scopes that are in the same (reactive) block, ie we don't merge across
 * control-flow or block-scoping boundaries. Second, we can only merge scopes
 * so long as any intermediate instructions are safe to memoize — specifically,
 * as long as the values created by those instructions are only referenced by
 * the second scope and not elsewhere. This is to avoid changing control-flow
 * and to avoid increasing the number of scope outputs (which defeats the optimization).
 *
 * With that in mind we can apply the optimization in two cases. Given a block with
 * scope A, some safe-to-memoize instructions I, and scope B, we can merge scopes when:
 * - A and B have identical dependencies. This means they will invalidate together, so
 *   by merging the scopes we can avoid duplicate cache slots and duplicate checks of
 *   those dependencies.
 * - The output of A is the input to B. Any invalidation of A will change its output
 *   which invalidates B, so we can similarly merge scopes. Note that this optimization
 *   may not be beneficial if the outupts of A are not guaranteed to change if its input
 *   changes, but in practice this is generally the case.
 *
 */
export function mergeConsecutiveScopes(fn: ReactiveFunction): void {
  const lastUsageVisitor = new FindLastUsageVisitor();
  visitReactiveFunction(fn, lastUsageVisitor, undefined);
  visitReactiveFunction(
    fn,
    new Transform(lastUsageVisitor.lastUsage),
    undefined
  );
}

class FindLastUsageVisitor extends ReactiveFunctionVisitor<void> {
  lastUsage: Map<IdentifierId, InstructionId> = new Map();

  override visitPlace(id: InstructionId, place: Place, _state: void): void {
    const previousUsage = this.lastUsage.get(place.identifier.id);
    const lastUsage =
      previousUsage !== undefined
        ? makeInstructionId(Math.max(previousUsage, id))
        : id;
    this.lastUsage.set(place.identifier.id, lastUsage);
  }
}

class Transform extends ReactiveFunctionTransform<void> {
  lastUsage: Map<IdentifierId, InstructionId>;

  constructor(lastUsage: Map<IdentifierId, InstructionId>) {
    super();
    this.lastUsage = lastUsage;
  }

  override visitBlock(block: ReactiveBlock, state: void): void {
    this.traverseBlock(block, state);

    // The current reactive scope which is a candidate for subsequent scopes
    // to be merged into
    let currentScope: {
      // The scope itself
      scope: ReactiveScopeBlock;
      // the starting index within `block` of this scope (inclusive)
      from: number;
      // the index within `block` of instructions which are merged into this
      // scope (exclusive)
      to: number;
      // Whether this block has been emitted yet onto `nextInstructions`
      merged: boolean;
    } | null = null;

    // Tracks the lvalues of instructions which occur between reactive scopes
    // We can't merge two scopes if their intervening instructions are needed
    // by subsequent code
    const lvalues: Set<IdentifierId> = new Set();

    // The updated set of instructions for the block. Stays null until
    // we make changes (ie merge scopes)
    let nextInstructions: ReactiveBlock | null = null;

    // Called when we find some instruction that cannot be merged into a
    // preceding scope, or we otherwise need to reset and not consider
    // the previous candidate scope to be mergeable anymore.
    function resetCurrentScope(index: number): void {
      if (nextInstructions !== null) {
        if (currentScope !== null && !currentScope.merged) {
          currentScope.merged = true;
          nextInstructions.push(block[currentScope.from]!);
        }
        if (currentScope !== null) {
          nextInstructions.push(...block.slice(currentScope.to, index));
        }
        if (index < block.length) {
          nextInstructions.push(block[index]!);
        }
      }
      currentScope = null;
    }

    for (let i = 0; i < block.length; i++) {
      const instr = block[i]!;
      if (instr.kind === "terminal") {
        // Don't merge scopes with terminals in between.
        // In theory we could allow certain types of terminals,
        // such as loops, but for simplicity we just skip all
        // cases with terminals
        resetCurrentScope(i);
      } else if (instr.kind === "instruction") {
        switch (instr.instruction.value.kind) {
          case "JSXText":
          case "Primitive":
          case "LoadLocal":
          case "PropertyLoad":
          case "ComputedLoad": {
            // Allow simple instructions between scopes
            if (currentScope === null && nextInstructions !== null) {
              nextInstructions.push(instr);
            } else if (
              currentScope !== null &&
              instr.instruction.lvalue !== null
            ) {
              lvalues.add(instr.instruction.lvalue.identifier.id);
            }
            break;
          }
          default: {
            // skip merging if there are complex intermediate instructions
            resetCurrentScope(i);
          }
        }
      } else {
        if (
          currentScope !== null &&
          canMergeScopes(currentScope.scope.scope, instr.scope) &&
          // If there are intermediate instructions, we can only merge the scopes
          // if those intermediate instructions are all used by the second scope.
          // if not, merging them would make those values unavailable to subsequent
          // code by moving them inside a different block scope in the output.
          areLValuesLastUsedByScope(instr.scope, lvalues, this.lastUsage)
        ) {
          const intermediateInstructions = block.slice(currentScope.to, i);
          currentScope.scope.instructions.push(...intermediateInstructions);
          currentScope.scope.instructions.push(...instr.instructions);
          for (const [key, value] of instr.scope.declarations) {
            currentScope.scope.scope.declarations.set(key, value);
          }
          if (nextInstructions === null) {
            nextInstructions = block.slice(0, currentScope.from);
            nextInstructions.push(currentScope.scope);
            currentScope.merged = true;
          }
          currentScope.to = i + 1;
          lvalues.clear();
        } else {
          resetCurrentScope(i - 1); // don't include the current scope
          currentScope = { scope: instr, from: i, to: i + 1, merged: false };
          lvalues.clear();
        }
      }
    }
    if (currentScope !== null && nextInstructions !== null) {
      nextInstructions.push(...block.slice(currentScope.to, block.length));
    }

    if (nextInstructions !== null) {
      block.length = 0;
      block.push(...nextInstructions);
    }
  }
}

/**
 * Returns whether the given @param scope is the last usage of all
 * the given @param lvalues. Returns false if any of the lvalues
 * are used again after the scope.
 */
function areLValuesLastUsedByScope(
  scope: ReactiveScope,
  lvalues: Set<IdentifierId>,
  lastUsage: Map<IdentifierId, InstructionId>
): boolean {
  for (const lvalue of lvalues) {
    const lastUsedAt = lastUsage.get(lvalue)!;
    if (lastUsedAt >= scope.range.end) {
      return false;
    }
  }
  return true;
}

function canMergeScopes(a: ReactiveScope, b: ReactiveScope): boolean {
  // Don't merge scopes with reassignments
  if (a.reassignments.size !== 0 || b.reassignments.size !== 0) {
    return false;
  }
  if (areEqualDependencies(a.dependencies, b.dependencies)) {
    return true;
  }
  if (
    areEqualDependencies(
      new Set(
        [...a.declarations.values()].map((declaration) => ({
          identifier: declaration.identifier,
          path: [],
        }))
      ),
      b.dependencies
    )
  ) {
    return true;
  }
  return false;
}

function areEqualDependencies(
  a: Set<ReactiveScopeDependency>,
  b: Set<ReactiveScopeDependency>
): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const aValue of a) {
    let found = false;
    for (const bValue of b) {
      if (
        aValue.identifier === bValue.identifier &&
        areEqualPaths(aValue.path, bValue.path)
      ) {
        found = true;
        break;
      }
    }
    if (!found) {
      return false;
    }
  }
  return true;
}

function areEqualPaths(a: Array<string>, b: Array<string>): boolean {
  return a.length === b.length && a.every((item, ix) => item === b[ix]);
}
