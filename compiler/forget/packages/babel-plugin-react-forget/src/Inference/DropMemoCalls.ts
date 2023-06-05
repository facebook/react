/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Effect, HIRFunction, getHookKind } from "../HIR";

export default function (func: HIRFunction): void {
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case "CallExpression": {
          const hookKind = getHookKind(func.env, instr.value.callee.identifier);
          if (hookKind != null) {
            if (hookKind === "useMemo") {
              const [fn] = instr.value.args;

              // TODO(gsn): Consider inlining the function passed to useMemo,
              // rather than just calling it directly.
              //
              // Replace the hook callee with the fn arg.
              //
              // before:
              //   foo = Call useMemo$2($9, $10)
              //
              // after:
              //   foo = Call $9()
              if (fn.kind === "Identifier") {
                instr.value = {
                  kind: "CallExpression",
                  callee: fn,
                  // Drop the args, including the deps array which DCE will remove
                  // later.
                  args: [],
                  loc: instr.value.loc,
                };
              }
            } else if (hookKind === "useCallback") {
              const [fn] = instr.value.args;

              // Instead of a Call, just alias the callback directly.
              //
              // before:
              //   foo = Call useCallback$8($19)
              //
              // after:
              //   foo = $19
              if (fn.kind === "Identifier") {
                instr.value = {
                  kind: "LoadLocal",
                  place: {
                    kind: "Identifier",
                    identifier: fn.identifier,
                    effect: Effect.Unknown,
                    loc: instr.value.loc,
                  },
                  loc: instr.value.loc,
                };
              }
            }
          }
        }
      }
    }
  }
}
