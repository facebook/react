/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ReactiveBlock, ReactiveFunction } from "../HIR/HIR";
import { assertExhaustive } from "../Utils/utils";
import { mapTerminalBlocks } from "./visitors";

/**
 * Converts scopes without outputs into regular blocks.
 */
export function pruneUnusedScopes(fn: ReactiveFunction): void {
  fn.body = visitBlock(fn.body);
}

function visitBlock(block: ReactiveBlock): ReactiveBlock {
  let nextBlock: ReactiveBlock | null = null;
  for (let i = 0; i < block.length; i++) {
    const stmt = block[i]!;
    switch (stmt.kind) {
      case "terminal": {
        mapTerminalBlocks(stmt.terminal, visitBlock);
        break;
      }
      case "instruction": {
        break;
      }
      case "scope": {
        stmt.instructions = visitBlock(stmt.instructions);
        // If a scope doesn't have declarations but reassigns a value, the scope shouldn't be pruned
        // as we still want to generate a memo block for that scope
        if (
          stmt.scope.declarations.size === 0 &&
          (stmt.scope.dependencies.size === 0 ||
            stmt.scope.reassignments.size === 0)
        ) {
          nextBlock ??= block.slice(0, i);
          nextBlock.push(...stmt.instructions);
          continue;
        }
        break;
      }
      default: {
        assertExhaustive(
          stmt,
          `Unexpected statement kind '${(stmt as any).kind}'`
        );
      }
    }
    if (nextBlock !== null) {
      nextBlock.push(stmt);
    }
  }
  return nextBlock ?? block;
}
