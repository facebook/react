/*
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
import { PostDominator, computePostDominatorTree } from "../HIR/Dominator";
import { BlockId, HIRFunction, SourceLocation, getHookKind } from "../HIR/HIR";
import { Err, Ok, Result } from "../Utils/Result";

/*
 * Validates that the function honors the [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)
 * rule that hooks may not be called conditionally. More precisely, a component or hook must always call the
 * same set of hooks in the same order.
 *
 * The algorithm is based on [Dominators](https://en.wikipedia.org/wiki/Dominator_(graph_theory)). Hooks may
 * only be called in basic blocks that are unconditionally reachable from the entry node. In graph theory,
 * this corresponds to basic blocks which post dominate the entry block — that are on every path from the
 * entry block to the exit:
 *
 * ```
 *                  bb0 (entry)
 *                 /         \
 *              bb1          bb2
 *                \         /
 *                    bb3
 *                     |
 *                  (exit)
 * ```
 *
 * Here, neither bb1 or bb2 post dominate the entry, which corresponds to the fact that control can
 * flow from the entry node to either of these nodes. However, bb3 does post dominate the entry node:
 * control flow will _always_ reach bb3 from the entry node. In this graph is is therefore safe to call
 * hooks only in bb0 and bb3, the post dominators of bb0.
 *
 * However if for example bb2 were to early return:
 *
 * ```
 *                  bb0 (entry)
 *                 /         \
 *              bb1          bb2
 *                \           |
 *                    bb3    /
 *                     |   /
 *                  (exit)
 * ```
 *
 * Now only the exit node would post dominate the entry node: there is no other node which is
 * guaranteed to be reachable.  In this graph is is only safe to call hooks in bb0.
 */
export function validateUnconditionalHooks(
  fn: HIRFunction
): Result<PostDominator<BlockId>, CompilerError> {
  // Construct the set of blocks that is always reachable from the entry block.
  const unconditionalBlocks = new Set<BlockId>();
  const dominators = computePostDominatorTree(fn, {
    /*
     * Hooks must only be in a consistent order for executions that return normally,
     * so we opt-in to viewing throw as a non-exit node.
     */
    includeThrowsAsExitNode: false,
  });
  const exit = dominators.exit;
  let current: BlockId | null = fn.body.entry;
  while (current !== null && current !== exit) {
    CompilerError.invariant(!unconditionalBlocks.has(current), {
      reason:
        "Internal error: non-terminating loop in ValidateUnconditionalHooks",
      loc: null,
      suggestions: null,
    });
    unconditionalBlocks.add(current);
    current = dominators.get(current);
  }

  const errors = new CompilerError();
  function recordError(loc: SourceLocation): void {
    errors.pushErrorDetail(
      new CompilerErrorDetail({
        description: null,
        reason:
          "Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)",
        loc,
        severity: ErrorSeverity.InvalidReact,
        suggestions: null,
      })
    );
  }

  for (const [, block] of fn.body.blocks) {
    if (unconditionalBlocks.has(block.id)) {
      continue;
    }
    for (const instr of block.instructions) {
      if (
        instr.value.kind === "CallExpression" &&
        getHookKind(fn.env, instr.value.callee.identifier) != null
      ) {
        /*
         * TODO: the current ESLint rule has different error messages for code that is called conditionally, in a loop, etc.
         * An option would be to first record an Array<[BlockId, Place]> of problematic hooks, then compute the normal dominator graph
         * and walk upward to determine whether each error location was due to a loop, if, etc.
         */
        recordError(instr.loc);
      } else if (
        instr.value.kind === "MethodCall" &&
        getHookKind(fn.env, instr.value.property.identifier) != null
      ) {
        recordError(instr.loc);
      }
    }
  }
  if (errors.hasErrors()) {
    return Err(errors);
  } else {
    return Ok(dominators);
  }
}
