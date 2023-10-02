/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  InstructionId,
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

export function flattenScopesWithObjectMethods(fn: ReactiveFunction): void {
  visitReactiveFunction(fn, new Transform(), {
    hasObjectMethod: false,
  });
}

type State = {
  hasObjectMethod: boolean;
};

class Transform extends ReactiveFunctionTransform<State> {
  override transformScope(
    scope: ReactiveScopeBlock,
    outerState: State
  ): Transformed<ReactiveStatement> {
    const innerState: State = {
      hasObjectMethod: false,
    };
    this.visitScope(scope, innerState);
    outerState.hasObjectMethod ||= innerState.hasObjectMethod;
    if (innerState.hasObjectMethod) {
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
    this.traverseValue(id, value, state);
    if (value.kind === "ObjectMethod") {
      state.hasObjectMethod = true;
    }
  }
}
