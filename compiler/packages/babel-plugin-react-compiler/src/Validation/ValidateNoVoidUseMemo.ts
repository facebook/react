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
  FunctionExpression,
  SourceLocation,
  Environment,
  Instruction,
  getHookKindForType,
} from '../HIR';
import {Result} from '../Utils/Result';

type TemporariesSidemap = {
  useMemoHooks: Map<IdentifierId, {name: string; loc: SourceLocation}>;
  funcExprs: Map<IdentifierId, FunctionExpression>;
  react: Set<IdentifierId>;
};

/**
 * Validates that useMemo has at least one explicit return statement.
 *
 * Valid cases:
 * - useMemo(() => value)                      // implicit arrow function return
 * - useMemo(() => { return value; })          // explicit return
 * - useMemo(() => { return; })                // explicit undefined
 * - useMemo(() => { if (cond) return val; })  // at least one return
 *
 * Invalid cases:
 * - useMemo(() => { console.log(); })         // no return statement at all
 */
export function validateNoVoidUseMemo(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const errors = new CompilerError();
  const sidemap: TemporariesSidemap = {
    useMemoHooks: new Map(),
    funcExprs: new Map(),
    react: new Set(),
  };

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      collectTemporaries(instr, fn.env, sidemap);
    }
  }

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      if (instr.value.kind === 'CallExpression') {
        const callee = instr.value.callee.identifier;
        const useMemoHook = sidemap.useMemoHooks.get(callee.id);

        if (useMemoHook !== undefined && instr.value.args.length > 0) {
          const firstArg = instr.value.args[0];
          if (firstArg.kind !== 'Identifier') {
            continue;
          }

          let funcToCheck = sidemap.funcExprs.get(firstArg.identifier.id);

          if (!funcToCheck) {
            for (const [, searchBlock] of fn.body.blocks) {
              for (const searchInstr of searchBlock.instructions) {
                if (
                  searchInstr.lvalue &&
                  searchInstr.lvalue.identifier.id === firstArg.identifier.id &&
                  searchInstr.value.kind === 'FunctionExpression'
                ) {
                  funcToCheck = searchInstr.value;
                  break;
                }
              }
              if (funcToCheck) break;
            }
          }

          if (funcToCheck) {
            const hasReturn = checkFunctionHasNonVoidReturn(
              funcToCheck.loweredFunc.func,
            );

            if (!hasReturn) {
              errors.push({
                severity: ErrorSeverity.InvalidReact,
                reason: `React Compiler has skipped optimizing this component because ${useMemoHook.name} doesn't return a value. ${useMemoHook.name} should only be used for memoizing values, not running arbitrary side effects.`,
                loc: useMemoHook.loc,
                suggestions: null,
                description: null,
              });
            }
          }
        }
      }
    }
  }
  return errors.asResult();
}

function checkFunctionHasNonVoidReturn(func: HIRFunction): boolean {
  for (const [, block] of func.body.blocks) {
    if (block.terminal.kind === 'return') {
      if (
        block.terminal.returnVariant === 'Explicit' ||
        block.terminal.returnVariant === 'Implicit'
      ) {
        return true;
      }
    }
  }
  return false;
}

function collectTemporaries(
  instr: Instruction,
  env: Environment,
  sidemap: TemporariesSidemap,
): void {
  const {value, lvalue} = instr;
  switch (value.kind) {
    case 'FunctionExpression': {
      sidemap.funcExprs.set(lvalue.identifier.id, value);
      break;
    }
    case 'LoadGlobal': {
      const global = env.getGlobalDeclaration(value.binding, value.loc);
      const hookKind = global !== null ? getHookKindForType(env, global) : null;
      if (hookKind === 'useMemo') {
        sidemap.useMemoHooks.set(lvalue.identifier.id, {
          name: value.binding.name,
          loc: instr.loc,
        });
      } else if (value.binding.name === 'React') {
        sidemap.react.add(lvalue.identifier.id);
      }
      break;
    }
    case 'PropertyLoad': {
      if (sidemap.react.has(value.object.identifier.id)) {
        if (value.property === 'useMemo') {
          sidemap.useMemoHooks.set(lvalue.identifier.id, {
            name: value.property,
            loc: instr.loc,
          });
        }
      }
      break;
    }
  }
}
