/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "../CompilerError";
import { Environment } from "../HIR";
import {
  Effect,
  IdentifierId,
  ReactiveFunction,
  ReactiveInstruction,
  getHookKind,
} from "../HIR/HIR";
import { eachInstructionLValue } from "../HIR/visitors";
import { assertExhaustive } from "../Utils/utils";
import {
  ReactiveFunctionVisitor,
  eachReactiveValueOperand,
  visitReactiveFunction,
} from "./visitors";

type IdentifierReactivity = Map<IdentifierId, boolean>;

class State {
  env: Environment;
  reactivityMap: IdentifierReactivity = new Map();
  temporaries: Map<IdentifierId, IdentifierId> = new Map();

  constructor(env: Environment) {
    this.env = env;
  }
}

class Visitor extends ReactiveFunctionVisitor<State> {
  override visitInstruction(instr: ReactiveInstruction, state: State): void {
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
      const ownId = operand.identifier.id;
      const resolvedId = state.temporaries.get(ownId);
      // We need to check reactivity of both the operand and its resolved source (if operand is
      // produced by a LoadLocal / PropertyLoad / ComputedLoad). Both the operand and its source
      // can have reactivity. e.g.
      // ```js
      //   const o = makeObject(); // source has no reactivity
      //   const x = o[props.x];   // x is reactive
      // ```
      if (
        state.reactivityMap.get(ownId) ||
        (resolvedId && state.reactivityMap.get(resolvedId))
      ) {
        hasReactiveInput = true;
        break;
      }
    }
    if (
      !hasReactiveInput &&
      instr.value.kind === "CallExpression" &&
      getHookKind(state.env, instr.value.callee.identifier) != null
    ) {
      // Hooks cannot be memoized. Even if they do not accept any reactive inputs,
      // they are not guaranteed to memoize their return value, and their result
      // must be assumed to be reactive.
      // TODO: use types or an opt-in registry of custom hook information to
      // allow treating safe hooks as non-reactive.
      hasReactiveInput = true;
    }
    state.reactivityMap.set(lval.identifier.id, hasReactiveInput);

    if (hasReactiveInput) {
      for (const lvalue of eachInstructionLValue(instr)) {
        state.reactivityMap.set(lvalue.identifier.id, true);
      }
      // all mutating effects must also be marked as reactive
      for (const operand of eachReactiveValueOperand(value)) {
        switch (operand.effect) {
          case Effect.Capture:
          case Effect.Store:
          case Effect.ConditionallyMutate:
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
            CompilerError.invariant(false, {
              reason: "Unexpected unknown effect",
              description: null,
              loc: operand.loc,
              suggestions: null,
            });
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
          instr.lvalue.identifier.id,
          instr.value.place.identifier.id
        );
      } else if (
        instr.value.kind === "PropertyLoad" ||
        instr.value.kind === "ComputedLoad"
      ) {
        const resolvedId =
          state.temporaries.get(instr.value.object.identifier.id) ??
          instr.value.object.identifier.id;
        state.temporaries.set(instr.lvalue.identifier.id, resolvedId);
      } else if (instr.value.kind === "LoadContext") {
        state.temporaries.set(
          instr.lvalue.identifier.id,
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
  const state = new State(fn.env);
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
