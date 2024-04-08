/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "..";
import {
  BlockId,
  HIRFunction,
  InstructionId,
  Place,
  ReactiveScope,
  makeInstructionId,
} from "../HIR/HIR";
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
  mapTerminalSuccessors,
  terminalFallthrough,
} from "../HIR/visitors";
import { retainWhere } from "../Utils/utils";

/*
 * Note: this is the 2nd of 4 passes that determine how to break a function into discrete
 * reactive scopes (independently memoizeable units of code):
 * 1. InferReactiveScopeVariables (on HIR) determines operands that mutate together and assigns
 *     them a unique reactive scope.
 * 2. AlignReactiveScopesToBlockScopes (this pass, on ReactiveFunction) aligns reactive scopes
 *     to block scopes.
 * 3. MergeOverlappingReactiveScopes (on ReactiveFunction) ensures that reactive scopes do not
 *     overlap, merging any such scopes.
 * 4. BuildReactiveBlocks (on ReactiveFunction) groups the statements for each scope into
 *     a ReactiveScopeBlock.
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
 *                     ⌵ original scope
 *                          ⌵ expanded scope
 *    const x = [];    ⌝    ⌝
 *    if (cond) {      ⎮    ⎮
 *      ...            ⎮    ⎮
 *      x.push(a);     ⌟    ⎮
 *      ...                 ⎮
 *    }                     ⌟
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

export function alignReactiveScopesToBlockScopesHIR(fn: HIRFunction): void {
  type BlockContext =
    | { kind: "block"; block: BlockId; scopes: Array<ReactiveScope> }
    | {
        kind: "value";
        start: InstructionId;
        end: InstructionId;
        scopes: Array<ReactiveScope>;
      };
  const blockContexts = new Map<BlockId, BlockContext>();
  const seen = new Set<ReactiveScope>();

  function recordPlace(place: Place, context: BlockContext): void {
    const scope = place.identifier.scope;
    if (scope == null) {
      return;
    }

    if (seen.has(scope)) {
      return;
    }
    if (context.kind === "value") {
      scope.range.start = makeInstructionId(
        Math.min(context.start, scope.range.start)
      );
      scope.range.end = makeInstructionId(
        Math.max(context.end, scope.range.end)
      );
    }
    seen.add(scope);
    context.scopes.push(scope);
  }

  for (const [, block] of fn.body.blocks) {
    const { instructions, terminal } = block;
    let context = blockContexts.get(block.id);
    if (context === undefined) {
      if (block.kind === "block" || block.kind === "catch") {
        context = { kind: "block", block: block.id, scopes: [] };
      } else {
        CompilerError.invariant(false, {
          reason: `Expected a context to be initialized for value block`,
          loc: instructions[0]?.loc ?? terminal.loc,
          description: `No value for block bb${block.id}`,
        });
      }
    } else if (block.kind === "block" && context.kind !== "block") {
      CompilerError.invariant(false, {
        reason: `Expected a block context for block`,
        loc: instructions[0]?.loc ?? terminal.loc,
        description: `Got value block for bb${block.id}`,
      });
    }

    /*
     * Any scopes that carried over across a terminal->fallback need their range extended
     * to at least the first instruction of the fallback
     */
    const startId = instructions.at(0)?.id ?? terminal.id;
    for (const scope of context.scopes) {
      scope.range.end = makeInstructionId(Math.max(scope.range.end, startId));
    }

    /*
     * Visit instructions, pruning scopes that end and recording new scopes that appear
     * on operands
     */
    for (const instr of instructions) {
      retainWhere(context.scopes, (scope) => scope.range.end > instr.id);
      for (const lvalue of eachInstructionLValue(instr)) {
        recordPlace(lvalue, context);
      }
      for (const operand of eachInstructionValueOperand(instr.value)) {
        recordPlace(operand, context);
      }
    }

    // Close scopes that complete at the terminal, and visit scopes of operands
    retainWhere(context.scopes, (scope) => scope.range.end > terminal.id);
    for (const operand of eachTerminalOperand(terminal)) {
      recordPlace(operand, context);
    }

    // Save the current context for the fallback block, where this block scope continues
    const fallthrough = terminalFallthrough(terminal);
    if (fallthrough !== null && !blockContexts.has(fallthrough)) {
      blockContexts.set(fallthrough, context);
    }

    /*
     * Visit all successors (not just direct successors for control-flow ordering) to
     * set a value block context where necessary to align the value block start/end
     * back to the outer block scope.
     *
     * TODO: add a variant of eachTerminalSuccessor() that visits _all_ successors, not
     * just those that are direct successors for normal control-flow ordering.
     */
    mapTerminalSuccessors(terminal, (successor) => {
      const successorBlock = fn.body.blocks.get(successor)!;
      /*
       * we need the block kind check here because the do..while terminal's successor
       * is a block, and try's successor is a catch block
       */
      if (
        !blockContexts.has(successor) &&
        successorBlock.kind !== "block" &&
        successorBlock.kind !== "catch"
      ) {
        let valueContext: BlockContext;
        if (context!.kind === "value") {
          valueContext = context!;
        } else {
          CompilerError.invariant(fallthrough !== null, {
            reason: `Expected a fallthrough for value block`,
            loc: terminal.loc,
          });
          const fallthroughBlock = fn.body.blocks.get(fallthrough)!;
          const nextId =
            fallthroughBlock.instructions[0]?.id ??
            fallthroughBlock.terminal.id;
          valueContext = {
            kind: "value",
            start: terminal.id,
            end: nextId,
            scopes: [],
          } as BlockContext;
        }
        blockContexts.set(successor, valueContext);
      }
      return successor;
    });
  }
}
