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
class Visitor extends ReactiveFunctionVisitor<IdentifierReactivity> {
  override visitInstruction(
    instr: ReactiveInstruction,
    reactivityMap: IdentifierReactivity
  ) {
    this.traverseInstruction(instr, reactivityMap);
    const lval = instr.lvalue;
    if (lval == null || reactivityMap.get(lval.place.identifier.id) === true) {
      return;
    }
    const { value } = instr;
    let hasReactiveInput = false;
    for (const operand of eachReactiveValueOperand(value)) {
      // We currently treat free variables (from module or global scope) as
      // non-reactive. We may later want type information about specific
      // free variables, or a toggle `treatFreeVarsAsReactive`.
      if (reactivityMap.get(operand.identifier.id)) {
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
    reactivityMap.set(lval.place.identifier.id, hasReactiveInput);

    if (hasReactiveInput) {
      // all mutating effects must also be marked as reactive
      for (const operand of eachReactiveValueOperand(value)) {
        switch (operand.effect) {
          case Effect.Capture:
          case Effect.Store:
          case Effect.Mutate: {
            // Explicitly compare to `false` here, since absence from the
            // map indicates a free variable
            // todo [@mofeiZ] add knowledge about free variables
            if (reactivityMap.get(operand.identifier.id) === false) {
              reactivityMap.set(operand.identifier.id, true);
            }
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
  const reactivityMap: IdentifierReactivity = new Map();
  for (const param of fn.params) {
    reactivityMap.set(param.identifier.id, true);
  }
  visitReactiveFunction(fn, visitor, reactivityMap);

  const result = new Set<IdentifierId>();
  reactivityMap.forEach((isReactive, id) => {
    if (isReactive) result.add(id);
  });
  return result;
}
