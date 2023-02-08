/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ReactiveFunction,
  ReactiveScopeBlock,
  ReactiveStatement,
} from "../HIR/HIR";
import {
  ReactiveFunctionTransform,
  Transformed,
  visitReactiveFunction,
} from "./visitors";

/**
 * Converts scopes without outputs into regular blocks.
 */
export function pruneUnusedScopes(fn: ReactiveFunction): void {
  visitReactiveFunction(fn, new Transform(), undefined);
}

class Transform extends ReactiveFunctionTransform<void> {
  override transformScope(
    scopeBlock: ReactiveScopeBlock,
    state: void
  ): Transformed<ReactiveStatement> {
    this.visitScope(scopeBlock, state);
    if (
      scopeBlock.scope.declarations.size === 0 &&
      (scopeBlock.scope.dependencies.size === 0 ||
        scopeBlock.scope.reassignments.size === 0)
    ) {
      return { kind: "replace-many", value: scopeBlock.instructions };
    } else {
      return { kind: "keep" };
    }
  }
}
