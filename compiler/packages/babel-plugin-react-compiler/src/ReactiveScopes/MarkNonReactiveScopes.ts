/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  IdentifierId,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScopeBlock,
  isNonReactiveType,
} from '../HIR';
import {ReactiveFunctionVisitor, visitReactiveFunction} from './visitors';

/**
 * Marks reactive scopes that contain a NonReactive-typed local function
 * assignment. These scopes will use a special two-slot codegen pattern:
 * one slot always holds the latest function (updated every render),
 * another slot holds a stable wrapper (created once on first render).
 *
 * This pass detects StoreLocal instructions targeting NonReactive-typed
 * variables (explicit annotation: `const handler: NonReactive<...> = () => ...`
 * or `nonReactive(() => ...)` wrapper).
 *
 * For each detected function, the pass marks the scope that declares it
 * so codegen uses the stable two-slot pattern.
 */
export function markNonReactiveScopes(fn: ReactiveFunction): void {
  if (!fn.env.config.enableNonReactiveAnnotation) {
    return;
  }
  // First pass: collect identifier IDs of function expression values that are
  // stored into NonReactive-typed local variables.
  const collectState: CollectState = {
    nonReactiveSourceIds: new Set<IdentifierId>(),
    callArgMap: new Map<IdentifierId, IdentifierId>(),
  };
  visitReactiveFunction(fn, new CollectVisitor(), collectState);
  if (collectState.nonReactiveSourceIds.size === 0) {
    return;
  }
  // Second pass: mark scopes whose declarations include a NonReactive source.
  visitReactiveFunction(
    fn,
    new MarkVisitor(),
    collectState.nonReactiveSourceIds,
  );
}

/**
 * Maps NonReactive-typed CallExpression results to their first argument.
 * For `nonReactive(() => ...)`, the Call result is NonReactive-typed,
 * and the first argument is the actual function expression.
 */
type CollectState = {
  nonReactiveSourceIds: Set<IdentifierId>;
  callArgMap: Map<IdentifierId, IdentifierId>;
};

class CollectVisitor extends ReactiveFunctionVisitor<CollectState> {
  override visitInstruction(
    instruction: ReactiveInstruction,
    state: CollectState,
  ): void {
    this.traverseInstruction(instruction, state);
    const {value} = instruction;
    // Track NonReactive-typed CallExpression results and their arguments.
    // For nonReactive(() => ...), the call result is NonReactive-typed
    // and the first argument is the function expression we want to wrap.
    if (
      value.kind === 'CallExpression' &&
      instruction.lvalue !== null &&
      isNonReactiveType(instruction.lvalue.identifier) &&
      value.args.length > 0 &&
      value.args[0].kind === 'Identifier'
    ) {
      state.callArgMap.set(
        instruction.lvalue.identifier.id,
        value.args[0].identifier.id,
      );
    }
    if (
      value.kind === 'StoreLocal' &&
      isNonReactiveType(value.lvalue.place.identifier)
    ) {
      const valueId = value.value.identifier.id;
      // If the source value is a nonReactive() call result, trace through
      // to the actual function expression argument.
      const argId = state.callArgMap.get(valueId);
      if (argId !== undefined) {
        state.nonReactiveSourceIds.add(argId);
      } else {
        state.nonReactiveSourceIds.add(valueId);
      }
    }
  }
}

class MarkVisitor extends ReactiveFunctionVisitor<Set<IdentifierId>> {
  override visitScope(
    scopeBlock: ReactiveScopeBlock,
    state: Set<IdentifierId>,
  ): void {
    this.traverseScope(scopeBlock, state);
    for (const [id] of scopeBlock.scope.declarations) {
      if (state.has(id)) {
        scopeBlock.scope.nonReactive = true;
        return;
      }
    }
  }
}
