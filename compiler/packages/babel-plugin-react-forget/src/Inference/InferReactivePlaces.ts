/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "..";
import {
  Effect,
  HIRFunction,
  Identifier,
  IdentifierId,
  Place,
  getHookKind,
} from "../HIR";
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "../HIR/visitors";
import { hasBackEdge } from "../Optimization/DeadCodeElimination";
import { assertExhaustive } from "../Utils/utils";

/**
 * Infers which `Place`s are reactive, ie may *semantically* change
 * over the course of the component/hook's lifetime. Places are reactive
 * if they derive from source source of reactivity, which includes the
 * following categories.
 *
 * ## Props
 *
 * Props may change so they're reactive:
 *
 * ## Hooks
 *
 * Hooks may access state or context, which can change so they're reactive.
 *
 * ## Mutation with reactive operands
 *
 * Any value that is mutated in an instruction that also has reactive operands
 * could cause the modified value to capture a reference to the reactive value,
 * making the mutated value reactive.
 *
 * Ex:
 * ```
 * function Component(props) {
 *   const x = {}; // not yet reactive
 *   x.y = props.y;
 * }
 * ```
 *
 * Here `x` is modified in an instruction that has a reactive operand (`props.y`)
 * so x becomes reactive.
 *
 * ## Conditional assignment based on a reactive condition
 *
 * Conditionally reassigning a variable based on a condition which is reactive means
 * that the value being assigned could change, hence that variable also becomes
 * reactive.
 *
 * ```
 * function Component(props) {
 *   let x;
 *   if (props.cond) {
 *     x = 1;
 *   } else {
 *     x = 2;
 *   }
 *   return x;
 * }
 * ```
 *
 * Here `x` is never assigned a reactive value (it is assigned the constant 1 or 2) but
 * the condition, `props.cond`, is reactive, and therefore `x` could change reactively too.
 *
 *
 * # Algorithm
 *
 * The algorithm uses a fixpoint iteration in order to propagate reactivity "forward" through
 * the control-flow graph. We track whether each IdentifierId is reactive and terminate when
 * there are no changes after a given pass over the CFG.
 */
export function inferReactivePlaces(fn: HIRFunction): void {
  const reactiveIdentifiers = new ReactivityMap();
  for (const param of fn.params) {
    const place = param.kind === "Identifier" ? param : param.place;
    reactiveIdentifiers.markReactive(place);
  }

  const hasLoop = hasBackEdge(fn);
  do {
    for (const [, block] of fn.body.blocks) {
      for (const phi of block.phis) {
        for (const [, operand] of phi.operands) {
          if (reactiveIdentifiers.isReactiveIdentifier(operand)) {
            reactiveIdentifiers.markReactiveIdentifier(phi.id);
            break;
          }
        }
      }
      for (const instruction of block.instructions) {
        const { value } = instruction;
        let hasReactiveInput = false;
        // NOTE: we want to mark all operands as reactive or not, so we
        // avoid short-circuting here
        for (const operand of eachInstructionValueOperand(value)) {
          const reactive = reactiveIdentifiers.isReactive(operand);
          hasReactiveInput ||= reactive;
        }

        // Hooks may always return a reactive variable, even if their inputs are
        // non-reactive, because they can access state or context.
        if (
          value.kind === "CallExpression" &&
          getHookKind(fn.env, value.callee.identifier) != null
        ) {
          hasReactiveInput = true;
        } else if (
          value.kind === "MethodCall" &&
          getHookKind(fn.env, value.property.identifier) != null
        ) {
          hasReactiveInput = true;
        }

        if (hasReactiveInput) {
          for (const lvalue of eachInstructionLValue(instruction)) {
            reactiveIdentifiers.markReactive(lvalue);
          }

          for (const operand of eachInstructionValueOperand(value)) {
            switch (operand.effect) {
              case Effect.Capture:
              case Effect.Store:
              case Effect.ConditionallyMutate:
              case Effect.Mutate: {
                reactiveIdentifiers.markReactive(operand);
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
      }
      for (const operand of eachTerminalOperand(block.terminal)) {
        reactiveIdentifiers.isReactive(operand);
      }
    }
  } while (reactiveIdentifiers.snapshot() && hasLoop);
}

class ReactivityMap {
  hasChanges: boolean = false;
  reactive: Set<IdentifierId> = new Set();

  isReactive(place: Place): boolean {
    const reactive = this.reactive.has(place.identifier.id);
    if (reactive) {
      place.reactive = true;
    }
    return reactive;
  }

  isReactiveIdentifier(identifier: Identifier): boolean {
    return this.reactive.has(identifier.id);
  }

  markReactive(place: Place): void {
    place.reactive = true;
    this.markReactiveIdentifier(place.identifier);
  }

  markReactiveIdentifier(identifier: Identifier): void {
    if (!this.reactive.has(identifier.id)) {
      this.hasChanges = true;
      this.reactive.add(identifier.id);
    }
  }

  snapshot(): boolean {
    const hasChanges = this.hasChanges;
    this.hasChanges = false;
    return hasChanges;
  }
}
