/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BlockId,
  ReactiveFunction,
  ReactiveStatement,
  ReactiveTerminalStatement,
} from "../HIR/HIR";
import {
  ReactiveFunctionTransform,
  Transformed,
  visitReactiveFunction,
} from "./visitors";

/**
 * Flattens labeled terminals where the label is not reachable, and
 * nulls out labels for other terminals where the label is unused.
 */
export function pruneUnusedLabels(fn: ReactiveFunction): void {
  const labels: Labels = new Set();
  visitReactiveFunction(fn, new Transform(), labels);
}

type Labels = Set<BlockId>;

class Transform extends ReactiveFunctionTransform<Labels> {
  override transformTerminal(
    stmt: ReactiveTerminalStatement,
    state: Labels
  ): Transformed<ReactiveStatement> {
    this.traverseTerminal(stmt, state);
    const { terminal } = stmt;
    if (
      (terminal.kind === "break" || terminal.kind === "continue") &&
      terminal.label !== null
    ) {
      state.add(terminal.label);
    }
    // Is this terminal reachable via a break/continue to its label?
    const isReachableLabel = stmt.label !== null && state.has(stmt.label);
    if (stmt.terminal.kind === "label" && !isReachableLabel) {
      // Flatten labeled terminals where the label isn't necessary
      return { kind: "replace-many", value: stmt.terminal.block };
    } else {
      if (!isReachableLabel) {
        stmt.label = null;
      }
      return { kind: "keep" };
    }
  }
}
