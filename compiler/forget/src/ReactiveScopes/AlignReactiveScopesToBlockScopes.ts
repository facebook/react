/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ReactiveFunction } from "../HIR/HIR";

/**
 * Note: this is the 2nd of 3 passes that determine how to break a function into discrete
 * reactive scopes (independently memoizeable units of code):
 * 1. InferReactiveScopeVariables (on HIR) determines operands that mutate together and assigns
 *    them a unique reactive scope.
 * 2. AlignReactiveScopesToBlockScopes (this pass, on ReactiveFunction) aligns reactive scopes
 *    to block scopes.
 * 3. MergeOverlappingReactiveScopes (on ReactiveFunction) ensures that reactive scopes do not
 *    overlap, merging any such scopes.
 *
 * Prior inference passes assign a reactive scope to each operand, but the ranges of these
 * scopes are based on specific instructions at arbitrary points in the control-flow graph.
 * However, to codegen blocks around the instructions in each scope, the scopes must be
 * aligned to block-scope boundaries - we can't memoize half of a loop!
 *
 * This pass updates reactive scope boundaries to align to control flow boundaries, for
 * example:
 *
 * ```javascript
 * function foo(cond, a) {
 *                    ⌵ original scope
 *                         ⌵ expanded scope
 *   const x = [];    ⌝    ⌝
 *   if (cond) {      ⎮    ⎮
 *     ...            ⎮    ⎮
 *     x.push(a);     ⌟    ⎮
 *     ...                 ⎮
 *   }                     ⌟
 * }
 * ```
 *
 * Here the original scope for `x` ended partway through the if consequent, but we can't
 * memoize part of that block. This pass would align the scope to the end of the consequent.
 *
 * The more general rule is that a reactive scope may only end at the same block scope as it
 * began: this pass therefore finds, for each scope, the block where that scope started and
 * finds the first instruction after the scope's mutable range in that same block scope (which
 * will be the updated end for that scope).
 */

export function alignReactiveScopesToBlockScopes(fn: ReactiveFunction): void {}
