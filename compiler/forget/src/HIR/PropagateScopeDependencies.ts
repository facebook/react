/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { assertExhaustive } from "../Common/utils";
import { Place, ReactiveBasicBlock, ReactiveFunction } from "./HIR";

/**
 * Propagates the dependencies of each scope to its parent scope(s).
 */
export function propagateScopeDependencies(fn: ReactiveFunction): void {
  const dependencies: Set<Place> = new Set();
  visit(fn.body, dependencies);
}

function visit(block: ReactiveBasicBlock, dependencies: Set<Place>): void {
  for (const item of block) {
    switch (item.kind) {
      case "block": {
        visit(item.instructions, item.dependencies);
        for (const dep of item.dependencies) {
          dependencies.add(dep);
        }
        break;
      }
      case "instruction": {
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
            visit(terminal.loop, dependencies);
            break;
          }
          case "while": {
            visit(terminal.loop, dependencies);
            break;
          }
          case "if": {
            visit(terminal.consequent, dependencies);
            if (terminal.alternate !== null) {
              visit(terminal.alternate, dependencies);
            }
            break;
          }
          case "switch": {
            for (const case_ of terminal.cases) {
              if (case_.block !== undefined) {
                visit(case_.block, dependencies);
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
        break;
      }
      default: {
        assertExhaustive(item, `Unexpected item`);
      }
    }
  }
}
