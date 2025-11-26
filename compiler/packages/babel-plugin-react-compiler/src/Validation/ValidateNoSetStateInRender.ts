/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  CompilerDiagnostic,
  CompilerError,
  ErrorCategory,
} from '../CompilerError';
import {
  HIRFunction,
  Identifier,
  IdentifierId,
  Instruction,
  InstructionValue,
  isPrimitiveType,
  isSetStateType,
  Phi,
  Place,
  SpreadPattern,
} from '../HIR';
import {computeUnconditionalBlocks} from '../HIR/ComputeUnconditionalBlocks';
import {eachInstructionValueOperand} from '../HIR/visitors';
import {Result} from '../Utils/Result';

function isPrimitiveSetArg(
  arg: Place | SpreadPattern,
  fn: HIRFunction,
): boolean {
  if (arg.kind !== 'Identifier') {
    return false;
  }

  const visited = new Set<IdentifierId>();
  const defs = buildDefinitionMap(fn);
  return isPrimitiveIdentifier(arg.identifier, defs, visited);
}

type DefinitionMap = Map<IdentifierId, Instruction | Phi>;

function buildDefinitionMap(fn: HIRFunction): DefinitionMap {
  const defs: DefinitionMap = new Map();

  for (const [, block] of fn.body.blocks) {
    for (const phi of block.phis) {
      defs.set(phi.place.identifier.id, phi);
    }
    for (const instr of block.instructions) {
      defs.set(instr.lvalue.identifier.id, instr);
    }
  }

  return defs;
}

function isPrimitiveIdentifier(
  identifier: Identifier,
  defs: DefinitionMap,
  visited: Set<IdentifierId>,
): boolean {
  if (isPrimitiveType(identifier)) {
    return true;
  }

  if (visited.has(identifier.id)) {
    return false;
  }
  visited.add(identifier.id);

  const def = defs.get(identifier.id);
  if (def == null) {
    return false;
  }

  if (isPhi(def)) {
    return Array.from(def.operands.values()).every(operand =>
      isPrimitiveIdentifier(operand.identifier, defs, visited),
    );
  }

  return isPrimitiveInstruction(def.value, defs, visited);
}

function isPhi(def: Instruction | Phi): def is Phi {
  return 'kind' in def && def.kind === 'Phi';
}

function isPrimitiveInstruction(
  value: InstructionValue,
  defs: DefinitionMap,
  visited: Set<IdentifierId>,
): boolean {
  switch (value.kind) {
    case 'Primitive':
    case 'TemplateLiteral':
    case 'JSXText':
    case 'UnaryExpression':
    case 'BinaryExpression':
      return true;

    case 'TypeCastExpression':
      return isPrimitiveIdentifier(value.value.identifier, defs, visited);

    case 'LoadLocal':
    case 'LoadContext':
      return isPrimitiveIdentifier(value.place.identifier, defs, visited);

    case 'StoreLocal':
    case 'StoreContext':
      return isPrimitiveIdentifier(value.value.identifier, defs, visited);

    case 'Await':
      return isPrimitiveIdentifier(value.value.identifier, defs, visited);

    default:
      return false;
  }
}

/**
 * Validates that the given function does not have an infinite update loop
 * caused by unconditionally calling setState during render. This validation
 * is conservative and cannot catch all cases of unconditional setState in
 * render, but avoids false positives. Examples of cases that are caught:
 *
 * ```javascript
 * // Direct call of setState:
 * const [state, setState] = useState(false);
 * setState(true);
 *
 * // Indirect via a function:
 * const [state, setState] = useState(false);
 * const setTrue = () => setState(true);
 * setTrue();
 * ```
 *
 * However, storing setState inside another value and accessing it is not yet
 * validated:
 *
 * ```
 * // false negative, not detected but will cause an infinite render loop
 * const [state, setState] = useState(false);
 * const x = [setState];
 * const y = x.pop();
 * y();
 * ```
 */
export function validateNoSetStateInRender(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const unconditionalSetStateFunctions: Set<IdentifierId> = new Set();
  return validateNoSetStateInRenderImpl(fn, unconditionalSetStateFunctions);
}

function validateNoSetStateInRenderImpl(
  fn: HIRFunction,
  unconditionalSetStateFunctions: Set<IdentifierId>,
): Result<void, CompilerError> {
  const unconditionalBlocks = computeUnconditionalBlocks(fn);
  const enableUseKeyedState = fn.env.config.enableUseKeyedState;
  let activeManualMemoId: number | null = null;
  const errors = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'LoadLocal': {
          if (
            unconditionalSetStateFunctions.has(instr.value.place.identifier.id)
          ) {
            unconditionalSetStateFunctions.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case 'StoreLocal': {
          if (
            unconditionalSetStateFunctions.has(instr.value.value.identifier.id)
          ) {
            unconditionalSetStateFunctions.add(
              instr.value.lvalue.place.identifier.id,
            );
            unconditionalSetStateFunctions.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case 'ObjectMethod':
        case 'FunctionExpression': {
          if (
            // faster-path to check if the function expression references a setState
            [...eachInstructionValueOperand(instr.value)].some(
              operand =>
                isSetStateType(operand.identifier) ||
                unconditionalSetStateFunctions.has(operand.identifier.id),
            ) &&
            // if yes, does it unconditonally call it?
            validateNoSetStateInRenderImpl(
              instr.value.loweredFunc.func,
              unconditionalSetStateFunctions,
            ).isErr()
          ) {
            // This function expression unconditionally calls a setState
            unconditionalSetStateFunctions.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case 'StartMemoize': {
          CompilerError.invariant(activeManualMemoId === null, {
            reason: 'Unexpected nested StartMemoize instructions',
            description: null,
            details: [
              {
                kind: 'error',
                loc: instr.value.loc,
                message: null,
              },
            ],
          });
          activeManualMemoId = instr.value.manualMemoId;
          break;
        }
        case 'FinishMemoize': {
          CompilerError.invariant(
            activeManualMemoId === instr.value.manualMemoId,
            {
              reason:
                'Expected FinishMemoize to align with previous StartMemoize instruction',
              description: null,
              details: [
                {
                  kind: 'error',
                  loc: instr.value.loc,
                  message: null,
                },
              ],
            },
          );
          activeManualMemoId = null;
          break;
        }
        case 'CallExpression': {
          const callee = instr.value.callee;
          if (
            isSetStateType(callee.identifier) ||
            unconditionalSetStateFunctions.has(callee.identifier.id)
          ) {
            if (activeManualMemoId !== null) {
              errors.pushDiagnostic(
                CompilerDiagnostic.create({
                  category: ErrorCategory.RenderSetState,
                  reason:
                    'Calling setState from useMemo may trigger an infinite loop',
                  description:
                    'Each time the memo callback is evaluated it will change state. This can cause a memoization dependency to change, running the memo function again and causing an infinite loop. Instead of setting state in useMemo(), prefer deriving the value during render. (https://react.dev/reference/react/useState)',
                  suggestions: null,
                }).withDetails({
                  kind: 'error',
                  loc: callee.loc,
                  message: 'Found setState() within useMemo()',
                }),
              );
            } else if (unconditionalBlocks.has(block.id)) {
              let isArgPrimitive = false;

              if (instr.value.args.length > 0) {
                const arg = instr.value.args[0];
                if (arg.kind === 'Identifier') {
                  isArgPrimitive = isPrimitiveSetArg(arg, fn);
                }
              }

              if (isArgPrimitive) {
                if (enableUseKeyedState) {
                  errors.pushDiagnostic(
                    CompilerDiagnostic.create({
                      category: ErrorCategory.RenderSetState,
                      reason:
                        'Calling setState during render may trigger an infinite loop',
                      description:
                        'Use useKeyedState instead of calling setState directly in render. Example: const [value, setValue] = useKeyedState(initialValue, key)',
                      suggestions: null,
                    }).withDetails({
                      kind: 'error',
                      loc: callee.loc,
                      message: 'Found setState() in render',
                    }),
                  );
                }
              } else {
                errors.pushDiagnostic(
                  CompilerDiagnostic.create({
                    category: ErrorCategory.RenderSetState,
                    reason:
                      'Calling setState during render may trigger an infinite loop',
                    description:
                      'Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState)',
                    suggestions: null,
                  }).withDetails({
                    kind: 'error',
                    loc: callee.loc,
                    message: 'Found setState() in render',
                  }),
                );
              }
            }
          }
          break;
        }
      }
    }
  }

  return errors.asResult();
}
