/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { nullableSetEq } from "../Common/utils";
import type { CompilerContext } from "../CompilerContext";
import * as IR from "../IR";
import * as LIR from "../LIR";
import { PassKind, PassName } from "../Pass";

/**
 * MemoCache Allocation.
 *
 * This pass is responsible for allocating entries into {@link MemoCache}. Each
 * entry represents "a unit of computation" that Forget will memoize. This
 * includes React-ive inputs (props, states), intermediate values, and React-ive
 * outputs (React elements created via JSX).
 *
 * The smallest unit of computations that can be memoized (so-called the
 * "memoization boundary") is constrained by the smallest unit of program
 * constructs we collected during {@link DepGraphAnalysis}.
 *
 * The purpose of having this pass is to be able to fine-tune the memoCache
 * allocation to improve the perf characteristics coming from memoization.
 * Ideas include:
 * 1. Establish criterias on when memoization is considered a saving. Maybe
 *    sometimes it's cheaper (overall) not not memoize something, and we can
 *    control that by not allocating an entry for that.
 * 2. It's likely that many computations will share the exact same set of react
 *    func inputs. To help the code generator optimize the tree shape, we could
 *    use some help here?
 */
export default {
  name: PassName.MemoCacheAlloc,
  kind: PassKind.LIRFunc as const,
  run,
};

/**
 * Allocate memoCache for the given React @param func
 */
function run(
  lirFunc: LIR.Func,
  func: NodePath<t.Function>,
  context: CompilerContext
) {
  const irFunc = lirFunc.ir;

  // Allocating return value cache and return index registers.
  lirFunc.memoCache.allocRetVal();
  if (
    !context.opts.flags.singleReturnShortcut ||
    !lirFunc.hasSingleReturnPath
  ) {
    lirFunc.memoCache.allocRetIdx();
  }

  // Allocating entry for reactive vals.
  for (const bVal of irFunc.env.decls.values()) {
    if (IR.isReactiveVal(bVal)) {
      lirFunc.memoCache.allocReactive(bVal);
    }
  }

  // Allocating entry for block locals.
  for (const block of lirFunc.blocks) {
    if (!LIR.isReactiveBlock(block)) continue;

    for (const output of block.outputs) {
      if (IR.isBindingVal(output)) {
        lirFunc.memoCache.allocLocal(output);
      }
    }
  }

  // Allocating entry for JSX values.
  for (const irFuncTopLevel of irFunc.body) {
    irFuncTopLevel.jsxTreeRoots.forEach((rootVal) =>
      visitExprVal(rootVal, undefined)
    );
  }

  /**
   * This performs a pre-order traversal over the JSX tree to accompolish
   * memoCache allocations in an optimized manner: we only allocate an new
   * entry if the set of inputs of the subtree/leaves changed.
   *
   * @param parentInputs inputs from parent, undefined if inputs are none.
   */
  function visitExprVal(
    exprVal: IR.ExprVal,
    parentInputs: Set<IR.ReactiveVal> | undefined = undefined
  ) {
    // Prunning for unsafe JSX tag value
    if (IR.isJSXTagVal(exprVal) && exprVal.isUnsafeToMemo) return;

    const { inputs } = irFunc.depGraph.getOrCreateVertex(exprVal);
    const inputChanged = !nullableSetEq(inputs, parentInputs);
    if (inputChanged && !exprVal.stable) {
      lirFunc.memoCache.allocExpr(exprVal);
    }

    if (IR.isJSXTagVal(exprVal)) {
      exprVal.children.forEach((child) => visitExprVal(child, inputs));
    }
  }
}
