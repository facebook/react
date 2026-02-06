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
  isStableHandlerType,
} from '../HIR';
import {ReactiveFunctionVisitor, visitReactiveFunction} from './visitors';

/**
 * Marks reactive scopes that contain a StableHandler-typed local function
 * assignment. These scopes will use a special two-slot codegen pattern:
 * one slot always holds the latest function (updated every render),
 * another slot holds a stable wrapper (created once on first render).
 *
 * This pass detects two patterns:
 * 1. StoreLocal instructions targeting StableHandler-typed variables
 *    (explicit annotation: `const handler: StableHandler<...> = () => ...`)
 * 2. Function expressions used as JSX event handler attributes
 *    (auto-detection: `onClick={() => ...}`, `onSubmit={handler}`, etc.)
 *
 * For each detected function, the pass marks the scope that declares it
 * so codegen uses the stable two-slot pattern.
 */
export function markStableHandlerScopes(fn: ReactiveFunction): void {
  if (!fn.env.config.enableStableHandlerAnnotation) {
    return;
  }
  // First pass: collect identifier IDs of function expression values that are
  // stored into StableHandler-typed local variables.
  const stableHandlerSourceIds = new Set<IdentifierId>();
  visitReactiveFunction(fn, new CollectVisitor(), stableHandlerSourceIds);
  if (stableHandlerSourceIds.size === 0) {
    return;
  }
  // Second pass: mark scopes whose declarations include a StableHandler source.
  visitReactiveFunction(fn, new MarkVisitor(), stableHandlerSourceIds);
}

class CollectVisitor extends ReactiveFunctionVisitor<Set<IdentifierId>> {
  override visitInstruction(
    instruction: ReactiveInstruction,
    state: Set<IdentifierId>,
  ): void {
    this.traverseInstruction(instruction, state);
    const {value} = instruction;
    if (
      value.kind === 'StoreLocal' &&
      isStableHandlerType(value.lvalue.place.identifier)
    ) {
      // Track the source value's identifier id — this is the function
      // expression produced by a scope that we need to mark.
      state.add(value.value.identifier.id);
    }
    // Detect function expressions used as JSX event handler attributes.
    // Inline functions passed to event handler props (onClick, onSubmit, etc.)
    // are automatically compiled with the stable two-slot pattern.
    if (value.kind === 'JsxExpression') {
      for (const prop of value.props) {
        if (
          prop.kind === 'JsxAttribute' &&
          /^on[A-Z]/.test(prop.name)
        ) {
          state.add(prop.place.identifier.id);
        }
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
        scopeBlock.scope.stableHandler = true;
        return;
      }
    }
  }
}
