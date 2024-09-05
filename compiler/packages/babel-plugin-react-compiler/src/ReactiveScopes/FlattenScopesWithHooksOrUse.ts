/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Environment,
  InstructionId,
  ReactiveFunction,
  ReactiveScopeBlock,
  ReactiveStatement,
  ReactiveValue,
  getHookKind,
  isUseOperator,
} from '../HIR';
import {
  ReactiveFunctionTransform,
  Transformed,
  visitReactiveFunction,
} from './visitors';

/**
 * For simplicity the majority of compiler passes do not treat hooks specially. However, hooks are different
 * from regular functions in two key ways:
 * - They can introduce reactivity even when their arguments are non-reactive (accounted for in InferReactivePlaces)
 * - They cannot be called conditionally
 *
 * The `use` operator is similar:
 * - It can access context, and therefore introduce reactivity
 * - It can be called conditionally, but _it must be called if the component needs the return value_. This is because
 *   React uses the fact that use was called to remember that the component needs the value, and that changes to the
 *   input should invalidate the component itself.
 *
 * This pass accounts for the "can't call conditionally" aspect of both hooks and use. Though the reasoning is slightly
 * different for reach, the result is that we can't memoize scopes that call hooks or use since this would make them
 * called conditionally in the output.
 *
 * The pass finds and removes any scopes that transitively contain a hook or use call. By running all
 * the reactive scope inference first, agnostic of hooks, we know that the reactive scopes accurately
 * describe the set of values which "construct together", and remove _all_ that memoization in order
 * to ensure the hook call does not inadvertently become conditional.
 */
export function flattenScopesWithHooksOrUse(fn: ReactiveFunction): void {
  visitReactiveFunction(fn, new Transform(), {
    env: fn.env,
    hasHook: false,
  });
}

type State = {
  env: Environment;
  hasHook: boolean;
};

class Transform extends ReactiveFunctionTransform<State> {
  override transformScope(
    scope: ReactiveScopeBlock,
    outerState: State,
  ): Transformed<ReactiveStatement> {
    const innerState: State = {
      env: outerState.env,
      hasHook: false,
    };
    this.visitScope(scope, innerState);
    outerState.hasHook ||= innerState.hasHook;
    if (innerState.hasHook) {
      if (scope.instructions.length === 1) {
        /*
         * This was a scope just for a hook call, which doesn't need memoization.
         * flatten it away
         */
        return {
          kind: 'replace-many',
          value: scope.instructions,
        };
      }
      /*
       * else this scope had multiple instructions and produced some other value:
       * mark it as pruned
       */
      return {
        kind: 'replace',
        value: {
          kind: 'pruned-scope',
          scope: scope.scope,
          instructions: scope.instructions,
        },
      };
    } else {
      return {kind: 'keep'};
    }
  }

  override visitValue(
    id: InstructionId,
    value: ReactiveValue,
    state: State,
  ): void {
    this.traverseValue(id, value, state);
    switch (value.kind) {
      case 'CallExpression': {
        if (
          getHookKind(state.env, value.callee.identifier) != null ||
          isUseOperator(value.callee.identifier)
        ) {
          state.hasHook = true;
        }
        break;
      }
      case 'MethodCall': {
        if (
          getHookKind(state.env, value.property.identifier) != null ||
          isUseOperator(value.property.identifier)
        ) {
          state.hasHook = true;
        }
        break;
      }
    }
  }
}
