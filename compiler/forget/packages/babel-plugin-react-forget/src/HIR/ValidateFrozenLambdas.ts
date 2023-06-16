/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CompilerError,
  CompilerErrorDetail,
  ErrorSeverity,
} from "../CompilerError";
import {
  Effect,
  FunctionExpression,
  HIRFunction,
  IdentifierId,
  Place,
  isMutableEffect,
  isRefValueType,
  isUseRefType,
} from "./HIR";
import { eachInstructionValueOperand, eachTerminalOperand } from "./visitors";

/**
 * Various APIs in React take ownership of the values passed to them, such that it is invalid
 * to subsequently modify those values. Examples include:
 * - Passing a value as a prop to JSX. Subsequently mutating this value will result in undefined
 *   behavior, since the mutation may or may not be observed depending on when the child re-renders.
 *   In addition, the value may be used as an input to memoization in children, and mutation could
 *   invalidate that memoization.
 * - Passing a value to `useState()`, for the same reason.
 * - Passing a value to a hook, for the same reason.
 *
 * Most "normal" data types (objects, arrays, etc) can be "frozen" when passed to a React API simply
 * by not calling any mutating methods on them. However, mutable lambdas are an exception: if a lambda
 * has side-effects, there is no way to do something to the lambda that would allow calling it without
 * triggering those side effects. The only thing a developer could do is not call the lambda, but developers
 * also have no way of knowing that they can't call the lambda.
 *
 * From a type system perspective, the above APIs that "take ownership" of their values really accept
 * *already frozen* values as input. Thus it is invalid to pass a value that cannot be frozen to these APIs,
 * and it is therefore invalid to pass a mutable lambda.
 *
 * This pass validates the above rule. Note that this validation can by bypassed by storing a mutable lambda
 * inside some value (eg as an array element or object property). In these cases we trust that the developer
 * is not breaking the rules. The goal of this validation is to find cases that are provably wrong and help
 * the developer fix the mistake earlier.
 */
export function validateFrozenLambdas(fn: HIRFunction): void {
  const state = new State();

  const errors = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      if (instr.value.kind === "FunctionExpression") {
        state.lambdas.set(instr.lvalue.identifier.id, instr.value);
      } else if (instr.value.kind === "LoadLocal") {
        const resolvedId =
          state.temporaries.get(instr.value.place.identifier.id) ??
          instr.value.place.identifier.id;
        state.temporaries.set(instr.lvalue.identifier.id, resolvedId);
      } else if (instr.value.kind === "StoreLocal") {
        const resolvedId =
          state.temporaries.get(instr.value.value.identifier.id) ??
          instr.value.value.identifier.id;
        state.temporaries.set(
          instr.value.lvalue.place.identifier.id,
          resolvedId
        );
      } else {
        for (const operand of eachInstructionValueOperand(instr.value)) {
          const operandError = validateOperand(operand, state);
          if (operandError !== null) {
            errors.pushErrorDetail(operandError);
          }
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      const operandError = validateOperand(operand, state);
      if (operandError !== null) {
        errors.pushErrorDetail(operandError);
      }
    }
  }
  if (errors.hasErrors()) {
    throw errors;
  }
}

class State {
  lambdas: Map<IdentifierId, FunctionExpression> = new Map();
  temporaries: Map<IdentifierId, IdentifierId> = new Map();
}

function validateOperand(
  operand: Place,
  state: State
): CompilerErrorDetail | null {
  if (operand.effect === Effect.Freeze) {
    const operandId =
      state.temporaries.get(operand.identifier.id) ?? operand.identifier.id;
    const lambda = state.lambdas.get(operandId);
    if (
      lambda !== undefined &&
      lambda.dependencies.some(
        (place) =>
          isMutableEffect(place.effect, place.loc) &&
          !isRefValueType(place.identifier) &&
          !isUseRefType(place.identifier)
      )
    ) {
      return new CompilerErrorDetail({
        codeframe: null,
        description: null,
        loc: typeof operand.loc !== "symbol" ? operand.loc : null,
        reason:
          "Cannot use a mutable function where an immutable value is expected",
        severity: ErrorSeverity.InvalidInput,
      });
    }
  }
  return null;
}
