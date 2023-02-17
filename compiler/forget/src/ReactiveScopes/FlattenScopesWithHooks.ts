/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  InstructionId,
  isHookType,
  ReactiveFunction,
  ReactiveScopeBlock,
  ReactiveStatement,
  ReactiveValue,
} from "../HIR";
import {
  ReactiveFunctionTransform,
  Transformed,
  visitReactiveFunction,
} from "./visitors";

/**
 * Most parts of compilation do not treat hooks specially, because there is no guarantee that custom
 * hooks obey any particular contract. For example, we can't assume that custom hooks won't modify
 * their arguments, and we can't assume that hooks return immutable or memoized values. Therefore
 * earlier passes largely ignore hooks, and may end up creating reactive scopes that contain hook calls.
 *
 * This pass then finds and removes any scopes that transitively contain a hook call. By running all
 * the reactive scope inference first, agnostic of hooks, we know that the reactive scopes accurately
 * describe the set of values which "construct together", and remove _all_ that memoization in order
 * to ensure the hook call does not inadvertently become conditional.
 */
export function flattenScopesWithHooks(fn: ReactiveFunction): void {
  visitReactiveFunction(fn, new Transform(), { hasHook: false });
}

type State = { hasHook: boolean };

class Transform extends ReactiveFunctionTransform<State> {
  override transformScope(
    scope: ReactiveScopeBlock,
    outerState: State
  ): Transformed<ReactiveStatement> {
    const innerState: State = { hasHook: false };
    this.visitScope(scope, innerState);
    outerState.hasHook ||= innerState.hasHook;
    if (innerState.hasHook) {
      return { kind: "replace-many", value: scope.instructions };
    } else {
      return { kind: "keep" };
    }
  }

  override visitValue(
    id: InstructionId,
    value: ReactiveValue,
    state: State
  ): void {
    if (
      value.kind === "CallExpression" &&
      isHookType(value.callee.identifier)
    ) {
      state.hasHook = true;
    }
  }
}
