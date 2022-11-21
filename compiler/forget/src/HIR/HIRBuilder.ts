/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import { assertExhaustive } from "../Common/utils";
import { invariant } from "../CompilerError";
import {
  BasicBlock,
  BlockId,
  GotoVariant,
  HIR,
  Identifier,
  IdentifierId,
  Instruction,
  makeBlockId,
  makeIdentifierId,
  makeInstructionId,
  Terminal,
} from "./HIR";
import { printInstruction } from "./PrintHIR";
import { eachTerminalSuccessor, mapTerminalSuccessors } from "./visitors";

// *******************************************************************************************
// *******************************************************************************************
// ************************************* Lowering to HIR *************************************
// *******************************************************************************************
// *******************************************************************************************

/**
 * A work-in-progress block that does not yet have a terminator
 */
export type WipBlock = { id: BlockId; instructions: Array<Instruction> };

type Scope = LoopScope | LabelScope | SwitchScope;

type LoopScope = {
  kind: "loop";
  label: string | null;
  continueBlock: BlockId;
  breakBlock: BlockId;
};

type SwitchScope = {
  kind: "switch";
  breakBlock: BlockId;
  label: string | null;
};

type LabelScope = {
  kind: "label";
  label: string;
  breakBlock: BlockId;
};

function newBlock(id: BlockId): WipBlock {
  return { id, instructions: [] };
}

export class Environment {
  #nextIdentifer: number = 0;

  get nextIdentifierId(): IdentifierId {
    return makeIdentifierId(this.#nextIdentifer++);
  }
}

/**
 * Helper class for constructing a CFG
 */
export default class HIRBuilder {
  #completed: Map<BlockId, BasicBlock> = new Map();
  #nextId: BlockId = makeBlockId(1);
  #current: WipBlock = newBlock(makeBlockId(0));
  #entry: BlockId = makeBlockId(0);
  #scopes: Array<Scope> = [];
  #bindings: Map<t.Identifier, Identifier> = new Map();
  #env: Environment;

  get nextIdentifierId() {
    return this.#env.nextIdentifierId;
  }

  constructor(env: Environment) {
    this.#env = env;
  }

  debug(): string {
    return JSON.stringify(
      {
        completed: this.#completed,
        current: this.#current,
        nextId: this.#nextId,
      },
      null,
      2
    );
  }

  /**
   * Push a statement or expression onto the current block
   */
  push(instruction: Instruction) {
    this.#current.instructions.push(instruction);
  }

  makeTemporary(): Identifier {
    const id = this.nextIdentifierId;
    return {
      preSsaId: null,
      id,
      name: null,
      mutableRange: { start: makeInstructionId(0), end: makeInstructionId(0) },
      scope: null,
    };
  }

  resolveIdentifier(node: t.Identifier): Identifier {
    let identifier = this.#bindings.get(node);
    if (identifier == null) {
      const id = this.nextIdentifierId;
      identifier = {
        preSsaId: null,
        id,
        name: node.name,
        mutableRange: {
          start: makeInstructionId(0),
          end: makeInstructionId(0),
        },
        scope: null,
      };
      this.#bindings.set(node, identifier);
    }
    return identifier;
  }

  /**
   * Construct a final CFG from this context
   */
  build(): HIR {
    const { id: blockId, instructions } = this.#current;
    this.#completed.set(blockId, {
      id: blockId,
      instructions,
      terminal: { kind: "return", value: null, id: makeInstructionId(0) },
      preds: new Set(),
      phis: new Set(),
    });
    // First reduce indirections and prune unreachable blocks
    let reduced = shrink({
      blocks: this.#completed,
      entry: this.#entry,
    });
    // then convert to reverse postorder
    const blocks = reversePostorderBlocks(reduced);
    markInstructionIds(blocks);
    markPredecessors(blocks);
    return blocks;
  }

  /**
   * Terminate the current block w the given terminal, and start a new block
   */
  terminate(terminal: Terminal) {
    const { id: blockId, instructions } = this.#current;
    this.#completed.set(blockId, {
      id: blockId,
      instructions,
      terminal,
      preds: new Set(),
      phis: new Set(),
    });
    const nextId = makeBlockId(this.#nextId++);
    this.#current = newBlock(nextId);
  }

  /**
   * Terminate the current block w the given terminal, and set the previously
   * reserved block as the new current block
   */
  terminateWithContinuation(terminal: Terminal, continuation: WipBlock) {
    const { id: blockId, instructions } = this.#current;
    this.#completed.set(blockId, {
      id: blockId,
      instructions,
      terminal,
      preds: new Set(),
      phis: new Set(),
    });
    this.#current = continuation;
  }

  /**
   * Reserve a block so that it can be referenced prior to construction.
   * Make this the current block with `terminateWithContinuation()` or
   * call `complete()` to save it without setting it as the current block.
   */
  reserve(): WipBlock {
    return newBlock(makeBlockId(this.#nextId++));
  }

  /**
   * Save a previously reserved block as completed
   */
  complete(block: WipBlock, terminal: Terminal) {
    const { id: blockId, instructions } = block;
    this.#completed.set(blockId, {
      id: blockId,
      instructions,
      terminal,
      preds: new Set(),
      phis: new Set(),
    });
  }

  /**
   * Create a new block and execute the provided callback with the new block
   * set as the current, resetting to the previously active block upon exit.
   * The lambda must return a terminal node, which is used to terminate the
   * newly constructed block.
   */
  enter(fn: (blockId: BlockId) => Terminal): BlockId {
    const current = this.#current;
    const nextId = makeBlockId(this.#nextId++);
    this.#current = newBlock(nextId);
    const terminal = fn(nextId);
    const { id: blockId, instructions } = this.#current;
    this.#completed.set(blockId, {
      id: blockId,
      instructions,
      terminal,
      preds: new Set(),
      phis: new Set(),
    });
    this.#current = current;
    return nextId;
  }

  label<T>(label: string, breakBlock: BlockId, fn: () => T): T {
    this.#scopes.push({
      kind: "label",
      breakBlock,
      label,
    });
    const value = fn();
    const last = this.#scopes.pop();
    invariant(
      last != null &&
        last.kind === "label" &&
        last.label === label &&
        last.breakBlock === breakBlock,
      "Mismatched label"
    );
    return value;
  }

  switch<T>(label: string | null, breakBlock: BlockId, fn: () => T): T {
    this.#scopes.push({
      kind: "switch",
      breakBlock,
      label,
    });
    const value = fn();
    const last = this.#scopes.pop();
    invariant(
      last != null &&
        last.kind === "switch" &&
        last.label === label &&
        last.breakBlock === breakBlock,
      "Mismatched label"
    );
    return value;
  }

  /**
   * Executes the provided lambda inside a scope in which the provided loop
   * information is cached for lookup with `lookupBreak()` and `lookupContinue()`
   */
  loop<T>(
    label: string | null,
    /**
     * block of the loop body. "continue" jumps here.
     */
    continueBlock: BlockId,
    /**
     * block following the loop. "break" jumps here.
     */
    breakBlock: BlockId,
    fn: () => T
  ): T {
    this.#scopes.push({
      kind: "loop",
      label,
      continueBlock,
      breakBlock,
    });
    const value = fn();
    const last = this.#scopes.pop();
    invariant(
      last != null &&
        last.kind === "loop" &&
        last.label === label &&
        last.continueBlock === continueBlock &&
        last.breakBlock === breakBlock,
      "Mismatched loops"
    );
    return value;
  }

  /**
   * Lookup the block target for a break statement, based on loops and switch statements
   * in scope. Throws if there is no available location to break.
   */
  lookupBreak(label: string | null): BlockId {
    for (let ii = this.#scopes.length - 1; ii >= 0; ii--) {
      const scope = this.#scopes[ii];
      if (label === null || label === scope.label) {
        return scope.breakBlock;
      }
    }
    invariant(false, "Expected a loop or switch to be in scope");
  }

  /**
   * Lookup the block target for a continue statement, based on loops
   * in scope. Throws if there is no available location to continue, or if the given
   * label does not correspond to a loop (this should also be validated at parse time).
   */
  lookupContinue(label: string | null): BlockId {
    for (let ii = this.#scopes.length - 1; ii >= 0; ii--) {
      const scope = this.#scopes[ii];
      if (scope.kind === "loop") {
        if (label === null || label === scope.label) {
          return scope.continueBlock;
        }
      } else if (label !== null && scope.label === label) {
        invariant(false, "Continue may only refer to a labeled loop");
      }
    }
    invariant(false, "Expected a loop to be in scope");
  }
}

/**
 * Helper to shrink a CFG to eliminate unreachable node and eliminate jump-only blocks.
 */
function shrink(func: HIR): HIR {
  const gotos = new Map();
  /**
   * Given a target block for some terminator, resolves the ideal block that should be
   * targeted instead. This transitively resolves any blocks that are simple indirections
   * (empty blocks that terminate in a goto).
   */
  function resolveBlockTarget(blockId: BlockId): BlockId {
    let target = gotos.get(blockId) ?? null;
    if (target !== null) {
      return target;
    }
    const block = func.blocks.get(blockId)!;
    target = getTargetIfIndirection(block);
    if (target !== null) {
      //  the target might also be a simple goto, recurse
      target = resolveBlockTarget(target) ?? target;
      gotos.set(blockId, target);
      return target;
    } else {
      //  If the block wasn't an indirection, return the original input.
      return blockId;
    }
  }

  const queue = [func.entry];
  const blocks: Map<BlockId, BasicBlock> = new Map();
  while (queue.length !== 0) {
    const blockId = queue.shift()!;
    if (blocks.has(blockId)) {
      continue;
    }
    const { instructions, terminal: prevTerminal } = func.blocks.get(blockId)!;
    const terminal = mapTerminalSuccessors(prevTerminal, (prevTarget) => {
      const target = resolveBlockTarget(prevTarget);
      queue.push(target);
      return target;
    });
    blocks.set(blockId, {
      id: blockId,
      instructions,
      terminal,
      preds: new Set(),
      phis: new Set(),
    });
  }

  // Cleanup any fallthrough blocks that weren't visited
  for (const block of blocks.values()) {
    if (
      block.terminal.kind === "if" ||
      block.terminal.kind === "switch" ||
      block.terminal.kind === "while"
    ) {
      if (
        block.terminal.fallthrough !== null &&
        !blocks.has(block.terminal.fallthrough)
      ) {
        block.terminal.fallthrough = null;
      }
    }
  }
  return { blocks, entry: func.entry };
}

/**
 * Converts the graph to reverse-postorder, with predecessor blocks appearing
 * before successors except in the case of back links (ie loops).
 */
function reversePostorderBlocks(func: HIR): HIR {
  const visited: Set<BlockId> = new Set();
  const postorder: Array<BlockId> = [];
  function visit(blockId: BlockId) {
    if (visited.has(blockId)) {
      return;
    }
    visited.add(blockId);
    const block = func.blocks.get(blockId)!;
    const { terminal } = block;

    /**
     * Note that we visit successors in reverse order. This ensures that when we
     * reverse the list at the end, that "sibling" edges appear in-order. For example,
     * ```
     * // bb0
     * let x;
     * if (c) {
     *   // bb1
     *   x = 1;
     * } else {
     *   // b2
     *   x = 2;
     * }
     * // bb3
     * x;
     * ```
     *
     * We want the output to be bb0, bb1, bb2, bb3 just to line up with the original
     * program order for visual debugging. By visiting the successors in reverse order
     * (eg bb2 then bb1), we ensure that they get reversed back to the correct order.
     */
    switch (terminal.kind) {
      case "return":
      case "throw": {
        // no-op, no successors
        break;
      }
      case "goto": {
        visit(terminal.block);
        break;
      }
      case "if": {
        // can ignore fallthrough, if its reachable it will be reached through
        // consequent/alternate
        const { consequent, alternate } = terminal;
        visit(alternate);
        visit(consequent);
        break;
      }
      case "switch": {
        // can ignore fallthrough, if its reachable it will be reached through
        // a case
        const { cases } = terminal;
        for (const case_ of [...cases].reverse()) {
          visit(case_.block);
        }
        break;
      }
      case "while": {
        visit(terminal.test);
        break;
      }
      default: {
        assertExhaustive(
          terminal,
          `Unexpected terminal kind '${(terminal as any).kind}'`
        );
      }
    }

    postorder.push(blockId);
  }
  visit(func.entry);

  const blocks = new Map();
  for (const blockId of postorder.reverse()) {
    blocks.set(blockId, func.blocks.get(blockId)!);
  }
  return {
    blocks,
    entry: func.entry,
  };
}

function markInstructionIds(func: HIR) {
  let id = 0;
  for (const [_, block] of func.blocks) {
    for (const instr of block.instructions) {
      invariant(instr.id === 0, `${printInstruction(instr)} already visited!`);
      instr.id = makeInstructionId(++id);
    }
    block.terminal.id = makeInstructionId(++id);
  }
}

function markPredecessors(func: HIR) {
  const visited: Set<BlockId> = new Set();
  function visit(blockId: BlockId, prevBlock: BasicBlock | null) {
    const block = func.blocks.get(blockId)!;
    if (prevBlock) {
      block.preds.add(prevBlock);
    }

    if (visited.has(blockId)) {
      return;
    }
    visited.add(blockId);

    const { terminal } = block;

    for (const successor of eachTerminalSuccessor(terminal)) {
      visit(successor, block);
    }
  }
  visit(func.entry, null);
}

/**
 * If the given block is a simple indirection — empty terminated with a goto(break) —
 * returns the block being pointed to. Otherwise returns null.
 */
function getTargetIfIndirection(block: BasicBlock): number | null {
  return block.instructions.length === 0 &&
    block.terminal.kind === "goto" &&
    block.terminal.variant === GotoVariant.Break
    ? block.terminal.block
    : null;
}
