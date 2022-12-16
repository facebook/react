import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { assertExhaustive } from "../Common/utils";
import { invariant } from "../CompilerError";
import * as IR from "../IR";
import { BasicBlock, BlockId, CFG, Terminal } from "./ControlFlowGraph";

/**
 * A work-in-progress block that does not yet have a terminator
 */
export type WipBlock = {
  id: BlockId;
  body: Array<NodePath<t.Statement | t.Expression>>;
  parents: Set<IR.FuncTopLevel>;
};

export enum TerminatorKind {
  Fallthrough,
  Normal,
}

/**
 * Scope is used to track contextual information such as break/continue targets
 * as well as which variables determine whether control flow to the current
 * statement can be reached or not.
 */
type Scope = LoopScope | ConditionalScope | LabelScope | SwitchScope;

type LoopScope = {
  kind: "loop";
  label: string | null;
  continueBlock: BlockId;
  breakBlock: BlockId;
};

type ConditionalScope = {
  kind: "conditional";
  test: NodePath<t.Expression>;
};

type LabelScope = {
  kind: "label";
  label: string;
  breakBlock: BlockId;
};

type SwitchScope = {
  kind: "switch";
  test: NodePath<t.Expression>;
  breakBlock: BlockId;
};

function newWipBlock(id: BlockId): WipBlock {
  return {
    id,
    body: [],
    parents: new Set(),
  };
}

/**
 * Helper class for constructing a CFG
 */
export default class CFGBuilder {
  #completed: Map<BlockId, BasicBlock> = new Map();
  #nextId: BlockId = 1;
  #current: WipBlock = newWipBlock(0);
  #entry: BlockId = 0;
  #scopes: Array<Scope> = [];

  /**
   * Add a parent IR func top level
   */
  associateParentBlock(block: IR.FuncTopLevel) {
    this.#current.parents.add(block);
  }

  /**
   * Push a statement or expression onto the current block
   */
  push(stmt: NodePath<t.Statement | t.Expression>) {
    this.#current.body.push(stmt);
  }

  /**
   * Construct a final CFG from this context
   */
  build(): CFG {
    const { id: blockId, body, parents } = this.#current;
    this.#completed.set(blockId, {
      body,
      terminal: { kind: "return", value: null, fallthrough: null },
      parents,
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
    const { id: blockId, body, parents } = this.#current;
    this.#completed.set(blockId, {
      body,
      terminal,
      parents,
    });
    const nextId = this.#nextId++;
    this.#current = newWipBlock(nextId);
  }

  /**
   * Terminate the current block w the given terminal, and set the previously
   * reserved block as the new current block
   */
  terminateWithContinuation(terminal: Terminal, continuation: WipBlock) {
    const { id: blockId, body, parents } = this.#current;
    this.#completed.set(blockId, {
      body,
      terminal,
      parents,
    });
    this.#current = continuation;
  }

  /**
   * Reserve a block so that it can be referenced prior to construction.
   * Make this the current block with `terminateWithContinuation()` or
   * call `complete()` to save it without setting it as the current block.
   */
  reserve(): WipBlock {
    const blockId = this.#nextId++;
    return newWipBlock(blockId);
  }

  /**
   * Save a previously reserved block as completed
   */
  complete(block: WipBlock, terminal: Terminal) {
    const { id: blockId, body, parents } = block;
    this.#completed.set(blockId, { body, terminal, parents });
  }

  /**
   * Create a new block and execute the provided callback with the new block
   * set as the current, resetting to the previously active block upon exit.
   * The lambda must return a terminal node, which is used to terminate the
   * newly constructed block.
   */
  enter(fn: (blockId: BlockId) => Terminal): BlockId {
    const current = this.#current;
    const nextId = this.#nextId++;
    this.#current = newWipBlock(nextId);
    const terminal = fn(nextId);
    const { id: blockId, body, parents } = this.#current;
    this.#completed.set(blockId, { body, terminal, parents });
    this.#current = current;
    return nextId;
  }

  condition<T>(test: NodePath<t.Expression>, fn: () => T): T {
    this.#scopes.push({
      kind: "conditional",
      test,
    });
    const value = fn();
    const last = this.#scopes.pop();
    invariant(
      last != null && last.kind === "conditional" && last.test === test,
      "Mismatched condition"
    );
    return value;
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

  switch<T>(test: NodePath<t.Expression>, breakBlock: BlockId, fn: () => T): T {
    this.#scopes.push({
      kind: "switch",
      breakBlock,
      test,
    });
    const value = fn();
    const last = this.#scopes.pop();
    invariant(
      last != null && last.kind === "switch" && last.test === test,
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
   * Returns the set of expressions which appear as conditions (if/switch test)
   * determining whether control flow to the current point will be reached.
   *
   * This is intended for recording "control dependencies" at places such as explicit
   * break/return which divert from normal control flow.
   */
  controlExpressions(): Array<NodePath<t.Expression>> | null {
    const tests: Array<NodePath<t.Expression>> = [];
    this.#scopes.forEach((scope) => {
      if (scope.kind === "conditional" || scope.kind === "switch") {
        tests.push(scope.test);
      }
    });
    return tests.length === 0 ? null : tests;
  }

  /**
   * Lookup the block target for a break statement, based on loops and switch statements
   * in scope. Throws if there is no available location to break.
   */
  lookupBreak(label: string | null): BlockId {
    for (let ii = this.#scopes.length - 1; ii >= 0; ii--) {
      const scope = this.#scopes[ii];
      switch (scope.kind) {
        case "label":
        case "loop": {
          if (label === null || label === scope.label) {
            return scope.breakBlock;
          }
          break;
        }
        case "switch": {
          return scope.breakBlock;
        }
        default: {
          // no-op
        }
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
      } else if (scope.kind === "label" && scope.label === label) {
        invariant(false, "Continue may only refer to a labeled loop");
      }
    }
    invariant(false, "Expected a loop to be in scope");
  }
}

/**
 * Helper to shrink a CFG to eliminate unreachable node and eliminate jump-only blocks.
 */
function shrink(func: CFG): CFG {
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
    const { body, terminal: prevTerminal, parents } = func.blocks.get(blockId)!;
    const terminal = mapTerminalSuccessors(prevTerminal, (prevTarget, kind) => {
      const target = resolveBlockTarget(prevTarget);
      if (kind == TerminatorKind.Normal) {
        queue.push(target);
      }
      return target;
    });
    blocks.set(blockId, {
      body,
      terminal,
      parents,
    });
  }

  for (const block of blocks.values()) {
    if (
      (block.terminal.kind === "return" || block.terminal.kind === "goto") &&
      block.terminal.fallthrough !== null &&
      !blocks.has(block.terminal.fallthrough.block)
    ) {
      // this fallthrough branch wasn't otherwise reachable, prune it
      block.terminal.fallthrough = null;
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
  return block.body.length === 0 &&
    block.terminal.kind === "goto" &&
    block.terminal.fallthrough === null
    ? block.terminal.block
    : null;
}

/**
 * Maps a terminal node's block assignments using the provided function.
 */
function mapTerminalSuccessors(
  terminal: Terminal,
  fn: (block: BlockId, fallthrough: TerminatorKind) => BlockId
): Terminal {
  switch (terminal.kind) {
    case "goto": {
      const target = fn(terminal.block, TerminatorKind.Normal);
      const fallthrough =
        terminal.fallthrough !== null
          ? {
              block: fn(terminal.fallthrough.block, TerminatorKind.Fallthrough),
              tests: terminal.fallthrough.tests,
            }
          : null;
      return {
        kind: "goto",
        block: target,
        fallthrough,
      };
    }
    case "if": {
      const consequent = fn(terminal.consequent, TerminatorKind.Normal);
      const alternate = fn(terminal.alternate, TerminatorKind.Normal);
      return {
        kind: "if",
        test: terminal.test,
        consequent,
        alternate,
      };
    }
    case "switch": {
      const cases = terminal.cases.map((case_) => {
        const target = fn(case_.block, TerminatorKind.Normal);
        return {
          test: case_.test,
          block: target,
        };
      });
      return {
        kind: "switch",
        test: terminal.test,
        cases,
      };
    }
    case "return": {
      const fallthrough =
        terminal.fallthrough !== null
          ? {
              block: fn(terminal.fallthrough.block, TerminatorKind.Fallthrough),
              tests: terminal.fallthrough.tests,
            }
          : null;
      return {
        kind: "return",
        value: terminal.value,
        fallthrough,
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
