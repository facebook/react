/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Identifier, ReactiveFunction, ReactiveScopeBlock } from "../HIR";
import { inferReactiveIdentifiers } from "./InferReactiveIdentifiers";
import { ReactiveFunctionVisitor, visitReactiveFunction } from "./visitors";

/**
 * PropagateScopeDependencies infers dependencies without considering whether dependencies
 * are actually reactive or not (ie, whether their value can change over time).
 *
 * This pass prunes dependencies that are guaranteed to be non-reactive.
 */
export function pruneNonReactiveDependencies(fn: ReactiveFunction): void {
  const state = inferReactiveIdentifiers(fn);
  visitReactiveFunction(fn, new Visitor(), state);
}

type State = Set<Identifier>;

class Visitor extends ReactiveFunctionVisitor<State> {
  override visitScope(scope: ReactiveScopeBlock, state: State): void {
    this.traverseScope(scope, state);
    for (const dep of scope.scope.dependencies) {
      const isReactive = state.has(dep.place.identifier);
      if (!isReactive) {
        scope.scope.dependencies.delete(dep);
      }
    }
    // If a scope now has no dependencies, then its declarations are all non-reactive
    if (scope.scope.dependencies.size === 0) {
      for (const [, declaration] of scope.scope.declarations) {
        state.delete(declaration);
      }
    }
  }
}
