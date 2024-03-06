/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ReactiveFunctionTransform,
  Transformed,
  visitReactiveFunction,
} from ".";
import {
  IdentifierId,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScopeBlock,
  ReactiveStatement,
} from "../HIR";

/**
 * Some instructions will *always* produce a new value, and unless memoized will *always*
 * invalidate downstream reactive scopes. This pass finds such values and prunes downstream
 * memoization.
 *
 * NOTE: function calls are an edge-case: function calls *may* return primitives, so this
 * pass optimistically assumes they do. Therefore, unmemoized function calls will *not*
 * prune downstream memoization. Only guaranteed new allocations, such as object and array
 * literals, will cause pruning.
 */
export function pruneAlwaysInvalidatingScopes(fn: ReactiveFunction): void {
  visitReactiveFunction(fn, new Transform(), false);
}

class Transform extends ReactiveFunctionTransform<boolean> {
  alwaysInvalidatingValues: Set<IdentifierId> = new Set();
  unmemoizedValues: Set<IdentifierId> = new Set();

  override transformInstruction(
    instruction: ReactiveInstruction,
    withinScope: boolean
  ): Transformed<ReactiveStatement> {
    this.visitInstruction(instruction, withinScope);

    const { lvalue, value } = instruction;
    switch (value.kind) {
      case "ArrayExpression":
      case "ObjectExpression":
      case "JsxExpression":
      case "JsxFragment":
      case "NewExpression": {
        if (lvalue !== null) {
          this.alwaysInvalidatingValues.add(lvalue.identifier.id);
          if (!withinScope) {
            this.unmemoizedValues.add(lvalue.identifier.id);
          }
        }
        break;
      }
      case "StoreLocal": {
        if (this.alwaysInvalidatingValues.has(value.value.identifier.id)) {
          this.alwaysInvalidatingValues.add(value.lvalue.place.identifier.id);
        }
        if (this.unmemoizedValues.has(value.value.identifier.id)) {
          this.unmemoizedValues.add(value.lvalue.place.identifier.id);
        }
        break;
      }
      case "LoadLocal": {
        if (
          lvalue !== null &&
          this.alwaysInvalidatingValues.has(value.place.identifier.id)
        ) {
          this.alwaysInvalidatingValues.add(lvalue.identifier.id);
        }
        if (
          lvalue !== null &&
          this.unmemoizedValues.has(value.place.identifier.id)
        ) {
          this.unmemoizedValues.add(lvalue.identifier.id);
        }
        break;
      }
    }
    return { kind: "keep" };
  }

  override transformScope(
    scopeBlock: ReactiveScopeBlock,
    _withinScope: boolean
  ): Transformed<ReactiveStatement> {
    this.visitScope(scopeBlock, true);

    for (const dep of scopeBlock.scope.dependencies) {
      if (this.unmemoizedValues.has(dep.identifier.id)) {
        /*
         * This scope depends on an always-invalidating value so the scope will always invalidate:
         * prune it to avoid wasted comparisons
         */
        for (const [id, _decl] of scopeBlock.scope.declarations) {
          if (this.alwaysInvalidatingValues.has(id)) {
            this.unmemoizedValues.add(id);
          }
        }
        for (const identifier of scopeBlock.scope.reassignments) {
          if (this.alwaysInvalidatingValues.has(identifier.id)) {
            this.unmemoizedValues.add(identifier.id);
          }
        }
        return { kind: "replace-many", value: scopeBlock.instructions };
      }
    }
    return { kind: "keep" };
  }
}
