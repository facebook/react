/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { visitReactiveFunction } from ".";
import { CompilerError } from "..";
import {
  ReactiveFunction,
  ReactiveScopeBlock,
  ReactiveTerminalStatement,
} from "../HIR";
import { ReactiveFunctionVisitor } from "./visitors";

/**
 * TODO: Actualy propagate early return information, for now we throw a Todo bailout.
 *
 * This pass ensures that reactive blocks honor the control flow behavior of the
 * original code including early return semantics. Specifically, if a reactive
 * scope early returned during the previous execution and the inputs to that block
 * have not changed, then the code should early return (with the same value) again.
 *
 * Example:
 *
 * ```javascript
 * let x = [];
 * if (props.cond) {
 *   x.push(12);
 *   return x;
 * } else {
 *   return foo();
 * }
 * ```
 *
 * Imagine that this code is called twice in a row with props.cond = true. Both
 * times it should return the same object (===), an array `[12]`.
 *
 * The compilation strategy is as follows. For each top-level reactive scope
 * that contains (transitively) an early return:
 *
 * - Label the scope
 * - Synthesize a new temporary, eg `t0`, and set it as a declaration of the scope.
 *   This will represent the possibly-unset return value for that scope.
 * - Make the first instruction of the scope a reassignment of that temporary,
 *   assigning a sentinel value (can reuse the same symbol as we use for cache slots).
 *   This assignment ensures that if we don't take an early return, that the value
 *   is the sentinel.
 * - Replace all `return` statements with:
 *   - An assignment of the temporary with the value being returned.
 *   - An assignment of the temporary into a cache slot, so it can be retrieved in the
 *     scope's "else" branch.
 *   - A `break` to the reactive scope's label.
 * - Finally, add code _after_ the reactive scope that checks the temporary. If
 *   it equals the sentinel value do nothing; else return its value.
 *
 * For the above example that looks roughly like:
 *
 * ```javascript
 * let t0; // temporary for early return;
 * bb1: if (props.cond !== $[0]) {
 *   // reset the temporary
 *   t0 = Symbol.for('react.forget');
 *   // original code
 *   let x = [];
 *   if (props.cond) {
 *     x.push(12);
 *     // replace the early return w assignment and break
 *     t0 = x;
 *     $[2] = t0;
 *     break bb1
 *   } else {
 *     let t1;
 *     if ($[1] === Symbol.for('react.forget')) {
 *       t1 = foo();
 *       $[1] = t1;
 *     } else {
 *       t1 = $[1];
 *     }
 *     // Replace early return w assignment and break;
 *     t0 = t1;
 *     $[2] = t0;
 *     break bb1;
 *   }
 * } else {
 *   t0 = $[2];
 * }
 * if (t0 !== Symbol.for('react.forget')) {
 *   return t0;
 * }
 * ```
 */
export function propagateEarlyReturns(fn: ReactiveFunction): void {
  visitReactiveFunction(fn, new Visitor(), false);
}

class Visitor extends ReactiveFunctionVisitor<boolean> {
  override visitScope(
    scopeBlock: ReactiveScopeBlock,
    _withinReactiveScope: boolean
  ): void {
    this.traverseScope(scopeBlock, true);
  }

  override visitTerminal(
    stmt: ReactiveTerminalStatement,
    withinReactiveScope: boolean
  ): void {
    if (withinReactiveScope && stmt.terminal.kind === "return") {
      CompilerError.throwTodo({
        reason: `Support early return within a reactive scope`,
        loc: stmt.terminal.value.loc,
        description: null,
        suggestions: null,
      });
    }
    this.traverseTerminal(stmt, withinReactiveScope);
  }
}
