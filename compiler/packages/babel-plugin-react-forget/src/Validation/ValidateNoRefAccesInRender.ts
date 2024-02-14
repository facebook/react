/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError, ErrorSeverity } from "../CompilerError";
import {
  HIRFunction,
  IdentifierId,
  Place,
  isRefValueType,
  isUseRefType,
} from "../HIR";
import { printPlace } from "../HIR/PrintHIR";
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "../HIR/visitors";
import { Err, Ok, Result } from "../Utils/Result";

/**
 * Validates that a function does not access a ref value during render. This includes a partial check
 * for ref values which are accessed indirectly via function expressions.
 *
 * ```javascript
 * // ERROR
 * const ref = useRef();
 * ref.current;
 *
 * const ref = useRef();
 * foo(ref); // may access .current
 *
 * // ALLOWED
 * const ref = useHookThatReturnsRef();
 * ref.current;
 * ```
 *
 * In the future we may reject more cases, based on either object names (`fooRef.current` is likely a ref)
 * or based on property name alone (`foo.current` might be a ref).
 */
export function validateNoRefAccessInRender(fn: HIRFunction): void {
  const refAccessingFunctions: Set<IdentifierId> = new Set();
  validateNoRefAccessInRenderImpl(fn, refAccessingFunctions).unwrap();
}

function validateNoRefAccessInRenderImpl(
  fn: HIRFunction,
  refAccessingFunctions: Set<IdentifierId>
): Result<void, CompilerError> {
  const errors = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case "JsxExpression":
        case "JsxFragment": {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            if (isRefValueType(operand.identifier)) {
              errors.push({
                severity: ErrorSeverity.InvalidReact,
                reason:
                  "Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)",
                loc: operand.loc,
                description: `Cannot access ref value at ${printPlace(
                  operand
                )}`,
                suggestions: null,
              });
            }
          }
          break;
        }
        case "PropertyLoad": {
          break;
        }
        case "LoadLocal": {
          if (refAccessingFunctions.has(instr.value.place.identifier.id)) {
            refAccessingFunctions.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case "StoreLocal": {
          if (refAccessingFunctions.has(instr.value.value.identifier.id)) {
            refAccessingFunctions.add(instr.value.lvalue.place.identifier.id);
            refAccessingFunctions.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case "ObjectMethod":
        case "FunctionExpression": {
          if (
            /*
             * check if the function expression accesses a ref *or* some other
             * function which accesses a ref
             */
            [...eachInstructionValueOperand(instr.value)].some(
              (operand) =>
                isRefValueType(operand.identifier) ||
                refAccessingFunctions.has(operand.identifier.id)
            ) ||
            // check for cases where .current is accessed through an aliased ref
            ([...eachInstructionValueOperand(instr.value)].some((operand) =>
              isUseRefType(operand.identifier)
            ) &&
              validateNoRefAccessInRenderImpl(
                instr.value.loweredFunc.func,
                refAccessingFunctions
              ).isErr())
          ) {
            // This function expression unconditionally accesses a ref
            refAccessingFunctions.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case "CallExpression": {
          const callee = instr.value.callee;
          // Report a more precise error when calling a local function that accesses a ref
          if (refAccessingFunctions.has(callee.identifier.id)) {
            errors.push({
              severity: ErrorSeverity.InvalidReact,
              reason:
                "This function accesses a ref, which not be accessed during render. (https://react.dev/reference/react/useRef)",
              loc: callee.loc,
              description: `Function ${printPlace(callee)} accesses a ref`,
              suggestions: null,
            });
          }
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNoRefAccess(errors, refAccessingFunctions, operand);
          }
          break;
        }
        case "ObjectExpression":
        case "ArrayExpression":
        case "MethodCall": {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNoRefAccess(errors, refAccessingFunctions, operand);
          }
          break;
        }
        default: {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNoRefValueAccess(errors, refAccessingFunctions, operand);
          }
          break;
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      validateNoRefValueAccess(errors, refAccessingFunctions, operand);
    }
  }

  if (errors.hasErrors()) {
    return Err(errors);
  } else {
    return Ok(undefined);
  }
}

function validateNoRefValueAccess(
  errors: CompilerError,
  unconditionalSetStateFunctions: Set<IdentifierId>,
  operand: Place
): void {
  if (
    isRefValueType(operand.identifier) ||
    unconditionalSetStateFunctions.has(operand.identifier.id)
  ) {
    errors.push({
      severity: ErrorSeverity.InvalidReact,
      reason:
        "Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)",
      loc: operand.loc,
      description: `Cannot access ref value at ${printPlace(operand)}`,
      suggestions: null,
    });
  }
}

function validateNoRefAccess(
  errors: CompilerError,
  unconditionalSetStateFunctions: Set<IdentifierId>,
  operand: Place
): void {
  if (
    isRefValueType(operand.identifier) ||
    isUseRefType(operand.identifier) ||
    unconditionalSetStateFunctions.has(operand.identifier.id)
  ) {
    errors.push({
      severity: ErrorSeverity.InvalidReact,
      reason:
        "Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)",
      loc: operand.loc,
      description: `Cannot access ref value at ${printPlace(operand)}`,
      suggestions: null,
    });
  }
}
