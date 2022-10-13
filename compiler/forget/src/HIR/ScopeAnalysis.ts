/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  HIRFunction,
  makeScopeId,
  ReactFunction,
  ReactiveScope,
  ScopeId,
} from "./HIR";

// import * as t from "@babel/types";

/**
 * Converts a function in standard HIR form into a reactive function, breaking down
 * the function's body to determine a set of minimal scopes which define computation
 * of sub-expressions in the input. A separate phase can then reconstruct an HIR
 * function given the reactive function using various heuristics for codegen.
 *
 * ## algorithm
 * We want to find minimal sets of instructions which build up values. This
 * involves determining which values "construct together". Values that construct
 * together derive from:
 * * mutable accesses that may capture one value into another:
 *   `x = y`, `foo(x, y)`
 *   The intuition is that because a mutable reference can be captured, we have
 *   to assume that further modifications of one value may affect the other and
 *   vice versa, so their construction must be grouped together.
 *
 * * constructing independent values across the same control flow path:
 *   `let x = ..., y = ...; if (cond) {x.a = ...; y.b = ...; }`
 *   The intuition here is that we don't want to repeat control-flow constructs,
 *   (esp loops) so values that are constructed across multiple basic blocks
 *   get grouped together.
 *
 * Once we've grouped values that "construct together", we can then create one
 * scope per group. we iterate back over the CFG, and for each instruction/terminal
 * we figure out which group that belongs to, based on the set of values its creating,
 * and push it onto the appropriate group's CFG.
 *
 * as an extra optimization to avoid creating scopes for primitives, we can try to
 * infer that instructions that produce primitives don't get their own scope.
 * so in `tmp1 = a * b; tmp2 = tmp1 * 3; tmp3 = tmp2 > 10`, we can say that tmp1/2/3
 * are all primitives, so they should be grouped together even though they don't
 * mutate together, and even though there's no control flow.
 *
 * we'll also need use-def analysis (or similar) to avoid reassignment of variables
 * causing overly large grouping of scopes. we really care about the *values* that
 * are being constructed together, not the variables. so `foo(x, y)` conjoins x and y,
 * but if we later `x = {}; x.a = 5`, that later assignment and modification should *not*
 * conjoin with `y`. for now, we accept that these cases will be treated as conjoined and
 * grouped together.
 */
export default function analyzeScopes(fn: HIRFunction): ReactFunction {
  // naive but trivially correct version
  const returnScopeId = makeScopeId(0);
  const scopes: Map<ScopeId, ReactiveScope> = new Map();
  scopes.set(returnScopeId, {
    inputs: new Set([...fn.params]),
    outputs: new Set(),
    instructions: fn.body,
  });
  return {
    path: fn.path,
    id: fn.id,
    params: fn.params,
    returnScope: returnScopeId,
    scopes,
  };
}

/**
 * ```javascript
 * function Component({items}) {
 *   const renderedItems = [];
 *   const seen = new Set();
 *   for (const item of items) {
 *     renderedItems.push(<div>{item}</div>);
 *     seen.add(item);
 *   }
 *   return <Child items={renderedItems} seen={seen} />;
 * }
 * ```
 * Iterate over the IR in tree order (similar to codegen) - single pass with recursion.
 * Build a stack of control points and mutable values, associate mutable values with
 * control points that occur between each other. control points also naturally group
 * together, ie for a continue within a loop.
 *
 *
 * Ideas toward an algorithm:
 * - Track the lifetime for which each variable (value, really) is mutable.
 * - Values with overlapping mutable lifetimes are conjoined ("memoize together").
 * - Keep a stack of mutated values which we can walk. But *also* store block terminals in this stack.
 *   When you walk back up the stack to find previous mutations of a value, add all the terminals
 *   along the way until finding it as dependencies. eg set.union(mutValue, terminal).
 *   Two values that mutate across the same control points will union with the same terminal,
 *   and get conjoined.
 *
 * Eg in the following, `renderedItems` and `seen` have overlapping mutable lifetimes:
 *
 * ```javascript
 * function Component({items, maxItems}) {
 *   const renderedItems = [];                                // new-mutable renderedItems
 *   const seen = new Set();                                  // new-mutable seen
 *   const max = Math.max(0, maxItems);                       // new-mutable max; read-frozen maxItems
 *   for (const item of items) {                              // read-frozen items; control point
 *     if (item == null || seen.has(item)) {                  // mutable seen; read-frozen item; control point
 *       continue;                                            // control point
 *     }
 *
 *     seen.add(item);                                        // mutable seen; read-frozen item
 *                                                            // finding prev `mut seen` hops the above control points
 *     renderedItems.push(<div>{item}</div>);                 // mutable renderedItems; read-frozen item
 *                                                            // finding prev `mut renderedItems` hops the above control points
 *     if (renderedItems.length >= max) {                     // read-frozen max; read-mutable renderedItems
 *       break;
 *     }
 *   }
 *   const count = renderedItems.length;                      // read-frozen renderedItems
 *   return <div><h1>{count} Items</h1>{renderedItems}</div>; // read-frozen renderedItems
 * }
 *
 * function Component({items, maxItems}) {
 *   // scope 0 (inputs: maxItems, outputs: max)
 *   const c_maxItems = ...;
 *   let max = c_max_items ? Math.max(0, maxItems) : ...;
 *   const c_max = ...;
 *
 *   // scope 1 (inputs: items, max, ouputs: renderedItems, seen, count)
 *   const c_items = ...;
 *   let renderedItems;
 *   let seen;
 *   let count;
 *   if (c_max || c_items) {
 *     renderedItems = ....;
 *     seen = ...;
 *     for (const item of items) {
 *       if (item == null || seen.has(item)) {                  // read-mutable seen; read-frozen item; control point
 *         continue;                                            // control point
 *       }
 *       seen.add(item);                                        // mut-mutable seen; read-frozen item
 *       renderedItems.push(<div>{item}</div>);                 // mut-mutable renderedItems; read-frozen item
 *       if (renderedItems.length >= max) {                     // read-frozen max; read-mutable renderedItems
 *         break;
 *       }
 *     }
 *     count = renderedItems.length;
 *   } else {
 *      // populate from cache
 *   }
 *
 *   // scope 2 (inputs: count, ouputs: div)
 *   const c_count = ...;
 *   let h1;
 *   if (c_count) {
 *     h1 = <h1>{count}</h1>
 *   } // else from cache
 *
 *   // scope 3 (inputs: h1, renderedItems, outputs: outer div)
 *   const c_h1 = ...;
 *   const c_renderedItems = ...;
 *   let ret;
 *   if (c_h1 || c_renderedItems) {
 *     ret = <div>{h1}{renderedItems}</div>; // read-frozen renderedItems
 *   } // else from cache
 *   return ret;
 * }
 * ```
 */

function analyze(fn: HIRFunction): ReactFunction {
  const returnScopeId = makeScopeId(0);
  const scopes: Map<ScopeId, ReactiveScope> = new Map();

  return {
    path: fn.path,
    id: fn.id,
    params: fn.params,
    returnScope: returnScopeId,
    scopes,
  };
}
