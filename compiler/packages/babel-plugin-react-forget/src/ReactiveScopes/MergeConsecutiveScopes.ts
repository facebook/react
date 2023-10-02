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
  ReactiveInstruction,
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
    // The maximum index within the original instructions that we have reached.
    // Used to avoid emitting duplicate instructions
    let maxIndex: number = 0;

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
        // We can sometimes call resetCurrentScope twice for the same index,
        // such as when an instruction resets and then a subsequent scope also resets.
        // This is the only case in which we push instructions w/o gating on
        // `currentScope != null`, so we avoid duplicates by checking the max index
        // already emitted.
        if (index < block.length && index > maxIndex) {
          nextInstructions.push(block[index]!);
          maxIndex = index;
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
          canMergeScopes(currentScope.scope, instr) &&
          // If there are intermediate instructions, we can only merge the scopes
          // if those intermediate instructions are all used by the second scope.
          // if not, merging them would make those values unavailable to subsequent
          // code by moving them inside a different block scope in the output.
          areLValuesLastUsedByScope(instr.scope, lvalues, this.lastUsage)
        ) {
          const intermediateInstructions = block.slice(currentScope.to, i);
          currentScope.scope.scope.range.end = makeInstructionId(
            Math.max(currentScope.scope.scope.range.end, instr.scope.range.end)
          );
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
      for (const instr of nextInstructions) {
        if (instr.kind === "scope") {
          updateScopeDeclarations(instr.scope, this.lastUsage);
        }
      }

      block.length = 0;
      block.push(...nextInstructions);
    }
  }
}

/**
 * Updates @param scope's declarations to remove any declarations that are not
 * used after the scope, based on the scope's updated range post-merging.
 */
function updateScopeDeclarations(
  scope: ReactiveScope,
  lastUsage: Map<IdentifierId, InstructionId>
): void {
  for (const [key] of scope.declarations) {
    const lastUsedAt = lastUsage.get(key)!;
    if (lastUsedAt < scope.range.end) {
      scope.declarations.delete(key);
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

function canMergeScopes(a: ReactiveScopeBlock, b: ReactiveScopeBlock): boolean {
  // Don't merge scopes with reassignments
  if (a.scope.reassignments.size !== 0 || b.scope.reassignments.size !== 0) {
    return false;
  }
  // Merge scopes whose dependencies are identical
  if (areEqualDependencies(a.scope.dependencies, b.scope.dependencies)) {
    return true;
  }
  // Merge scopes where the outputs of the previous scope are the inputs
  // of the subsequent scope. Note that the output of a scope is not
  // guaranteed to change when its inputs change, for example `foo(x)`
  // may not change when `x` changes, for example `foo(x) { return x < 10}`
  // will not change as x changes from 0 -> 1.
  // Therefore we check that the outputs of the previous scope are of a type
  // that is guaranteed to invalidate with its inputs, and only merge in this case.
  if (
    areEqualDependencies(
      new Set(
        [...a.scope.declarations.values()].map((declaration) => ({
          identifier: declaration.identifier,
          path: [],
        }))
      ),
      b.scope.dependencies
    ) &&
    scopeAlwaysInvalidatesOnDependencyChanges(a)
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

function scopeAlwaysInvalidatesOnDependencyChanges(
  scope: ReactiveScopeBlock
): boolean {
  const visitor = new DeclarationTypeVisitor(scope.scope);
  visitor.visitScope(scope, undefined);
  return visitor.alwaysInvalidatesOnInputChange;
}

class DeclarationTypeVisitor extends ReactiveFunctionVisitor<void> {
  scope: ReactiveScope;
  alwaysInvalidatesOnInputChange: boolean = false;

  constructor(scope: ReactiveScope) {
    super();
    this.scope = scope;
  }

  override visitInstruction(
    instruction: ReactiveInstruction,
    state: void
  ): void {
    this.traverseInstruction(instruction, state);
    if (
      instruction.lvalue === null ||
      !this.scope.declarations.has(instruction.lvalue.identifier.id)
    ) {
      // no lvalue or this instruction isn't directly constructing a
      // scope output value, skip
      return;
    }
    switch (instruction.value.kind) {
      case "FunctionExpression":
      case "ArrayExpression":
      case "JsxExpression":
      case "JsxFragment":
      case "ObjectExpression": {
        // These instruction types *always* allocate. If they execute
        // they will produce a new value, triggering downstream reactive
        // updates
        this.alwaysInvalidatesOnInputChange = true;
        break;
      }
    }
  }
}
