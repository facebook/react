/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity} from '../CompilerError';
import {
  BlockId,
  HIRFunction,
  IdentifierId,
  Place,
  SourceLocation,
  getHookKindForType,
  isRefValueType,
  isUseRefType,
} from '../HIR';
import {
  eachInstructionOperand,
  eachInstructionValueOperand,
  eachPatternOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {Err, Ok, Result} from '../Utils/Result';

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

const opaqueRefId = Symbol();
type RefId = number & {[opaqueRefId]: 'RefId'};

function makeRefId(id: number): RefId {
  CompilerError.invariant(id >= 0 && Number.isInteger(id), {
    reason: 'Expected identifier id to be a non-negative integer',
    description: null,
    loc: null,
    suggestions: null,
  });
  return id as RefId;
}
let _refId = 0;
function nextRefId(): RefId {
  return makeRefId(_refId++);
}

type RefAccessType =
  | {kind: 'None'}
  | {kind: 'Nullable'}
  | {kind: 'Guard'; refId: RefId}
  | RefAccessRefType;

type RefAccessRefType =
  | {kind: 'Ref'; refId: RefId}
  | {kind: 'RefValue'; loc?: SourceLocation; refId?: RefId}
  | {kind: 'Structure'; value: null | RefAccessRefType; fn: null | RefFnType};

type RefFnType = {readRefEffect: boolean; returnType: RefAccessType};

class Env extends Map<IdentifierId, RefAccessType> {
  #changed = false;

  resetChanged(): void {
    this.#changed = false;
  }

  hasChanged(): boolean {
    return this.#changed;
  }

  override set(key: IdentifierId, value: RefAccessType): this {
    const cur = this.get(key);
    const widenedValue = joinRefAccessTypes(value, cur ?? {kind: 'None'});
    if (
      !(cur == null && widenedValue.kind === 'None') &&
      (cur == null || !tyEqual(cur, widenedValue))
    ) {
      this.#changed = true;
    }
    return super.set(key, widenedValue);
  }
}

export function validateNoRefAccessInRender(fn: HIRFunction): void {
  const env = new Env();
  validateNoRefAccessInRenderImpl(fn, env).unwrap();
}

function refTypeOfType(place: Place): RefAccessType {
  if (isRefValueType(place.identifier)) {
    return {kind: 'RefValue'};
  } else if (isUseRefType(place.identifier)) {
    return {kind: 'Ref', refId: nextRefId()};
  } else {
    return {kind: 'None'};
  }
}

function tyEqual(a: RefAccessType, b: RefAccessType): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  switch (a.kind) {
    case 'None':
      return true;
    case 'Ref':
      return true;
    case 'Nullable':
      return true;
    case 'Guard':
      CompilerError.invariant(b.kind === 'Guard', {
        reason: 'Expected ref value',
        loc: null,
      });
      return a.refId === b.refId;
    case 'RefValue':
      CompilerError.invariant(b.kind === 'RefValue', {
        reason: 'Expected ref value',
        loc: null,
      });
      return a.loc == b.loc;
    case 'Structure': {
      CompilerError.invariant(b.kind === 'Structure', {
        reason: 'Expected structure',
        loc: null,
      });
      const fnTypesEqual =
        (a.fn === null && b.fn === null) ||
        (a.fn !== null &&
          b.fn !== null &&
          a.fn.readRefEffect === b.fn.readRefEffect &&
          tyEqual(a.fn.returnType, b.fn.returnType));
      return (
        fnTypesEqual &&
        (a.value === b.value ||
          (a.value !== null && b.value !== null && tyEqual(a.value, b.value)))
      );
    }
  }
}

function joinRefAccessTypes(...types: Array<RefAccessType>): RefAccessType {
  function joinRefAccessRefTypes(
    a: RefAccessRefType,
    b: RefAccessRefType,
  ): RefAccessRefType {
    if (a.kind === 'RefValue') {
      if (b.kind === 'RefValue' && a.refId === b.refId) {
        return a;
      }
      return {kind: 'RefValue'};
    } else if (b.kind === 'RefValue') {
      return b;
    } else if (a.kind === 'Ref' || b.kind === 'Ref') {
      if (a.kind === 'Ref' && b.kind === 'Ref' && a.refId === b.refId) {
        return a;
      }
      return {kind: 'Ref', refId: nextRefId()};
    } else {
      CompilerError.invariant(
        a.kind === 'Structure' && b.kind === 'Structure',
        {
          reason: 'Expected structure',
          loc: null,
        },
      );
      const fn =
        a.fn === null
          ? b.fn
          : b.fn === null
            ? a.fn
            : {
                readRefEffect: a.fn.readRefEffect || b.fn.readRefEffect,
                returnType: joinRefAccessTypes(
                  a.fn.returnType,
                  b.fn.returnType,
                ),
              };
      const value =
        a.value === null
          ? b.value
          : b.value === null
            ? a.value
            : joinRefAccessRefTypes(a.value, b.value);
      return {
        kind: 'Structure',
        fn,
        value,
      };
    }
  }

  return types.reduce(
    (a, b) => {
      if (a.kind === 'None') {
        return b;
      } else if (b.kind === 'None') {
        return a;
      } else if (a.kind === 'Guard' || b.kind === 'Guard') {
        if (a.kind === 'Guard' && b.kind === 'Guard' && a.refId === b.refId) {
          return a;
        }
        return {kind: 'None'};
      } else if (a.kind === 'Nullable' || b.kind === 'Nullable') {
        if (a.kind === 'Nullable' && b.kind === 'Nullable') {
          return a;
        }
        return {kind: 'None'};
      } else {
        return joinRefAccessRefTypes(a, b);
      }
    },
    {kind: 'None'},
  );
}

function validateNoRefAccessInRenderImpl(
  fn: HIRFunction,
  env: Env,
): Result<RefAccessType, CompilerError> {
  let returnValues: Array<undefined | RefAccessType> = [];
  let place;
  for (const param of fn.params) {
    if (param.kind === 'Identifier') {
      place = param;
    } else {
      place = param.place;
    }
    const type = refTypeOfType(place);
    env.set(place.identifier.id, type);
  }

  for (let i = 0; (i == 0 || env.hasChanged()) && i < 10; i++) {
    env.resetChanged();
    returnValues = [];
    const safeBlocks = new Map<BlockId, RefId>();
    const errors = new CompilerError();
    for (const [, block] of fn.body.blocks) {
      for (const phi of block.phis) {
        env.set(
          phi.place.identifier.id,
          joinRefAccessTypes(
            ...Array(...phi.operands.values()).map(
              operand =>
                env.get(operand.identifier.id) ?? ({kind: 'None'} as const),
            ),
          ),
        );
      }

      for (const instr of block.instructions) {
        switch (instr.value.kind) {
          case 'JsxExpression':
          case 'JsxFragment': {
            for (const operand of eachInstructionValueOperand(instr.value)) {
              validateNoDirectRefValueAccess(errors, operand, env);
            }
            break;
          }
          case 'ComputedLoad':
          case 'PropertyLoad': {
            if (typeof instr.value.property !== 'string') {
              validateNoDirectRefValueAccess(errors, instr.value.property, env);
            }
            const objType = env.get(instr.value.object.identifier.id);
            let lookupType: null | RefAccessType = null;
            if (objType?.kind === 'Structure') {
              lookupType = objType.value;
            } else if (objType?.kind === 'Ref') {
              lookupType = {
                kind: 'RefValue',
                loc: instr.loc,
                refId: objType.refId,
              };
            }
            env.set(
              instr.lvalue.identifier.id,
              lookupType ?? refTypeOfType(instr.lvalue),
            );
            break;
          }
          case 'LoadContext':
          case 'LoadLocal': {
            env.set(
              instr.lvalue.identifier.id,
              env.get(instr.value.place.identifier.id) ??
                refTypeOfType(instr.lvalue),
            );
            break;
          }
          case 'StoreContext':
          case 'StoreLocal': {
            env.set(
              instr.value.lvalue.place.identifier.id,
              env.get(instr.value.value.identifier.id) ??
                refTypeOfType(instr.value.lvalue.place),
            );
            env.set(
              instr.lvalue.identifier.id,
              env.get(instr.value.value.identifier.id) ??
                refTypeOfType(instr.lvalue),
            );
            break;
          }
          case 'Destructure': {
            const objType = env.get(instr.value.value.identifier.id);
            let lookupType = null;
            if (objType?.kind === 'Structure') {
              lookupType = objType.value;
            }
            env.set(
              instr.lvalue.identifier.id,
              lookupType ?? refTypeOfType(instr.lvalue),
            );
            for (const lval of eachPatternOperand(instr.value.lvalue.pattern)) {
              env.set(lval.identifier.id, lookupType ?? refTypeOfType(lval));
            }
            break;
          }
          case 'ObjectMethod':
          case 'FunctionExpression': {
            let returnType: RefAccessType = {kind: 'None'};
            let readRefEffect = false;
            const result = validateNoRefAccessInRenderImpl(
              instr.value.loweredFunc.func,
              env,
            );
            if (result.isOk()) {
              returnType = result.unwrap();
            } else if (result.isErr()) {
              readRefEffect = true;
            }
            env.set(instr.lvalue.identifier.id, {
              kind: 'Structure',
              fn: {
                readRefEffect,
                returnType,
              },
              value: null,
            });
            break;
          }
          case 'MethodCall':
          case 'CallExpression': {
            const callee =
              instr.value.kind === 'CallExpression'
                ? instr.value.callee
                : instr.value.property;
            const hookKind = getHookKindForType(fn.env, callee.identifier.type);
            let returnType: RefAccessType = {kind: 'None'};
            const fnType = env.get(callee.identifier.id);
            if (fnType?.kind === 'Structure' && fnType.fn !== null) {
              returnType = fnType.fn.returnType;
              if (fnType.fn.readRefEffect) {
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
            }
            for (const operand of eachInstructionValueOperand(instr.value)) {
              if (hookKind != null) {
                validateNoDirectRefValueAccess(errors, operand, env);
              } else {
                validateNoRefAccess(errors, env, operand, operand.loc);
              }
            }
            env.set(instr.lvalue.identifier.id, returnType);
            break;
          }
          case 'ObjectExpression':
          case 'ArrayExpression': {
            const types: Array<RefAccessType> = [];
            for (const operand of eachInstructionValueOperand(instr.value)) {
              validateNoDirectRefValueAccess(errors, operand, env);
              types.push(env.get(operand.identifier.id) ?? {kind: 'None'});
            }
            const value = joinRefAccessTypes(...types);
            if (
              value.kind === 'None' ||
              value.kind === 'Guard' ||
              value.kind === 'Nullable'
            ) {
              env.set(instr.lvalue.identifier.id, {kind: 'None'});
            } else {
              env.set(instr.lvalue.identifier.id, {
                kind: 'Structure',
                value,
                fn: null,
              });
            }
            break;
          }
          case 'PropertyDelete':
          case 'PropertyStore':
          case 'ComputedDelete':
          case 'ComputedStore': {
            const safe = safeBlocks.get(block.id);
            const target = env.get(instr.value.object.identifier.id);
            if (
              instr.value.kind === 'PropertyStore' &&
              safe != null &&
              target?.kind === 'Ref' &&
              target.refId === safe
            ) {
              safeBlocks.delete(block.id);
            } else {
              validateNoRefAccess(errors, env, instr.value.object, instr.loc);
            }
            for (const operand of eachInstructionValueOperand(instr.value)) {
              if (operand === instr.value.object) {
                continue;
              }
              validateNoRefValueAccess(errors, env, operand);
            }
            break;
          }
          case 'StartMemoize':
          case 'FinishMemoize':
            break;
          case 'Primitive': {
            if (instr.value.value == null) {
              env.set(instr.lvalue.identifier.id, {kind: 'Nullable'});
            }
            break;
          }
          case 'BinaryExpression': {
            const left = env.get(instr.value.left.identifier.id);
            const right = env.get(instr.value.right.identifier.id);
            let nullish: boolean = false;
            let refId: RefId | null = null;
            if (left?.kind === 'RefValue' && left.refId != null) {
              refId = left.refId;
            } else if (right?.kind === 'RefValue' && right.refId != null) {
              refId = right.refId;
            }

            if (left?.kind === 'Nullable') {
              nullish = true;
            } else if (right?.kind === 'Nullable') {
              nullish = true;
            }

            if (refId !== null && nullish) {
              env.set(instr.lvalue.identifier.id, {kind: 'Guard', refId});
            } else {
              for (const operand of eachInstructionValueOperand(instr.value)) {
                validateNoRefValueAccess(errors, env, operand);
              }
            }
            break;
          }
          default: {
            for (const operand of eachInstructionValueOperand(instr.value)) {
              validateNoRefValueAccess(errors, env, operand);
            }
            break;
          }
        }

        // Guard values are derived from ref.current, so they can only be used in if statement targets
        for (const operand of eachInstructionOperand(instr)) {
          guardCheck(errors, operand, env);
        }

        if (
          isUseRefType(instr.lvalue.identifier) &&
          env.get(instr.lvalue.identifier.id)?.kind !== 'Ref'
        ) {
          env.set(
            instr.lvalue.identifier.id,
            joinRefAccessTypes(
              env.get(instr.lvalue.identifier.id) ?? {kind: 'None'},
              {kind: 'Ref', refId: nextRefId()},
            ),
          );
        }
        if (
          isRefValueType(instr.lvalue.identifier) &&
          env.get(instr.lvalue.identifier.id)?.kind !== 'RefValue'
        ) {
          env.set(
            instr.lvalue.identifier.id,
            joinRefAccessTypes(
              env.get(instr.lvalue.identifier.id) ?? {kind: 'None'},
              {kind: 'RefValue', loc: instr.loc},
            ),
          );
        }
      }

      if (block.terminal.kind === 'if') {
        const test = env.get(block.terminal.test.identifier.id);
        if (test?.kind === 'Guard') {
          safeBlocks.set(block.terminal.consequent, test.refId);
        }
      }

      for (const operand of eachTerminalOperand(block.terminal)) {
        if (block.terminal.kind !== 'return') {
          validateNoRefValueAccess(errors, env, operand);
          if (block.terminal.kind !== 'if') {
            guardCheck(errors, operand, env);
          }
        } else {
          // Allow functions containing refs to be returned, but not direct ref values
          validateNoDirectRefValueAccess(errors, operand, env);
          guardCheck(errors, operand, env);
          returnValues.push(env.get(operand.identifier.id));
        }
      }
    }

    if (errors.hasErrors()) {
      return Err(errors);
    }
  }

  CompilerError.invariant(!env.hasChanged(), {
    reason: 'Ref type environment did not converge',
    loc: null,
  });

  return Ok(
    joinRefAccessTypes(
      ...returnValues.filter((env): env is RefAccessType => env !== undefined),
    ),
  );
}

function destructure(
  type: RefAccessType | undefined,
): RefAccessType | undefined {
  if (type?.kind === 'Structure' && type.value !== null) {
    return destructure(type.value);
  }
  return type;
}

function guardCheck(errors: CompilerError, operand: Place, env: Env): void {
  if (env.get(operand.identifier.id)?.kind === 'Guard') {
    errors.push({
      severity: ErrorSeverity.InvalidReact,
      reason:
        'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
      loc: operand.loc,
      description:
        operand.identifier.name !== null &&
        operand.identifier.name.kind === 'named'
          ? `Cannot access ref value \`${operand.identifier.name.value}\``
          : null,
      suggestions: null,
    });
  }
}

function validateNoRefValueAccess(
  errors: CompilerError,
  env: Env,
  operand: Place,
): void {
  const type = destructure(env.get(operand.identifier.id));
  if (
    type?.kind === 'RefValue' ||
    (type?.kind === 'Structure' && type.fn?.readRefEffect)
  ) {
    errors.push({
      severity: ErrorSeverity.InvalidReact,
      reason:
        'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
      loc: (type.kind === 'RefValue' && type.loc) || operand.loc,
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
  env: Env,
  operand: Place,
  loc: SourceLocation,
): void {
  const type = destructure(env.get(operand.identifier.id));
  if (
    type?.kind === 'Ref' ||
    type?.kind === 'RefValue' ||
    (type?.kind === 'Structure' && type.fn?.readRefEffect)
  ) {
    errors.push({
      severity: ErrorSeverity.InvalidReact,
      reason:
        'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
      loc: (type.kind === 'RefValue' && type.loc) || loc,
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
  env: Env,
): void {
  const type = destructure(env.get(operand.identifier.id));
  if (type?.kind === 'RefValue') {
    errors.push({
      severity: ErrorSeverity.InvalidReact,
      reason:
        'Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)',
      loc: type.loc ?? operand.loc,
      description:
        operand.identifier.name !== null &&
        operand.identifier.name.kind === 'named'
          ? `Cannot access ref value \`${operand.identifier.name.value}\``
          : null,
      suggestions: null,
    });
  }
}
