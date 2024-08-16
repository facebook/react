/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity} from '../CompilerError';
import {
  HIRFunction,
  IdentifierId,
  Place,
  SourceLocation,
  isRefOrRefValue,
  isRefValueType,
  isUseRefType,
} from '../HIR';
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {Err, Ok, Result} from '../Utils/Result';
import {isEffectHook} from './ValidateMemoizedEffectDependencies';

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
  refAccessingFunctions: Set<IdentifierId>,
): Result<void, CompilerError> {
  const errors = new CompilerError();
  const lookupLocations: Map<IdentifierId, SourceLocation> = new Map();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'JsxExpression':
        case 'JsxFragment': {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNoDirectRefValueAccess(errors, operand, lookupLocations);
          }
          break;
        }
        case 'PropertyLoad': {
          if (
            isRefValueType(instr.lvalue.identifier) &&
            instr.value.property === 'current'
          ) {
            lookupLocations.set(instr.lvalue.identifier.id, instr.loc);
          }
          break;
        }
        case 'LoadLocal': {
          if (refAccessingFunctions.has(instr.value.place.identifier.id)) {
            refAccessingFunctions.add(instr.lvalue.identifier.id);
          }
          if (isRefValueType(instr.lvalue.identifier)) {
            const loc = lookupLocations.get(instr.value.place.identifier.id);
            if (loc !== undefined) {
              lookupLocations.set(instr.lvalue.identifier.id, loc);
            }
          }
          break;
        }
        case 'StoreLocal': {
          if (refAccessingFunctions.has(instr.value.value.identifier.id)) {
            refAccessingFunctions.add(instr.value.lvalue.place.identifier.id);
            refAccessingFunctions.add(instr.lvalue.identifier.id);
          }
          if (isRefValueType(instr.value.lvalue.place.identifier)) {
            const loc = lookupLocations.get(instr.value.value.identifier.id);
            if (loc !== undefined) {
              lookupLocations.set(instr.value.lvalue.place.identifier.id, loc);
              lookupLocations.set(instr.lvalue.identifier.id, loc);
            }
          }
          break;
        }
        case 'ObjectMethod':
        case 'FunctionExpression': {
          if (
            /*
             * check if the function expression accesses a ref *or* some other
             * function which accesses a ref
             */
            [...eachInstructionValueOperand(instr.value)].some(
              operand =>
                isRefValueType(operand.identifier) ||
                refAccessingFunctions.has(operand.identifier.id),
            ) ||
            // check for cases where .current is accessed through an aliased ref
            ([...eachInstructionValueOperand(instr.value)].some(operand =>
              isUseRefType(operand.identifier),
            ) &&
              validateNoRefAccessInRenderImpl(
                instr.value.loweredFunc.func,
                refAccessingFunctions,
              ).isErr())
          ) {
            // This function expression unconditionally accesses a ref
            refAccessingFunctions.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case 'MethodCall': {
          if (!isEffectHook(instr.value.property.identifier)) {
            for (const operand of eachInstructionValueOperand(instr.value)) {
              validateNoRefAccess(
                errors,
                refAccessingFunctions,
                operand,
                operand.loc,
              );
            }
          }
          break;
        }
        case 'CallExpression': {
          const callee = instr.value.callee;
          const isUseEffect = isEffectHook(callee.identifier);
          if (!isUseEffect) {
            // Report a more precise error when calling a local function that accesses a ref
            if (refAccessingFunctions.has(callee.identifier.id)) {
              errors.push({
                severity: ErrorSeverity.InvalidReact,
                reason:
                  'This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef)',
                loc: callee.loc,
                description:
                  callee.identifier.name !== null &&
                  callee.identifier.name.kind === 'named'
                    ? `Function \`${callee.identifier.name.value}\` accesses a ref`
                    : null,
                suggestions: null,
              });
            }
            for (const operand of eachInstructionValueOperand(instr.value)) {
              validateNoRefAccess(
                errors,
                refAccessingFunctions,
                operand,
                lookupLocations.get(operand.identifier.id) ?? operand.loc,
              );
            }
          }
          break;
        }
        case 'ObjectExpression':
        case 'ArrayExpression': {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNoRefAccess(
              errors,
              refAccessingFunctions,
              operand,
              lookupLocations.get(operand.identifier.id) ?? operand.loc,
            );
          }
          break;
        }
        case 'PropertyDelete':
        case 'PropertyStore':
        case 'ComputedDelete':
        case 'ComputedStore': {
          validateNoRefAccess(
            errors,
            refAccessingFunctions,
            instr.value.object,
            lookupLocations.get(instr.value.object.identifier.id) ?? instr.loc,
          );
          for (const operand of eachInstructionValueOperand(instr.value)) {
            if (operand === instr.value.object) {
              continue;
            }
            validateNoRefValueAccess(
              errors,
              refAccessingFunctions,
              lookupLocations,
              operand,
            );
          }
          break;
        }
        case 'StartMemoize':
        case 'FinishMemoize':
          break;
        default: {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNoRefValueAccess(
              errors,
              refAccessingFunctions,
              lookupLocations,
              operand,
            );
          }
          break;
        }
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      if (block.terminal.kind !== 'return') {
        validateNoRefValueAccess(
          errors,
          refAccessingFunctions,
          lookupLocations,
          operand,
        );
      } else {
        // Allow functions containing refs to be returned, but not direct ref values
        validateNoDirectRefValueAccess(errors, operand, lookupLocations);
      }
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
  refAccessingFunctions: Set<IdentifierId>,
  lookupLocations: Map<IdentifierId, SourceLocation>,
  operand: Place,
): void {
  if (
    isRefValueType(operand.identifier) ||
    refAccessingFunctions.has(operand.identifier.id)
  ) {
    errors.push({
      severity: ErrorSeverity.InvalidReact,
      reason:
        'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
      loc: lookupLocations.get(operand.identifier.id) ?? operand.loc,
      description:
        operand.identifier.name !== null &&
        operand.identifier.name.kind === 'named'
          ? `Cannot access ref value \`${operand.identifier.name.value}\``
          : null,
      suggestions: null,
    });
  }
}

function validateNoRefAccess(
  errors: CompilerError,
  refAccessingFunctions: Set<IdentifierId>,
  operand: Place,
  loc: SourceLocation,
): void {
  if (
    isRefOrRefValue(operand.identifier) ||
    refAccessingFunctions.has(operand.identifier.id)
  ) {
    errors.push({
      severity: ErrorSeverity.InvalidReact,
      reason:
        'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
      loc: loc,
      description:
        operand.identifier.name !== null &&
        operand.identifier.name.kind === 'named'
          ? `Cannot access ref value \`${operand.identifier.name.value}\``
          : null,
      suggestions: null,
    });
  }
}

function validateNoDirectRefValueAccess(
  errors: CompilerError,
  operand: Place,
  lookupLocations: Map<IdentifierId, SourceLocation>,
): void {
  if (isRefValueType(operand.identifier)) {
    errors.push({
      severity: ErrorSeverity.InvalidReact,
      reason:
        'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
      loc: lookupLocations.get(operand.identifier.id) ?? operand.loc,
      description:
        operand.identifier.name !== null &&
        operand.identifier.name.kind === 'named'
          ? `Cannot access ref value \`${operand.identifier.name.value}\``
          : null,
      suggestions: null,
    });
  }
}
