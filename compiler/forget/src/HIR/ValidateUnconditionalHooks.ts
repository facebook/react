/**
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
import { findBlocksWithBackEdges } from "../Optimization/DeadCodeElimination";
import { computeDominators } from "./Dominator";
import { BlockId, HIRFunction, isHookType } from "./HIR";

/**
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
 *                 bb0 (entry)
 *                /         \
 *             bb1          bb2
 *               \         /
 *                   bb3
 *                    |
 *                 (exit)
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
 *                 bb0 (entry)
 *                /         \
 *             bb1          bb2
 *               \           |
 *                   bb3    /
 *                    |   /
 *                 (exit)
 * ```
 *
 * Now only the exit node would post dominate the entry node: there is no other node which is
 * guaranteed to be reachable.  In this graph is is only safe to call hooks in bb0.
 */
export function validateUnconditionalHooks(fn: HIRFunction): void {
  // Construct the set of blocks that is always reachable from the entry block.
  const unconditionalBlocks = new Set<BlockId>();
  const blocksWithBackEdges = findBlocksWithBackEdges(fn);
  const dominators = computeDominators(fn, { reverse: true });
  // Post dominator graph so .entry is the "exit" node
  const exit = dominators.entry;
  let current: BlockId | null = fn.body.entry;
  while (
    current !== null &&
    current !== exit &&
    !blocksWithBackEdges.has(current)
  ) {
    unconditionalBlocks.add(current);
    current = dominators.get(current);
  }

  const errors = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    if (unconditionalBlocks.has(block.id)) {
      continue;
    }
    for (const instr of block.instructions) {
      if (
        instr.value.kind === "CallExpression" &&
        isHookType(instr.value.callee.identifier)
      ) {
        const loc = instr.loc;
        errors.pushErrorDetail(
          new CompilerErrorDetail({
            codeframe: null,
            description: null,
            reason:
              "Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning)",
            loc: typeof loc !== "symbol" ? loc : null,
            severity: ErrorSeverity.InvalidInput,
          })
        );
      }
    }
  }
  if (errors.hasErrors()) {
    throw errors;
  }
}
