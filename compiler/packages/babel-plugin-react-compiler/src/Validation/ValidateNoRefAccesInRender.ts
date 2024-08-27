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
  isRefValueType,
  isUseRefType,
} from '../HIR';
import {
  eachInstructionValueOperand,
  eachPatternOperand,
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
type State = {
  refs: Set<IdentifierId>;
  refValues: Map<IdentifierId, SourceLocation | null>;
  refAccessingFunctions: Set<IdentifierId>;
};

export function validateNoRefAccessInRender(fn: HIRFunction): void {
  const state = {
    refs: new Set<IdentifierId>(),
    refValues: new Map<IdentifierId, SourceLocation | null>(),
    refAccessingFunctions: new Set<IdentifierId>(),
  };
  validateNoRefAccessInRenderImpl(fn, state).unwrap();
}

function validateNoRefAccessInRenderImpl(
  fn: HIRFunction,
  state: State,
): Result<void, CompilerError> {
  let place;
  for (const param of fn.params) {
    if (param.kind === 'Identifier') {
      place = param;
    } else {
      place = param.place;
    }

    if (isRefValueType(place.identifier)) {
      state.refValues.set(place.identifier.id, null);
    }
    if (isUseRefType(place.identifier)) {
      state.refs.add(place.identifier.id);
    }
  }
  const errors = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      phi.operands.forEach(operand => {
        if (state.refs.has(operand.id) || isUseRefType(phi.id)) {
          state.refs.add(phi.id.id);
        }
        const refValue = state.refValues.get(operand.id);
        if (refValue !== undefined || isRefValueType(operand)) {
          state.refValues.set(
            phi.id.id,
            refValue ?? state.refValues.get(phi.id.id) ?? null,
          );
        }
        if (state.refAccessingFunctions.has(operand.id)) {
          state.refAccessingFunctions.add(phi.id.id);
        }
      });
    }

    for (const instr of block.instructions) {
      for (const operand of eachInstructionValueOperand(instr.value)) {
        if (isRefValueType(operand.identifier)) {
          CompilerError.invariant(state.refValues.has(operand.identifier.id), {
            reason: 'Expected ref value to be in state',
            loc: operand.loc,
          });
        }
        if (isUseRefType(operand.identifier)) {
          CompilerError.invariant(state.refs.has(operand.identifier.id), {
            reason: 'Expected ref to be in state',
            loc: operand.loc,
          });
        }
      }

      switch (instr.value.kind) {
        case 'JsxExpression':
        case 'JsxFragment': {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNoDirectRefValueAccess(errors, operand, state);
          }
          break;
        }
        case 'ComputedLoad':
        case 'PropertyLoad': {
          if (typeof instr.value.property !== 'string') {
            validateNoRefValueAccess(errors, state, instr.value.property);
          }
          if (
            state.refAccessingFunctions.has(instr.value.object.identifier.id)
          ) {
            state.refAccessingFunctions.add(instr.lvalue.identifier.id);
          }
          if (state.refs.has(instr.value.object.identifier.id)) {
            /*
             * Once an object contains a ref at any level, we treat it as a ref.
             * If we look something up from it, that value may either be a ref
             * or the ref value (or neither), so we conservatively assume it's both.
             */
            state.refs.add(instr.lvalue.identifier.id);
            state.refValues.set(instr.lvalue.identifier.id, instr.loc);
          }
          break;
        }
        case 'LoadContext':
        case 'LoadLocal': {
          if (
            state.refAccessingFunctions.has(instr.value.place.identifier.id)
          ) {
            state.refAccessingFunctions.add(instr.lvalue.identifier.id);
          }
          const refValue = state.refValues.get(instr.value.place.identifier.id);
          if (refValue !== undefined) {
            state.refValues.set(instr.lvalue.identifier.id, refValue);
          }
          if (state.refs.has(instr.value.place.identifier.id)) {
            state.refs.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case 'StoreContext':
        case 'StoreLocal': {
          if (
            state.refAccessingFunctions.has(instr.value.value.identifier.id)
          ) {
            state.refAccessingFunctions.add(
              instr.value.lvalue.place.identifier.id,
            );
            state.refAccessingFunctions.add(instr.lvalue.identifier.id);
          }
          const refValue = state.refValues.get(instr.value.value.identifier.id);
          if (
            refValue !== undefined ||
            isRefValueType(instr.value.lvalue.place.identifier)
          ) {
            state.refValues.set(
              instr.value.lvalue.place.identifier.id,
              refValue ?? null,
            );
            state.refValues.set(instr.lvalue.identifier.id, refValue ?? null);
          }
          if (state.refs.has(instr.value.value.identifier.id)) {
            state.refs.add(instr.value.lvalue.place.identifier.id);
            state.refs.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case 'Destructure': {
          const destructuredFunction = state.refAccessingFunctions.has(
            instr.value.value.identifier.id,
          );
          const destructuredRef = state.refs.has(
            instr.value.value.identifier.id,
          );
          for (const lval of eachPatternOperand(instr.value.lvalue.pattern)) {
            if (isUseRefType(lval.identifier)) {
              state.refs.add(lval.identifier.id);
            }
            if (destructuredRef || isRefValueType(lval.identifier)) {
              state.refs.add(lval.identifier.id);
              state.refValues.set(lval.identifier.id, null);
            }
            if (destructuredFunction) {
              state.refAccessingFunctions.add(lval.identifier.id);
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
                state.refValues.has(operand.identifier.id) ||
                state.refAccessingFunctions.has(operand.identifier.id),
            ) ||
            // check for cases where .current is accessed through an aliased ref
            ([...eachInstructionValueOperand(instr.value)].some(operand =>
              state.refs.has(operand.identifier.id),
            ) &&
              validateNoRefAccessInRenderImpl(
                instr.value.loweredFunc.func,
                state,
              ).isErr())
          ) {
            // This function expression unconditionally accesses a ref
            state.refAccessingFunctions.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case 'MethodCall': {
          if (!isEffectHook(instr.value.property.identifier)) {
            for (const operand of eachInstructionValueOperand(instr.value)) {
              validateNoRefAccess(errors, state, operand, operand.loc);
            }
          }
          break;
        }
        case 'CallExpression': {
          const callee = instr.value.callee;
          const isUseEffect = isEffectHook(callee.identifier);
          if (!isUseEffect) {
            // Report a more precise error when calling a local function that accesses a ref
            if (state.refAccessingFunctions.has(callee.identifier.id)) {
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
                state,
                operand,
                state.refValues.get(operand.identifier.id) ?? operand.loc,
              );
            }
          }
          break;
        }
        case 'ObjectExpression':
        case 'ArrayExpression': {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNoDirectRefValueAccess(errors, operand, state);
            if (state.refAccessingFunctions.has(operand.identifier.id)) {
              state.refAccessingFunctions.add(instr.lvalue.identifier.id);
            }
            if (state.refs.has(operand.identifier.id)) {
              state.refs.add(instr.lvalue.identifier.id);
            }
            const refValue = state.refValues.get(operand.identifier.id);
            if (refValue !== undefined) {
              state.refValues.set(instr.lvalue.identifier.id, refValue);
            }
          }
          break;
        }
        case 'PropertyDelete':
        case 'PropertyStore':
        case 'ComputedDelete':
        case 'ComputedStore': {
          validateNoRefAccess(
            errors,
            state,
            instr.value.object,
            state.refValues.get(instr.value.object.identifier.id) ?? instr.loc,
          );
          for (const operand of eachInstructionValueOperand(instr.value)) {
            if (operand === instr.value.object) {
              continue;
            }
            validateNoRefValueAccess(errors, state, operand);
          }
          break;
        }
        case 'StartMemoize':
        case 'FinishMemoize':
          break;
        default: {
          for (const operand of eachInstructionValueOperand(instr.value)) {
            validateNoRefValueAccess(errors, state, operand);
          }
          break;
        }
      }
      if (isUseRefType(instr.lvalue.identifier)) {
        state.refs.add(instr.lvalue.identifier.id);
      }
      if (
        isRefValueType(instr.lvalue.identifier) &&
        !state.refValues.has(instr.lvalue.identifier.id)
      ) {
        state.refValues.set(instr.lvalue.identifier.id, instr.loc);
      }
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      if (block.terminal.kind !== 'return') {
        validateNoRefValueAccess(errors, state, operand);
      } else {
        // Allow functions containing refs to be returned, but not direct ref values
        validateNoDirectRefValueAccess(errors, operand, state);
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
  state: State,
  operand: Place,
): void {
  if (
    state.refValues.has(operand.identifier.id) ||
    state.refAccessingFunctions.has(operand.identifier.id)
  ) {
    errors.push({
      severity: ErrorSeverity.InvalidReact,
      reason:
        'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
      loc: state.refValues.get(operand.identifier.id) ?? operand.loc,
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
  state: State,
  operand: Place,
  loc: SourceLocation,
): void {
  if (
    state.refs.has(operand.identifier.id) ||
    state.refValues.has(operand.identifier.id) ||
    state.refAccessingFunctions.has(operand.identifier.id)
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
  state: State,
): void {
  if (state.refValues.has(operand.identifier.id)) {
    errors.push({
      severity: ErrorSeverity.InvalidReact,
      reason:
        'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
      loc: state.refValues.get(operand.identifier.id) ?? operand.loc,
      description:
        operand.identifier.name !== null &&
        operand.identifier.name.kind === 'named'
          ? `Cannot access ref value \`${operand.identifier.name.value}\``
          : null,
      suggestions: null,
    });
  }
}
