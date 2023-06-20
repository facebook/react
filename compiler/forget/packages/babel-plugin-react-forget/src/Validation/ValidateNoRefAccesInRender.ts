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
import { HIRFunction, Place, isRefValueType, isUseRefType } from "../HIR/HIR";
import { printPlace } from "../HIR/PrintHIR";
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from "../HIR/visitors";

/**
 * Validates that ref values (the `current` property) are not accessed during render.
 * This validation is conservative and only rejects accesses of known ref values:
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
  const error = new CompilerError();

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case "PropertyLoad":
        case "LoadLocal":
        case "StoreLocal":
        case "Destructure": {
          // These instructions are necessary for storing the results of a useRef into
          // a variable and referencing them in functions. We can propagate type info
          // for these instructions so they ensure we have a complete analysis.
          break;
        }
        case "JsxExpression": {
          // It's okay to pass refs to JSX, but not ref *values*
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNonRefValue(error, operand);
          }
          break;
        }
        case "FunctionExpression": {
          // functions are allowed to capture refs, so long as the function is not called
          // during render. see AnalyzeFunctions for how we ensure that functions which
          // capture refs get assigned a mutable range so we know here whether the function
          // is called or not
          const mutableRange = instr.lvalue.identifier.mutableRange;
          if (mutableRange.end > mutableRange.start + 1) {
            for (const operand of eachInstructionValueOperand(instr.value)) {
              validateNonRefValue(error, operand);
              validateNonRefObject(error, operand);
            }
          }
          break;
        }
        case "CallExpression":
        case "NewExpression": {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNonRefValue(error, operand);
            validateNonRefObject(error, operand);
          }
          break;
        }
        default: {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNonRefValue(error, operand);
            validateNonRefObject(error, operand);
          }
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      validateNonRefValue(error, operand);
    }
  }

  if (error.hasErrors()) {
    throw error;
  }
}

// Check that the operand's type is not that of useRef().current (the ref's current value)
function validateNonRefValue(error: CompilerError, operand: Place): void {
  if (isRefValueType(operand.identifier)) {
    error.pushErrorDetail(
      new CompilerErrorDetail({
        codeframe: null,
        description: `Cannot access ref value at ${printPlace(operand)}`,
        loc: typeof operand.loc !== "symbol" ? operand.loc : null,
        reason:
          "Ref values (the `current` property) may not be accessed during render",
        severity: ErrorSeverity.InvalidInput,
      })
    );
  }
}

// Check that the operand's type is not that of useRef() return value (the ref container)
function validateNonRefObject(error: CompilerError, operand: Place): void {
  if (isUseRefType(operand.identifier)) {
    error.pushErrorDetail(
      new CompilerErrorDetail({
        codeframe: null,
        description: `Cannot access ref object at ${printPlace(operand)}`,
        loc: typeof operand.loc !== "symbol" ? operand.loc : null,
        reason:
          "Ref values may not be passed to functions because they could read the ref value (`current` property) during render",
        severity: ErrorSeverity.InvalidInput,
      })
    );
  }
}
