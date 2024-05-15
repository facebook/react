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
  MutableRange,
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
import { getPlaceScope } from "./BuildReactiveBlocks";

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
  const blockNodes = new Map<BlockId, BlockNode>();
  const rootNode: BlockNode = {
    kind: "node",
    valueRange: null,
    children: [],
    id: makeInstructionId(0),
  };
  blockNodes.set(fn.body.entry, rootNode);
  const seen = new Set<ReactiveScope>();
  const placeScopes = new Map<Place, ReactiveScope>();

  function recordPlace(id: InstructionId, place: Place, node: BlockNode): void {
    if (place.identifier.scope !== null) {
      placeScopes.set(place, place.identifier.scope);
    }

    const scope = getPlaceScope(id, place);
    if (scope == null) {
      return;
    }
    node.children.push({ kind: "scope", scope, id });

    if (seen.has(scope)) {
      return;
    }
    seen.add(scope);
    if (node.valueRange !== null) {
      scope.range.start = makeInstructionId(
        Math.min(node.valueRange.start, scope.range.start)
      );
      scope.range.end = makeInstructionId(
        Math.max(node.valueRange.end, scope.range.end)
      );
    }
  }

  for (const [, block] of fn.body.blocks) {
    const { instructions, terminal } = block;
    const node = blockNodes.get(block.id);
    if (node === undefined) {
      CompilerError.invariant(false, {
        reason: `Expected a node to be initialized for block`,
        loc: instructions[0]?.loc ?? terminal.loc,
        description: `No node for block bb${block.id} (${block.kind})`,
      });
    }

    for (const instr of instructions) {
      for (const lvalue of eachInstructionLValue(instr)) {
        recordPlace(instr.id, lvalue, node);
      }
      for (const operand of eachInstructionValueOperand(instr.value)) {
        recordPlace(instr.id, operand, node);
      }
    }
    for (const operand of eachTerminalOperand(terminal)) {
      recordPlace(terminal.id, operand, node);
    }

    // Save the current node for the fallback block, where this block scope continues
    const fallthrough = terminalFallthrough(terminal);
    if (fallthrough !== null && !blockNodes.has(fallthrough)) {
      /*
       * Any scopes that carried over across a terminal->fallback need their range extended
       * to at least the first instruction of the fallback
       *
       * Note that it's possible for a terminal such as an if or switch to have a null fallback,
       * indicating that all control-flow paths diverge instead of reaching the fallthrough.
       * In this case there isn't an instruction id in the program that we can point to for the
       * updated range. Since the output is correct in this case we leave it, but it would be
       * more correct to find the maximum instuction id in the whole program and set the range.end
       * to one greater. Alternatively, we could leave in an unreachable fallthrough (with a new
       * "unreachable" terminal variant, perhaps) and use that instruction id.
       */
      const fallthroughBlock = fn.body.blocks.get(fallthrough)!;
      const nextId =
        fallthroughBlock.instructions[0]?.id ?? fallthroughBlock.terminal.id;
      for (const child of node.children) {
        if (child.kind !== "scope") {
          continue;
        }
        const scope = child.scope;
        if (scope.range.end > terminal.id) {
          scope.range.end = makeInstructionId(
            Math.max(scope.range.end, nextId)
          );
        }
      }
      blockNodes.set(fallthrough, node);
    }

    /*
     * Visit all successors (not just direct successors for control-flow ordering) to
     * set a value block node where necessary to align the value block start/end
     * back to the outer block scope.
     *
     * TODO: add a variant of eachTerminalSuccessor() that visits _all_ successors, not
     * just those that are direct successors for normal control-flow ordering.
     */
    mapTerminalSuccessors(terminal, (successor) => {
      if (blockNodes.has(successor)) {
        return successor;
      }

      const successorBlock = fn.body.blocks.get(successor)!;
      /*
       * we need the block kind check here because the do..while terminal's successor
       * is a block, and try's successor is a catch block
       */
      if (successorBlock.kind === "block" || successorBlock.kind === "catch") {
        const childNode: BlockNode = {
          kind: "node",
          id: terminal.id,
          children: [],
          valueRange: null,
        };
        node.children.push(childNode);
        blockNodes.set(successor, childNode);
      } else if (
        node.valueRange === null ||
        terminal.kind === "ternary" ||
        terminal.kind === "logical" ||
        terminal.kind === "optional"
      ) {
        /**
         * Create a new scope node whenever we transition from block scope -> value scope.
         *
         * For compatibility with the previous ReactiveFunction-based scope merging logic,
         * we also create new scope nodes for ternary, logical, and optional terminals.
         * However, inside value blocks we always store a range (valueRange) that is the
         * start/end instruction ids at the nearest parent block scope level, so that
         * scopes inside the value blocks can be extended to align with block scope
         * instructions.
         */
        const childNode = {
          kind: "node",
          id: terminal.id,
          children: [],
          valueRange: null,
        } as BlockNode;
        if (node.valueRange === null) {
          // Transition from block->value scope, derive the outer block scope range
          CompilerError.invariant(fallthrough !== null, {
            reason: `Expected a fallthrough for value block`,
            loc: terminal.loc,
          });
          const fallthroughBlock = fn.body.blocks.get(fallthrough)!;
          const nextId =
            fallthroughBlock.instructions[0]?.id ??
            fallthroughBlock.terminal.id;
          childNode.valueRange = {
            start: terminal.id,
            end: nextId,
          };
        } else {
          // else value->value transition, reuse the range
          childNode.valueRange = node.valueRange;
        }
        node.children.push(childNode);
        blockNodes.set(successor, childNode);
      } else {
        // this is a value -> value block transition, reuse the node
        blockNodes.set(successor, node);
      }
      return successor;
    });
  }

  // console.log(_debug(rootNode));
}

type BlockNode = {
  kind: "node";
  id: InstructionId;
  valueRange: MutableRange | null;
  children: Array<BlockNode | ReactiveScopeNode>;
};
type ReactiveScopeNode = {
  kind: "scope";
  id: InstructionId;
  scope: ReactiveScope;
};

function _debug(node: BlockNode): string {
  const buf: Array<string> = [];
  _printNode(node, buf, 0);
  return buf.join("\n");
}
function _printNode(
  node: BlockNode | ReactiveScopeNode,
  out: Array<string>,
  depth: number = 0
): void {
  let prefix = "  ".repeat(depth);
  if (node.kind === "scope") {
    out.push(
      `${prefix}[${node.id}] @${node.scope.id} [${node.scope.range.start}:${node.scope.range.end}]`
    );
  } else {
    let range =
      node.valueRange !== null
        ? ` [${node.valueRange.start}:${node.valueRange.end}]`
        : "";
    out.push(`${prefix}[${node.id}] node${range} [`);
    for (const child of node.children) {
      _printNode(child, out, depth + 1);
    }
    out.push(`${prefix}]`);
  }
}
