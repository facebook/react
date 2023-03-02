/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "../CompilerError";
import {
  Effect,
  IdentifierId,
  isHookType,
  ReactiveFunction,
  ReactiveInstruction,
} from "../HIR/HIR";
import { assertExhaustive } from "../Utils/utils";
import {
  eachReactiveValueOperand,
  ReactiveFunctionVisitor,
  visitReactiveFunction,
} from "./visitors";

type IdentifierReactivity = Map<IdentifierId, boolean>;

class State {
  reactivityMap: IdentifierReactivity = new Map();
  temporaries: Map<IdentifierId, IdentifierId> = new Map();
}

class Visitor extends ReactiveFunctionVisitor<State> {
  override visitInstruction(instr: ReactiveInstruction, state: State) {
    this.traverseInstruction(instr, state);
    const lval = instr.lvalue;
    if (lval == null) {
      return;
    }
    const { value } = instr;
    let hasReactiveInput = false;
    // Globals are currently treated as non-reactive this happens implicitly because LoadGlobal
    // has no operands which can be registered as reactive.
    // Consider adding an option to declare whether a given global can be reactive or not, or
    // a more general "treat all globals as reactive" flag.
    for (const operand of eachReactiveValueOperand(value)) {
      if (operand.effect === Effect.Store) {
        continue;
      }
      const resolvedId: IdentifierId =
        state.temporaries.get(operand.identifier.id) ?? operand.identifier.id;
      if (state.reactivityMap.get(resolvedId)) {
        hasReactiveInput = true;
        break;
      }
    }
    if (
      !hasReactiveInput &&
      instr.value.kind === "CallExpression" &&
      isHookType(instr.value.callee.identifier)
    ) {
      // Hooks cannot be memoized. Even if they do not accept any reactive inputs,
      // they are not guaranteed to memoize their return value, and their result
      // must be assumed to be reactive.
      // TODO: use types or an opt-in registry of custom hook information to
      // allow treating safe hooks as non-reactive.
      hasReactiveInput = true;
    }
    state.reactivityMap.set(lval.place.identifier.id, hasReactiveInput);

    if (hasReactiveInput) {
      // all mutating effects must also be marked as reactive
      for (const operand of eachReactiveValueOperand(value)) {
        switch (operand.effect) {
          case Effect.Capture:
          case Effect.Store:
          case Effect.Mutate: {
            const resolvedId: IdentifierId =
              state.temporaries.get(operand.identifier.id) ??
              operand.identifier.id;
            state.reactivityMap.set(resolvedId, true);
            break;
          }
          case Effect.Freeze:
          case Effect.Read: {
            // no-op
            break;
          }
          case Effect.Unknown: {
            CompilerError.invariant("Unexpected unknown effect", operand.loc);
          }
          default: {
            assertExhaustive(
              operand.effect,
              `Unexpected effect kind '${operand.effect}'`
            );
          }
        }
      }
    }
    if (instr.lvalue !== null) {
      if (instr.value.kind === "LoadLocal") {
        state.temporaries.set(
          instr.lvalue.place.identifier.id,
          instr.value.place.identifier.id
        );
      }
    }
  }
}
/**
 * Computes a map of {@link Place} -> reactivityMap. A Place is reactive if any
 * operant used in its construction is reactive. Sources of reactivity are
 * {@link ReactiveFunction.params} and HookCall return values (TODO).
 * Free values are currently not populated.
 *
 * This relies on alias analysis done by InferReactiveScopeVariables, which
 * creates reactive scopes for variables that mutate together. If one value
 * declared in a scope is Reactive, then the rest are marked as reactive as
 * well.
 * e.g.
 * ```javascript
 * function foo(props) {
 *   let x = {};
 *   let y = [];
 *   x.y = y;
 *   y.push(props.a)
 *   // references to x are reactive here
 * }
 * ```
 * This an overestimate when two identifiers have overlapping scope, but
 * one is not actually reactive. However, since the same ReactiveBlock now
 * produces both identifiers, they are effectively both reactive (i.e.
 * object creation is not stable)
 * e.g.
 * ```javascript
 * function bar(props) {
 *   // x and y have overlapping mutableRanges, so they share a ReactiveScope
 *   // (even though they are not aliased together)
 *   // technically y has no reactive inputs, but it becomes non-stable due to
 *   // sharing a ReactiveScopeBlock with x
 *   let x = {};
 *   let y = [];
 *   mutate1(x, props);
 *   mutate2(y);
 * }
 * ```
 */
export function inferReactiveIdentifiers(
  fn: ReactiveFunction
): Set<IdentifierId> {
  const visitor = new Visitor();
  const state = new State();
  for (const param of fn.params) {
    state.reactivityMap.set(param.identifier.id, true);
  }
  visitReactiveFunction(fn, visitor, state);

  const result = new Set<IdentifierId>();
  state.reactivityMap.forEach((isReactive, id) => {
    if (isReactive) result.add(id);
  });
  return result;
}
