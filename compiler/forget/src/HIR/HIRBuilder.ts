/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import invariant from "invariant";
import { CompilerError } from "../CompilerError";
import { logHIR } from "../Utils/logger";
import { assertExhaustive } from "../Utils/utils";
import { Environment } from "./Environment";
import { Global } from "./Globals";
import {
  BasicBlock,
  BlockId,
  BlockKind,
  GeneratedSource,
  GotoVariant,
  HIR,
  Identifier,
  IdentifierId,
  Instruction,
  makeBlockId,
  makeInstructionId,
  makeType,
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
export type WipBlock = {
  id: BlockId;
  instructions: Array<Instruction>;
  kind: BlockKind;
};

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

function newBlock(id: BlockId, kind: BlockKind): WipBlock {
  return { id, kind, instructions: [] };
}

export type Bindings = Map<
  string,
  { node: t.Identifier; identifier: Identifier }
>;

/**
 * Helper class for constructing a CFG
 */
export default class HIRBuilder {
  #completed: Map<BlockId, BasicBlock> = new Map();
  #current: WipBlock;
  #entry: BlockId;
  #scopes: Array<Scope> = [];
  #context: t.Identifier[];
  #bindings: Bindings;
  #env: Environment;
  parentFunction: NodePath<t.Function>;
  errors: CompilerError = new CompilerError();

  get nextIdentifierId(): IdentifierId {
    return this.#env.nextIdentifierId;
  }

  get context(): t.Identifier[] {
    return this.#context;
  }

  get bindings(): Bindings {
    return this.#bindings;
  }

  get environment(): Environment {
    return this.#env;
  }

  constructor(
    env: Environment,
    parentFunction: NodePath<t.Function>, // the outermost function being compiled
    bindings: Bindings | null = null,
    context: t.Identifier[] | null = null
  ) {
    this.#env = env;
    this.#bindings = bindings ?? new Map();
    this.parentFunction = parentFunction;
    this.#context = context ?? [];
    this.#entry = makeBlockId(env.nextBlockId);
    this.#current = newBlock(this.#entry, "block");
  }

  currentBlockKind(): BlockKind {
    return this.#current.kind;
  }

  /**
   * Push a statement or expression onto the current block
   */
  push(instruction: Instruction): void {
    this.#current.instructions.push(instruction);
  }

  makeTemporary(): Identifier {
    const id = this.nextIdentifierId;
    return {
      id,
      name: null,
      mutableRange: { start: makeInstructionId(0), end: makeInstructionId(0) },
      scope: null,
      type: makeType(),
    };
  }

  resolveGlobal(
    path: NodePath<t.Identifier | t.JSXIdentifier>
  ): (Global & { name: string }) | null {
    const name = path.node.name;
    const resolvedGlobal = this.#env.getGlobalDeclaration(name);
    if (resolvedGlobal) {
      return {
        ...resolvedGlobal,
        name,
      };
    } else {
      // if env records no global with the given name, load it as an unknown type
      return {
        kind: "Poly",
        name,
      };
    }
  }

  /**
   * Maps an Identifier (or JSX identifier) Babel node to an internal `Identifier`
   * which represents the variable being referenced, according to the JS scoping rules.
   *
   * Because Forget does not preserve _all_ block scopes in the input (only those that
   * happen to occur from control flow), this resolution ensures that different variables
   * with the same name are mapped to a unique name. Concretely, this function maintains
   * the invariant that all references to a given variable will return an `Identifier`
   * with the same (unique for the function) `name` and `id`.
   *
   * Example:
   *
   * ```javascript
   * function foo() {
   *   const x = 0;
   *   {
   *     const x = 1;
   *   }
   *   return x;
   * }
   * ```
   *
   * The above converts as follows:
   *
   * ```
   * Const Identifier { name: 'x', id: 0 } = Primitive { value: 0 };
   * Const Identifier { name: 'x_0', id: 1 } = Primitive { value: 1 };
   * Return Identifier { name: 'x', id: 0};
   * ```
   */
  resolveIdentifier(
    path: NodePath<t.Identifier | t.JSXIdentifier>
  ): Identifier | null {
    const originalName = path.node.name;
    const binding = path.scope.getBinding(originalName);
    if (binding == null) {
      return null;
    }
    // If the binding is from the parent function's outer scope, then
    // we treat it equivalently to a global.
    //
    // TODO: remove the exception that resolves references to the
    // parent function itself. We don't need to support self-recursion,
    // so we can treat such references as globals.
    const outerBinding =
      this.parentFunction.scope.parent.getBinding(originalName);
    if (binding === outerBinding) {
      const func = this.parentFunction;
      const isParentFunctionReference =
        func.isFunctionDeclaration() &&
        func.get("id").node != null &&
        func.get("id").node!.name === originalName;
      if (!isParentFunctionReference) {
        return null;
      }
    }

    const resolvedBinding = this.resolveBinding(binding.identifier);
    if (resolvedBinding.name && resolvedBinding.name !== originalName) {
      binding.scope.rename(originalName, resolvedBinding.name);
    }
    return resolvedBinding;
  }

  resolveBinding(node: t.Identifier): Identifier {
    const originalName = node.name;
    let name = originalName;
    let index = 0;
    while (true) {
      const mapping = this.#bindings.get(name);
      if (mapping === undefined) {
        const id = this.nextIdentifierId;
        const identifier: Identifier = {
          id,
          name,
          mutableRange: {
            start: makeInstructionId(0),
            end: makeInstructionId(0),
          },
          scope: null,
          type: makeType(),
        };
        this.#bindings.set(name, { node, identifier });
        return identifier;
      } else if (mapping.node === node) {
        return mapping.identifier;
      } else {
        name = `${originalName}_${index++}`;
      }
    }
  }

  /**
   * Construct a final CFG from this context
   */
  build(): HIR {
    this.terminate(
      {
        kind: "return",
        loc: GeneratedSource,
        value: null,
        id: makeInstructionId(0),
      },
      null
    );
    let ir: HIR = {
      blocks: this.#completed,
      entry: this.#entry,
    };
    logHIR("Build (pre-shrink)", ir);
    // First reduce indirections
    shrink(ir);
    logHIR("Build (shrunk)", ir);
    // then convert to reverse postorder
    reversePostorderBlocks(ir);
    removeUnreachableForUpdates(ir);
    removeUnreachableFallthroughs(ir);
    removeDeadDoWhileStatements(ir);
    markInstructionIds(ir);
    markPredecessors(ir);

    return ir;
  }

  /**
   * Terminate the current block w the given terminal, and start a new block
   */
  terminate(terminal: Terminal, nextBlockKind: BlockKind | null): void {
    const { id: blockId, kind, instructions } = this.#current;
    this.#completed.set(blockId, {
      kind,
      id: blockId,
      instructions,
      terminal,
      preds: new Set(),
      phis: new Set(),
    });
    if (nextBlockKind) {
      const nextId = this.#env.nextBlockId;
      this.#current = newBlock(nextId, nextBlockKind);
    }
  }

  /**
   * Terminate the current block w the given terminal, and set the previously
   * reserved block as the new current block
   */
  terminateWithContinuation(terminal: Terminal, continuation: WipBlock): void {
    const { id: blockId, kind, instructions } = this.#current;
    this.#completed.set(blockId, {
      kind: kind,
      id: blockId,
      instructions,
      terminal: terminal,
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
  reserve(kind: BlockKind): WipBlock {
    return newBlock(makeBlockId(this.#env.nextBlockId), kind);
  }

  /**
   * Save a previously reserved block as completed
   */
  complete(block: WipBlock, terminal: Terminal): void {
    const { id: blockId, kind, instructions } = block;
    this.#completed.set(blockId, {
      kind,
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
  enter(nextBlockKind: BlockKind, fn: (blockId: BlockId) => Terminal): BlockId {
    const current = this.#current;
    const nextId = this.#env.nextBlockId;
    this.#current = newBlock(nextId, nextBlockKind);
    const terminal = fn(nextId);
    const { id: blockId, kind, instructions } = this.#current;
    this.#completed.set(blockId, {
      kind,
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
 * Helper to shrink a CFG eliminate jump-only blocks.
 */
export function shrink(func: HIR): void {
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
    const block = func.blocks.get(blockId);
    invariant(block != null, "expected block %s to exist", blockId);
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
  const reachable = new Set<BlockId>();
  while (queue.length !== 0) {
    const blockId = queue.shift()!;
    if (reachable.has(blockId)) {
      continue;
    }
    reachable.add(blockId);
    const block = func.blocks.get(blockId)!;
    block.terminal = mapTerminalSuccessors(block.terminal, (prevTarget) => {
      const target = resolveBlockTarget(prevTarget);
      queue.push(target);
      return target;
    });
  }
  for (const [blockId] of func.blocks) {
    if (!reachable.has(blockId)) {
      func.blocks.delete(blockId);
    }
  }
}

export function removeUnreachableForUpdates(fn: HIR): void {
  for (const [, block] of fn.blocks) {
    if (
      block.terminal.kind === "for" &&
      block.terminal.update !== null &&
      !fn.blocks.has(block.terminal.update)
    ) {
      block.terminal.update = null;
    }
  }
}

export function removeUnreachableFallthroughs(func: HIR): void {
  const visited: Set<BlockId> = new Set();
  for (const [_, block] of func.blocks) {
    visited.add(block.id);
  }

  // Cleanup any fallthrough blocks that weren't visited
  for (const [_, block] of func.blocks) {
    if (
      block.terminal.kind === "if" ||
      block.terminal.kind === "switch" ||
      block.terminal.kind === "while" ||
      block.terminal.kind === "label"
    ) {
      if (
        block.terminal.fallthrough !== null &&
        !visited.has(block.terminal.fallthrough)
      ) {
        block.terminal.fallthrough = null;
      }
    }
  }
}

export function removeDeadDoWhileStatements(func: HIR): void {
  const visited: Set<BlockId> = new Set();
  for (const [_, block] of func.blocks) {
    visited.add(block.id);
  }

  // If the test condition of a DoWhile is unreachable, the terminal is effectively deadcode and we
  // can just inline the loop body. We replace the terminal with a goto to the loop block and
  // MergeConsecutiveBlocks figures out how to merge as appropriate.
  for (const [_, block] of func.blocks) {
    if (block.terminal.kind === "do-while") {
      if (!visited.has(block.terminal.test)) {
        block.terminal = {
          kind: "goto",
          block: block.terminal.loop,
          variant: GotoVariant.Break,
          id: block.terminal.id,
          loc: block.terminal.loc,
        };
      }
    }
  }
}

/**
 * Converts the graph to reverse-postorder, with predecessor blocks appearing
 * before successors except in the case of back links (ie loops).
 */
export function reversePostorderBlocks(func: HIR): void {
  const visited: Set<BlockId> = new Set();
  const postorder: Array<BlockId> = [];
  function visit(blockId: BlockId): void {
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
      case "branch": {
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
      case "optional-call":
      case "ternary":
      case "logical": {
        visit(terminal.test);
        break;
      }
      case "do-while": {
        visit(terminal.loop);
        break;
      }
      case "while": {
        visit(terminal.test);
        break;
      }
      case "for": {
        visit(terminal.init);
        break;
      }
      case "for-of": {
        visit(terminal.init);
        break;
      }
      case "label": {
        visit(terminal.block);
        break;
      }
      case "unsupported": {
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

  func.blocks = blocks;
}

export function markInstructionIds(func: HIR): void {
  let id = 0;
  const visited = new Set<Instruction>();
  for (const [_, block] of func.blocks) {
    for (const instr of block.instructions) {
      invariant(
        !visited.has(instr),
        `${printInstruction(instr)} already visited!`
      );
      visited.add(instr);
      instr.id = makeInstructionId(++id);
    }
    block.terminal.id = makeInstructionId(++id);
  }
}

export function markPredecessors(func: HIR): void {
  for (const [, block] of func.blocks) {
    block.preds.clear();
  }
  const visited: Set<BlockId> = new Set();
  function visit(blockId: BlockId, prevBlock: BasicBlock | null): void {
    const block = func.blocks.get(blockId)!;
    if (prevBlock) {
      block.preds.add(prevBlock.id);
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
