/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "../CompilerError";
import {
  BasicBlock,
  HIRFunction,
  Identifier,
  makeInstructionId,
  ReactiveScope,
} from "../HIR";
import { eachTerminalSuccessor } from "../HIR/visitors";
import {
  collectMutableOperands,
  mergeLocation,
} from "./InferReactiveScopeVariables";

export function memoizeExistingUseMemos(fn: HIRFunction): void {
  visitBlock(fn, fn.body.blocks.get(fn.body.entry)!, null, new Map());
}

let ctr = 0;
function nextId(): number {
  return ctr++;
}

type CurrentScope =
  | null
  | { kind: "pending"; id: number }
  | { kind: "available"; scope: ReactiveScope; id: number };

function visitBlock(
  fn: HIRFunction,
  block: BasicBlock,
  scope: CurrentScope,
  seen: Map<number, CurrentScope>
): void {
  const visited = seen.get(block.id);
  if (visited === undefined) {
    seen.set(block.id, scope);
  } else {
    CompilerError.invariant(
      visited === null ? scope === null : visited.id === scope?.id,
      {
        reason:
          "MemoizeExistingUseMemos: visiting the same block with different scopes",
        loc: null,
        suggestions: null,
      }
    );
    return;
  }

  function extend(
    currentScope: ReactiveScope,
    operands: Iterable<Identifier>
  ): void {
    for (const operand of operands) {
      currentScope.range.start = makeInstructionId(
        Math.min(currentScope.range.start, operand.mutableRange.start)
      );
      currentScope.range.end = makeInstructionId(
        Math.max(currentScope.range.end, operand.mutableRange.end)
      );
      currentScope.loc = mergeLocation(currentScope.loc, operand.loc);
      operand.scope = currentScope;
      operand.mutableRange = currentScope.range;
    }
  }

  let currentScope = scope;
  for (const instruction of block.instructions) {
    if (instruction.value.kind === "StartMemoize") {
      currentScope = { kind: "pending", id: nextId() };
    } else if (instruction.value.kind === "FinishMemoize") {
      currentScope = null;
    } else if (currentScope != null) {
      const operands = collectMutableOperands(fn, instruction, true);
      if (operands.length > 0) {
        if (currentScope.kind === "pending") {
          currentScope = {
            kind: "available",
            id: currentScope.id,
            scope: {
              id: fn.env.nextScopeId,
              range: { start: instruction.id, end: instruction.id },
              dependencies: new Set(),
              declarations: new Map(),
              reassignments: new Set(),
              earlyReturnValue: null,
              merged: new Set(),
              loc: instruction.loc,
              source: true,
            },
          };
        }
        extend(currentScope.scope, operands);
      }
    }
  }
  for (const successor of eachTerminalSuccessor(block.terminal)) {
    visitBlock(fn, fn.body.blocks.get(successor)!, currentScope, seen);
  }
}
