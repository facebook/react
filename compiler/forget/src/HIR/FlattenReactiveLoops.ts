/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { assertExhaustive } from "../Common/utils";
import { ReactiveBasicBlock, ReactiveBlock, ReactiveFunction } from "./HIR";

/**
 * Given a reactive function, flattens any scopes contained within a loop construct.
 * We won't initially support memoization within loops though this is possible in the future.
 */
export function flattenReactiveLoops(fn: ReactiveFunction): void {
  visit(fn.body, false);
}

function visit(block: ReactiveBasicBlock, shouldFlatten: boolean): void {
  let i = 0;
  while (i < block.length) {
    const item = block[i]!;
    switch (item.kind) {
      case "block": {
        if (shouldFlatten) {
          const successors = block.splice(i + 1);
          block.pop(); // remove the current element
          flatten(item, block);
          i = block.length;
          block.push(...successors);
        } else {
          visit(item.instructions, false);
          i++;
        }
        break;
      }
      case "instruction": {
        i++;
        break;
      }
      case "terminal": {
        const terminal = item.terminal;
        switch (terminal.kind) {
          case "break":
          case "continue":
          case "return":
          case "throw": {
            break;
          }
          case "for": {
            visit(terminal.loop, true);
            break;
          }
          case "while": {
            visit(terminal.loop, true);
            break;
          }
          case "if": {
            visit(terminal.consequent, shouldFlatten);
            if (terminal.alternate !== null) {
              visit(terminal.alternate, shouldFlatten);
            }
            break;
          }
          case "switch": {
            for (const case_ of terminal.cases) {
              if (case_.block !== undefined) {
                visit(case_.block, shouldFlatten);
              }
            }
            break;
          }
          default: {
            assertExhaustive(
              terminal,
              `Unexpected terminal kind '${(terminal as any).kind}'`
            );
          }
        }
        i++;
        break;
      }
      default: {
        assertExhaustive(item, `Unexpected item`);
      }
    }
  }
}

function flatten(scope: ReactiveBlock, block: ReactiveBasicBlock): void {
  for (const item of scope.instructions) {
    switch (item.kind) {
      case "block": {
        flatten(item, block);
        break;
      }
      case "terminal": {
        const terminal = item.terminal;
        switch (terminal.kind) {
          case "break":
          case "continue":
          case "return":
          case "throw": {
            break;
          }
          case "for": {
            visit(terminal.loop, true);
            break;
          }
          case "while": {
            visit(terminal.loop, true);
            break;
          }
          case "if": {
            visit(terminal.consequent, true);
            if (terminal.alternate !== null) {
              visit(terminal.alternate, true);
            }
            break;
          }
          case "switch": {
            for (const case_ of terminal.cases) {
              if (case_.block !== undefined) {
                visit(case_.block, true);
              }
            }
            break;
          }
          default: {
            assertExhaustive(
              terminal,
              `Unexpected terminal kind '${(terminal as any).kind}'`
            );
          }
        }
        block.push(item);
        break;
      }
      default: {
        block.push(item);
      }
    }
  }
}
