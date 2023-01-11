/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ReactiveFunction } from "../HIR";

/**
 * Note: this is the 3rd of 3 passes that determine how to break a function into discrete
 * reactive scopes (independently memoizeable units of code):
 * 1. InferReactiveScopeVariables (on HIR) determines operands that mutate together and assigns
 *    them a unique reactive scope.
 * 2. AlignReactiveScopesToBlockScopes (on ReactiveFunction) aligns reactive scopes
 *    to block scopes.
 * 3. MergeOverlappingReactiveScopes (this pass, on ReactiveFunction) ensures that reactive
 *    scopes do not overlap, merging any such scopes.
 *
 * Previous passes may leave "overlapping" scopes, ie where one or more instructions are within
 * the mutable range of multiple reactive scopes. We prefer to avoid executing instructions twice
 * for performance reasons (side effects are less of a concern bc components are required to be
 * idempotent), so we cannot simply repeat the instruction once for each scope. Instead, the only
 * option is to combine the two scopes into one. This is an area where an eventual Forget IDE
 * could provide real-time feedback to the developer that two computations are accidentally merged.
 *
 * ## Detailed Walkthrough
 *
 * Two scopes overlap if there is one or more instruction that is inside the range
 * of both scopes. In general, overlapping scopes are merged togther. The only
 * exception to this is when one scope *shadows* another scope. For example:
 *
 * ```javascript
 * function foo(cond, a) {
 *                                 ⌵ scope for x
 *   let x = [];                   ⌝
 *   if (cond) {                   ⎮
 *                   ⌵ scope for y ⎮
 *     let y = [];   ⌝             ⎮
 *     if (b) {      ⎮             ⎮
 *       y.push(b);  ⌟             ⎮
 *     }                           ⎮
 *     x.push(<div>{y}</div>);     ⎮
 *   }                             ⌟
 * }
 * ```
 *
 * In this example the two scopes overlap, but mutation of the two scopes is not
 * interleaved. Specifically within the y scope there are no instructions that
 * modify any other scope: the inner scope "shadows" the outer one. This category
 * of overlap does *NOT* merge the scopes together.
 *
 * The implementation is inspired by the Rust notion of "stacked borrows". We traverse
 * the control-flow graph in tree form, at each point keeping track of which scopes are
 * active. So initially we see
 *
 * `let x = []`
 * active scopes: [x]
 *
 * and mark the x scope as active.
 *
 * Then we later encounter
 *
 * `let y = [];`
 * active scopes: [x, y]
 *
 * Here we first check to see if 'y' is already in the list of active scopes. It isn't,
 * so we push it to the stop of the stack.
 *
 * Then
 *
 * `y.push(b)`
 * active scopes: [x, y]
 *
 * Mutates y, so we check if y is the top of the stack. It is, so no merging must occur.
 *
 * If instead we saw eg
 *
 * `x.push(b)`
 * active scopes: [x, y]
 *
 * Then we would see that 'x' is active, but that it is shadowed. The two scopes would have
 * to be merged.
 */
export function mergeOverlappingReactiveScopes(fn: ReactiveFunction): void {}
