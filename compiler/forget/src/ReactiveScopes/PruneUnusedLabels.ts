/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BlockId,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveTerminal,
} from "../HIR/HIR";
import { assertExhaustive } from "../Utils/utils";

/**
 * Prunes terminal labels that are never explicitly jumped to.
 */
export function pruneUnusedLabels(fn: ReactiveFunction): void {
  const labels: Labels = new Set();
  visitBlock(labels, fn.body);
}

type Labels = Set<BlockId>;

function visitBlock(labels: Labels, block: ReactiveBlock): void {
  for (const item of block) {
    if (item.kind === "terminal") {
      // first visit the terminal's contents, which is the only place that can
      // reference the terminal's label
      visitTerminal(labels, item.terminal);
      // if the label wasn't referenced by a break/continue, we can prune it
      if (item.label !== null && !labels.has(item.label)) {
        item.label = null;
      }
    } else if (item.kind === "scope") {
      visitBlock(labels, item.instructions);
    }
  }
}

function visitTerminal(labels: Labels, terminal: ReactiveTerminal): void {
  switch (terminal.kind) {
    case "break":
    case "continue": {
      if (terminal.label !== null) {
        labels.add(terminal.label);
      }
      break;
    }
    case "for": {
      visitBlock(labels, terminal.loop);
      break;
    }
    case "if": {
      visitBlock(labels, terminal.consequent);
      if (terminal.alternate !== null) {
        visitBlock(labels, terminal.alternate);
      }
      break;
    }
    case "return":
    case "throw": {
      break;
    }
    case "switch": {
      for (const case_ of terminal.cases) {
        visitBlock(labels, case_.block!);
      }
      break;
    }
    case "while": {
      visitBlock(labels, terminal.loop);
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
