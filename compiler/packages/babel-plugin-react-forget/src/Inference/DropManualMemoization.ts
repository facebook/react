/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Effect, HIRFunction, IdentifierId } from "../HIR";
import { HookKind } from "../HIR/ObjectShape";

/*
 * Removes manual memoization using the `useMemo` and `useCallback` APIs. This pass is designed
 * to compose with InlineImmediatelyInvokedFunctionExpressions, and needs to run prior to entering
 * SSA form (alternatively we could refactor and re-EnterSSA after inlining). Therefore it cannot
 * rely on type inference to find useMemo/useCallback invocations, and instead does basic tracking
 * of globals and property loads to find both direct calls as well as usage via the React namespace,
 * eg `React.useMemo()`.
 */
export function dropManualMemoization(func: HIRFunction): void {
  const hooks = new Map<IdentifierId, HookKind>();
  const react = new Set<IdentifierId>();
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
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
              const [fn] = instr.value.args;

              /*
               * TODO(gsn): Consider inlining the function passed to useMemo,
               * rather than just calling it directly.
               *
               * Replace the hook callee with the fn arg.
               *
               * before:
               *   foo = Call useMemo$2($9, $10)
               *
               * after:
               *   foo = Call $9()
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
              }
            } else if (hookKind === "useCallback") {
              const [fn] = instr.value.args;

              /*
               * Instead of a Call, just alias the callback directly.
               *
               * before:
               *   foo = Call useCallback$8($19)
               *
               * after:
               *   foo = $19
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
              }
            }
          }
          break;
        }
      }
    }
  }
}
