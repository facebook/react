/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ReactiveBlock, ReactiveTerminal } from "../HIR/HIR";
import { assertExhaustive } from "../Utils/utils";

export function mapTerminalBlocks(
  terminal: ReactiveTerminal,
  fn: (block: ReactiveBlock) => ReactiveBlock
): void {
  switch (terminal.kind) {
    case "break":
    case "continue":
    case "return":
    case "throw": {
      break;
    }
    case "for": {
      terminal.loop = fn(terminal.loop);
      break;
    }
    case "while": {
      terminal.loop = fn(terminal.loop);
      break;
    }
    case "if": {
      terminal.consequent = fn(terminal.consequent);
      if (terminal.alternate !== null) {
        terminal.alternate = fn(terminal.alternate);
      }
      break;
    }
    case "switch": {
      for (const case_ of terminal.cases) {
        if (case_.block !== undefined) {
          case_.block = fn(case_.block);
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
}
