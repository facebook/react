/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity} from '..';
import {
  Identifier,
  Instruction,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScopeBlock,
  ScopeId,
  isUseEffectHookType,
  isUseInsertionEffectHookType,
  isUseLayoutEffectHookType,
} from '../HIR';
import {isMutable} from '../ReactiveScopes/InferReactiveScopeVariables';
import {
  ReactiveFunctionVisitor,
  visitReactiveFunction,
} from '../ReactiveScopes/visitors';

/**
 * Validates that all known effect dependencies are memoized. The algorithm checks two things:
 * - Disallow effect dependencies that should be memoized (have a reactive scope assigned) but
 *   where that reactive scope does not exist. This checks for cases where a reactive scope was
 *   pruned for some reason, such as spanning a hook.
 * - Disallow effect dependencies whose a mutable range that encompasses the effect call.
 *
 * This latter check corresponds to any values which Forget knows may be mutable and may be mutated
 * after the effect. Note that it's possible Forget may miss not memoize a value for some other reason,
 * but in general this is a bug. The only reason Forget would _choose_ to skip memoization of an
 * effect dependency is because it's mutated later.
 *
 * Example:
 *
 * ```javascript
 * const object = {}; // mutable range starts here...
 *
 * useEffect(() => {
 *   console.log('hello');
 * }, [object]); // the dependency array picks up the mutable range of its mutable contents
 *
 * mutate(object); // ... mutable range ends here after this mutation
 * ```
 */
export function validateMemoizedEffectDependencies(fn: ReactiveFunction): void {
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
    state: CompilerError,
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
    state: CompilerError,
  ): void {
    this.traverseInstruction(instruction, state);
    if (
      instruction.value.kind === 'CallExpression' &&
      isEffectHook(instruction.value.callee.identifier) &&
      instruction.value.args.length >= 2
    ) {
      const deps = instruction.value.args[1]!;
      if (
        deps.kind === 'Identifier' &&
        /*
         * TODO: isMutable is not safe to call here as it relies on identifier mutableRange which is no longer valid at this point
         * in the pipeline
         */
        (isMutable(instruction as Instruction, deps) ||
          isUnmemoized(deps.identifier, this.scopes))
      ) {
        state.push({
          reason:
            'React Compiler has skipped optimizing this component because the effect dependencies could not be memoized. Unmemoized effect dependencies can trigger an infinite loop or other unexpected behavior',
          description: null,
          severity: ErrorSeverity.CannotPreserveMemoization,
          loc: typeof instruction.loc !== 'symbol' ? instruction.loc : null,
          suggestions: null,
        });
      }
    }
  }
}

function isUnmemoized(operand: Identifier, scopes: Set<ScopeId>): boolean {
  return operand.scope != null && !scopes.has(operand.scope.id);
}

export function isEffectHook(identifier: Identifier): boolean {
  return (
    isUseEffectHookType(identifier) ||
    isUseLayoutEffectHookType(identifier) ||
    isUseInsertionEffectHookType(identifier)
  );
}
