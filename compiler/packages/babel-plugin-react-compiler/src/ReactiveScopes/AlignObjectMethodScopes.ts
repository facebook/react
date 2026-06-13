/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, ReactiveScope, makeInstructionId} from '../HIR';
import DisjointSet from '../Utils/DisjointSet';

/**
 * Align scopes of object method values to that of their enclosing object expressions.
 * To produce a well-formed JS program in Codegen, object methods and object expressions
 * must be in the same ReactiveBlock as object method definitions must be inlined.
 *
 * Note: ObjectMethod nodes are now lowered to FunctionExpression nodes in BuildHIR,
 * so they receive per-function reactive scopes automatically. This pass is retained
 * as a no-op for forward compatibility.
 */

function findScopesToMerge(_fn: HIRFunction): DisjointSet<ReactiveScope> {
  /*
   * ObjectMethod nodes are now lowered to FunctionExpression during HIR
   * construction (see BuildHIR.ts lowerObjectMethod). Each function expression
   * receives its own reactive scope, so no scope merging is needed here.
   */
  return new DisjointSet<ReactiveScope>();
}

export function alignObjectMethodScopes(fn: HIRFunction): void {
  // Handle inner functions: we assume that Scopes are disjoint across functions
  for (const [_, block] of fn.body.blocks) {
    for (const {value} of block.instructions) {
      if (value.kind === 'FunctionExpression') {
        alignObjectMethodScopes(value.loweredFunc.func);
      }
    }
  }

  const scopeGroupsMap = findScopesToMerge(fn).canonicalize();
  /**
   * Step 1: Merge affected scopes to their canonical root.
   */
  for (const [scope, root] of scopeGroupsMap) {
    if (scope !== root) {
      root.range.start = makeInstructionId(
        Math.min(scope.range.start, root.range.start),
      );
      root.range.end = makeInstructionId(
        Math.max(scope.range.end, root.range.end),
      );
    }
  }

  /**
   * Step 2: Repoint identifiers whose scopes were merged.
   */
  for (const [_, block] of fn.body.blocks) {
    for (const {
      lvalue: {identifier},
    } of block.instructions) {
      if (identifier.scope != null) {
        const root = scopeGroupsMap.get(identifier.scope);
        if (root != null) {
          identifier.scope = root;
        }
        // otherwise, this identifier's scope was not affected by this pass
      }
    }
  }
}
