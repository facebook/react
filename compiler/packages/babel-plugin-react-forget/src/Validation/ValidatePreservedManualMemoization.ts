/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError, ErrorSeverity } from "..";
import {
  Identifier,
  Instruction,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScopeBlock,
  ScopeId,
} from "../HIR";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { isMutable } from "../ReactiveScopes/InferReactiveScopeVariables";
import {
  ReactiveFunctionVisitor,
  visitReactiveFunction,
} from "../ReactiveScopes/visitors";

/**
 * Validates that all explicit manual memoization (useMemo/useCallback) was accurately
 * preserved, and that no originally memoized values became unmemoized in the output.
 *
 * This can occur if a value's mutable range somehow extended to include a hook and
 * was pruned.
 */
export function validatePreservedManualMemoization(fn: ReactiveFunction): void {
  const errors = new CompilerError();
  visitReactiveFunction(fn, new Visitor(), errors);
  if (errors.hasErrors()) {
    throw errors;
  }
}

class Visitor extends ReactiveFunctionVisitor<CompilerError> {
  scopes: Set<ScopeId> = new Set();

  override visitScope(
    scopeBlock: ReactiveScopeBlock,
    state: CompilerError
  ): void {
    this.traverseScope(scopeBlock, state);

    /*
     * Record scopes that exist in the AST so we can later check to see if
     * effect dependencies which should be memoized (have a scope assigned)
     * actually are memoized (that scope exists).
     * However, we only record scopes if *their* dependencies are also
     * memoized, allowing a transitive memoization check.
     */
    let areDependenciesMemoized = true;
    for (const dep of scopeBlock.scope.dependencies) {
      if (isUnmemoized(dep.identifier, this.scopes)) {
        areDependenciesMemoized = false;
        break;
      }
    }
    if (areDependenciesMemoized) {
      this.scopes.add(scopeBlock.scope.id);
      for (const id of scopeBlock.scope.merged) {
        this.scopes.add(id);
      }
    }
  }

  override visitInstruction(
    instruction: ReactiveInstruction,
    state: CompilerError
  ): void {
    this.traverseInstruction(instruction, state);
    if (
      instruction.value.kind === "StartMemoize" ||
      instruction.value.kind === "FinishMemoize"
    ) {
      for (const value of eachInstructionValueOperand(instruction.value)) {
        if (
          isMutable(instruction as Instruction, value) ||
          isUnmemoized(value.identifier, this.scopes)
        ) {
          state.push({
            reason:
              "This value was manually memoized, but cannot be memoized under Forget because it may be mutated after it is memoized",
            description: null,
            severity: ErrorSeverity.InvalidReact,
            loc: typeof instruction.loc !== "symbol" ? instruction.loc : null,
            suggestions: null,
          });
        }
      }
    }
  }
}

function isUnmemoized(operand: Identifier, scopes: Set<ScopeId>): boolean {
  return operand.scope != null && !scopes.has(operand.scope.id);
}
