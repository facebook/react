/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BlockId,
  ReactiveFunction,
  ReactiveTerminal,
  ReactiveTerminalStatement,
} from "../HIR/HIR";
import { ReactiveFunctionVisitor, visitReactiveFunction } from "./visitors";

/**
 * Prunes terminal labels that are never explicitly jumped to.
 */
export function pruneUnusedLabels(fn: ReactiveFunction): void {
  const labels: Labels = new Set();
  visitReactiveFunction(fn, new Visitor(), labels);
}

type Labels = Set<BlockId>;

class Visitor extends ReactiveFunctionVisitor<Labels> {
  override visitTerminal(
    stmt: ReactiveTerminalStatement<ReactiveTerminal>,
    state: Labels
  ): void {
    this.traverseTerminal(stmt, state);
    const { terminal } = stmt;
    if (
      (terminal.kind === "break" || terminal.kind === "continue") &&
      terminal.label !== null
    ) {
      state.add(terminal.label);
    }
    if (stmt.label !== null && !state.has(stmt.label)) {
      stmt.label = null;
    }
  }
}
