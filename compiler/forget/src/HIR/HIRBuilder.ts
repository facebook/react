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
  HIR,
  Identifier,
  IdentifierId,
  Instruction,
  makeBlockId,
  makeIdentifierId,
  Terminal,
} from "./HIR";

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

/**
 * Helper class for constructing a CFG
 */
export default class HIRBuilder {
  #completed: Map<BlockId, BasicBlock> = new Map();
  #nextId: BlockId = makeBlockId(1);
  #current: WipBlock = newBlock(makeBlockId(0));
  #entry: BlockId = makeBlockId(0);
  #scopes: Array<Scope> = [];
  #nextIdentifier: IdentifierId = makeIdentifierId(0);
  #bindings: Map<t.Identifier, Identifier> = new Map();

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
    const id = makeIdentifierId(this.#nextIdentifier++);
    return {
      id,
      name: null,
    };
  }

  resolveIdentifier(node: t.Identifier): Identifier {
    let identifier = this.#bindings.get(node);
    if (identifier == null) {
      const id = makeIdentifierId(this.#nextIdentifier++);
      identifier = { id, name: node.name };
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
      instructions,
      terminal: { kind: "return", value: null },
    });
    return shrink({
      blocks: this.#completed,
      entry: this.#entry,
    });
  }

  /**
   * Terminate the current block w the given terminal, and start a new block
   */
  terminate(terminal: Terminal) {
    const { id: blockId, instructions } = this.#current;
    this.#completed.set(blockId, {
      instructions,
      terminal,
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
      instructions,
      terminal,
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
    this.#completed.set(blockId, { instructions, terminal });
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
    this.#completed.set(blockId, { instructions, terminal });
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

  /**
   * Fixpoint iteration to explore all blocks reachable from the entry block,
   * and to resolve their terminator targets to avoid indirections.
   * This implicitly prunes unreachable blocks since they are never visited and
   * therefore not added to the output.
   */
  const queue = [func.entry];
  //  new set of output blocks
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
      instructions,
      terminal,
    });
  }

  for (const block of blocks.values()) {
    if (block.terminal.kind === "if" || block.terminal.kind === "switch") {
      if (
        block.terminal.fallthrough !== null &&
        !blocks.has(block.terminal.fallthrough)
      ) {
        block.terminal.fallthrough = null;
      }
    }
  }

  return {
    blocks,
    entry: func.entry,
  };
}

/**
 * If the given block is a simple indirection (empty terminated with a goto),
 * returns the block being pointed to. Otherwise returns null
 */
function getTargetIfIndirection(block: BasicBlock): number | null {
  return block.instructions.length === 0 && block.terminal.kind === "goto"
    ? block.terminal.block
    : null;
}

/**
 * Maps a terminal node's block assignments using the provided function.
 */
export function mapTerminalSuccessors(
  terminal: Terminal,
  fn: (block: BlockId, isFallthrough: boolean) => BlockId
): Terminal {
  switch (terminal.kind) {
    case "goto": {
      const target = fn(terminal.block, false);
      return {
        kind: "goto",
        block: target,
      };
    }
    case "if": {
      const consequent = fn(terminal.consequent, false);
      const alternate = fn(terminal.alternate, false);
      const fallthrough =
        terminal.fallthrough !== null ? fn(terminal.fallthrough, true) : null;
      return {
        kind: "if",
        test: terminal.test,
        consequent,
        alternate,
        fallthrough,
      };
    }
    case "switch": {
      const cases = terminal.cases.map((case_) => {
        const target = fn(case_.block, false);
        return {
          test: case_.test,
          block: target,
        };
      });
      const fallthrough =
        terminal.fallthrough !== null ? fn(terminal.fallthrough, true) : null;
      return {
        kind: "switch",
        test: terminal.test,
        cases,
        fallthrough,
      };
    }
    case "return": {
      return {
        kind: "return",
        value: terminal.value,
      };
    }
    case "throw": {
      return terminal;
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind '${(terminal as any as Terminal).kind}'`
      );
    }
  }
}
