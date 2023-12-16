/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "..";
import {
  Effect,
  FunctionExpression,
  HIRFunction,
  IdentifierId,
  Instruction,
  Place,
  SpreadPattern,
  makeInstructionId,
} from "../HIR";
import { createTemporaryPlace, markInstructionIds } from "../HIR/HIRBuilder";
import { HookKind } from "../HIR/ObjectShape";
import { eachInstructionValueOperand } from "../HIR/visitors";

/*
 * Removes manual memoization using the `useMemo` and `useCallback` APIs. This pass is designed
 * to compose with InlineImmediatelyInvokedFunctionExpressions, and needs to run prior to entering
 * SSA form (alternatively we could refactor and re-EnterSSA after inlining). Therefore it cannot
 * rely on type inference to find useMemo/useCallback invocations, and instead does basic tracking
 * of globals and property loads to find both direct calls as well as usage via the React namespace,
 * eg `React.useMemo()`.
 */
export function dropManualMemoization(func: HIRFunction): void {
  const functions = new Map<IdentifierId, FunctionExpression>();
  const hooks = new Map<IdentifierId, HookKind>();
  const react = new Set<IdentifierId>();
  let hasChanges = false;
  for (const [_, block] of func.body.blocks) {
    let nextInstructions: Array<Instruction> | null = null;
    for (let i = 0; i < block.instructions.length; i++) {
      const instr = block.instructions[i]!;
      switch (instr.value.kind) {
        case "FunctionExpression": {
          functions.set(instr.lvalue.identifier.id, instr.value);
          break;
        }
        case "LoadGlobal": {
          if (
            instr.value.name === "useMemo" ||
            instr.value.name === "useCallback"
          ) {
            hooks.set(instr.lvalue.identifier.id, instr.value.name);
          } else if (instr.value.name === "React") {
            react.add(instr.lvalue.identifier.id);
          }
          break;
        }
        case "PropertyLoad": {
          if (react.has(instr.value.object.identifier.id)) {
            if (
              instr.value.property === "useMemo" ||
              instr.value.property === "useCallback"
            ) {
              hooks.set(instr.lvalue.identifier.id, instr.value.property);
            }
          }
          break;
        }
        case "MethodCall":
        case "CallExpression": {
          const id =
            instr.value.kind === "CallExpression"
              ? instr.value.callee.identifier.id
              : instr.value.property.identifier.id;
          const hookKind = hooks.get(id);
          if (hookKind != null) {
            if (hookKind === "useMemo") {
              const [fn] = instr.value.args as Array<
                Place | SpreadPattern | undefined
              >;
              if (fn == null) {
                CompilerError.throwInvalidReact({
                  reason: "Expected useMemo call to pass a callback function",
                  loc: instr.loc,
                  suggestions: null,
                });
              }
              /*
               * Replace the hook callee with the fn arg.
               *
               * before:
               *   $1 = LoadGlobal useMemo       // load the useMemo global
               *   $2 = FunctionExpression ...   // memo function
               *   $3 = ArrayExpression [ ... ]  // deps array
               *   $4 = Call $1 ($2, $3 )        // invoke useMemo w fn and deps
               *
               * after:
               *   $1 = LoadGlobal useMemo       // load the useMemo global (dead code)
               *   $2 = FunctionExpression ...   // memo function
               *   $3 = ArrayExpression [ ... ]  // deps array (dead code)
               *   $4 = Call $2 ()               // invoke the memo function itself
               *
               * Note that a later pass (InlineImmediatelyInvokedFunctionExpressions) will
               * inline the useMemo callback along with any other immediately invoked IIFEs.
               */
              if (fn.kind === "Identifier") {
                instr.value = {
                  kind: "CallExpression",
                  callee: fn,
                  /*
                   * Drop the args, including the deps array which DCE will remove
                   * later.
                   */
                  args: [],
                  loc: instr.value.loc,
                };

                if (
                  func.env.config.enablePreserveExistingMemoizationGuarantees ||
                  func.env.config.validatePreserveExistingMemoizationGuarantees
                ) {
                  /**
                   * When this flag is enabled we also compile in a 'Memoize' instruction
                   * to preserve the intended memoization boundary:
                   *
                   * Normal output:
                   *   $1 = LoadGlobal useMemo       // load the useMemo global (dead code)
                   *   $2 = FunctionExpression ...   // memo function
                   *   $3 = ArrayExpression [ ... ]  // deps array (dead code)
                   *   $4 = Call $2 ()               // invoke the memo function itself
                   *
                   * Output w flag enabled:
                   *   $1 = LoadGlobal useMemo       // load the useMemo global (dead code)
                   *   $2 = FunctionExpression ...   // memo function
                   *   $3 = ArrayExpression [ ... ]  // deps array (dead code)
                   *   .. = Memoize ...              // memoize dependencies
                   *   $4 = Call $2 ()               // invoke the memo function itself
                   *   .. = Memoize $4               // preserve memo information
                   *
                   * Note that Memoize does not produce a result and is called for its side
                   * effects only.
                   */
                  nextInstructions =
                    nextInstructions ?? block.instructions.slice(0, i);

                  const functionExpression = functions.get(fn.identifier.id);
                  if (functionExpression !== undefined) {
                    for (const operand of eachInstructionValueOperand(
                      functionExpression
                    )) {
                      const temp = createTemporaryPlace(func.env);
                      nextInstructions.push({
                        id: makeInstructionId(0),
                        lvalue: temp,
                        value: {
                          kind: "Memoize",
                          value: { ...operand },
                          loc: instr.loc,
                        },
                        loc: instr.loc,
                      });
                    }
                  }

                  nextInstructions.push(instr);

                  const temp = createTemporaryPlace(func.env);
                  nextInstructions.push({
                    id: makeInstructionId(0),
                    lvalue: temp,
                    value: {
                      kind: "Memoize",
                      value: { ...instr.lvalue },
                      loc: instr.loc,
                    },
                    loc: instr.loc,
                  });
                  continue;
                }
              }
            } else if (hookKind === "useCallback") {
              const [fn] = instr.value.args as Array<
                Place | SpreadPattern | undefined
              >;
              if (fn == null) {
                CompilerError.throwInvalidReact({
                  reason: "Expected useMemo call to pass a callback function",
                  loc: instr.loc,
                  suggestions: null,
                });
              }

              /*
               * Instead of a Call, just alias the callback directly.
               *
               * before:
               *   $1 = LoadGlobal useCallback
               *   $2 = FunctionExpression ...   // the callback being memoized
               *   $3 = ArrayExpression ...      // deps array
               *   $4 = Call $1 ( $2, $3 )       // invoke useCallback
               *
               * after:
               *   $1 = LoadGlobal useCallback   // dead code
               *   $2 = FunctionExpression ...   // the callback being memoized
               *   $3 = ArrayExpression ...      // deps array (dead code)
               *   $4 = LoadLocal $2             // reference the function
               */
              if (fn.kind === "Identifier") {
                instr.value = {
                  kind: "LoadLocal",
                  place: {
                    kind: "Identifier",
                    identifier: fn.identifier,
                    effect: Effect.Unknown,
                    reactive: false,
                    loc: instr.value.loc,
                  },
                  loc: instr.value.loc,
                };
                if (
                  func.env.config.enablePreserveExistingMemoizationGuarantees ||
                  func.env.config.validatePreserveExistingMemoizationGuarantees
                ) {
                  nextInstructions =
                    nextInstructions ?? block.instructions.slice(0, i);
                  /**
                   * With the flag enabled the output changes to use a Memoize instruction instead
                   * a loadlocal to load the function expression into the original temporary:
                   *
                   * Normal output:
                   *   $1 = LoadGlobal useCallback   // dead code
                   *   $2 = FunctionExpression ...   // the callback being memoized
                   *   $3 = ArrayExpression ...      // deps array (dead code)
                   *   $4 = LoadLocal $2             // reference the function
                   *
                   * With flag enabled:
                   *   $1 = LoadGlobal useCallback   // dead code
                   *   $2 = FunctionExpression ...   // the callback being memoized
                   *   $3 = ArrayExpression ...      // deps array (dead code)
                   *   .. = Memoize ...              // memoize dependencies
                   *   $n = Memoize $2               // reference the function
                   *   $4 = LoadLocal $2             // reference the function
                   *
                   * Note that Memoize does not produce a result and is called for its side effects
                   * only.
                   */
                  const functionExpression = functions.get(fn.identifier.id);
                  if (functionExpression !== undefined) {
                    for (const operand of eachInstructionValueOperand(
                      functionExpression
                    )) {
                      const temp = createTemporaryPlace(func.env);
                      nextInstructions.push({
                        id: makeInstructionId(0),
                        lvalue: temp,
                        value: {
                          kind: "Memoize",
                          value: { ...operand },
                          loc: instr.loc,
                        },
                        loc: instr.loc,
                      });
                    }
                  }
                  nextInstructions.push(instr);

                  const temp = createTemporaryPlace(func.env);
                  nextInstructions.push({
                    id: makeInstructionId(0),
                    lvalue: { ...temp },
                    value: {
                      kind: "Memoize",
                      value: {
                        kind: "Identifier",
                        identifier: fn.identifier,
                        effect: Effect.Unknown,
                        reactive: false,
                        loc: instr.value.loc,
                      },
                      loc: instr.value.loc,
                    },
                    loc: instr.loc,
                  });
                  continue;
                }
              }
            }
          }
          break;
        }
      }
      if (nextInstructions !== null) {
        nextInstructions.push(instr);
      }
    }
    if (nextInstructions !== null) {
      block.instructions = nextInstructions;
      hasChanges = true;
    }
  }
  if (hasChanges) {
    markInstructionIds(func.body);
  }
}
