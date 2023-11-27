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
  isUseEffectHookType,
  isUseInsertionEffectHookType,
  isUseLayoutEffectHookType,
} from "../HIR";
import { isMutable } from "../ReactiveScopes/InferReactiveScopeVariables";
import {
  ReactiveFunctionVisitor,
  visitReactiveFunction,
} from "../ReactiveScopes/visitors";

/**
 * Validates that all known effect dependencies are memoized. The algorithm does not directly check
 * for memoization but instead uses an inverted test: it reports any effects whose dependency arrays
 * are mutable for a range that encompasses the effect call. This corresponds to any values which
 * Forget knows may be mutable and may be mutated after the effect. Note that it's possible Forget
 * may miss not memoize a value for some other reason, but in general this is a bug. The only reason
 * Forget would _choose_ to skip memoization of an effect dependency is because it's mutated later.
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
  override visitInstruction(
    instruction: ReactiveInstruction,
    state: CompilerError
  ): void {
    this.traverseInstruction(instruction, state);
    if (
      instruction.value.kind === "CallExpression" &&
      isEffectHook(instruction.value.callee.identifier) &&
      instruction.value.args.length >= 2
    ) {
      const deps = instruction.value.args[1]!;
      if (
        deps.kind === "Identifier" &&
        isMutable(instruction as Instruction, deps)
      ) {
        state.push({
          reason:
            "This effect may trigger an infinite loop: one or more of its dependencies could not be memoized due to a later mutation",
          description: null,
          severity: ErrorSeverity.InvalidReact,
          loc: typeof instruction.loc !== "symbol" ? instruction.loc : null,
          suggestions: null,
        });
      }
    }
  }
}

function isEffectHook(identifier: Identifier): boolean {
  return (
    isUseEffectHookType(identifier) ||
    isUseLayoutEffectHookType(identifier) ||
    isUseInsertionEffectHookType(identifier)
  );
}
