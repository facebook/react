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
} from '../HIR';
import {Result} from '../Utils/Result';

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
  const useMemoHooks = new Map<
    IdentifierId,
    {name: string; loc: SourceLocation}
  >();
  const funcExprs = new Map<IdentifierId, FunctionExpression>();

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      if (!instr.lvalue) {
        continue;
      }

      if (instr.value.kind === 'LoadGlobal') {
        if (
          instr.value.binding.kind === 'Global' &&
          instr.value.binding.name === 'useMemo'
        ) {
          useMemoHooks.set(instr.lvalue.identifier.id, {
            name: instr.value.binding.name,
            loc: instr.loc,
          });
        }
      } else if (instr.value.kind === 'PropertyLoad') {
        if (instr.value.property === 'useMemo') {
          useMemoHooks.set(instr.lvalue.identifier.id, {
            name: instr.value.property,
            loc: instr.loc,
          });
        }
      } else if (instr.value.kind === 'FunctionExpression') {
        funcExprs.set(instr.lvalue.identifier.id, instr.value);
      }
    }
  }

  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      if (instr.value.kind === 'CallExpression') {
        const callee = instr.value.callee.identifier;
        const useMemoHook = useMemoHooks.get(callee.id);

        if (useMemoHook !== undefined && instr.value.args.length > 0) {
          const firstArg = instr.value.args[0];
          if (firstArg.kind !== 'Identifier') {
            continue;
          }

          // First, check if this identifier points to a FunctionExpression
          let funcToCheck = funcExprs.get(firstArg.identifier.id);

          // If not found in funcExprs, check if it's an inline function
          if (!funcToCheck) {
            // Look for the instruction that defines this identifier
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
            const hasReturn = checkFunctionHasReturn(
              funcToCheck.loweredFunc.func,
            );

            if (!hasReturn) {
              errors.push({
                severity: ErrorSeverity.InvalidReact,
                reason: `React Compiler has skipped optimizing this component because ${useMemoHook.name} doesn't return a value. ${useMemoHook.name}should only be used for memoizing values, not running arbitrary side effects.`,
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

function checkFunctionHasReturn(func: HIRFunction): boolean {
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
