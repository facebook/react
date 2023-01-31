/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  BlockId,
  InstructionId,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveScopeBlock,
  ReactiveStatement,
  ScopeId,
} from "../HIR";
import { assertExhaustive } from "../Utils/utils";
import { eachReactiveValueOperand, mapTerminalBlocks } from "./visitors";

/**
 * Note: this is the 4th of 4 passes that determine how to break a function into discrete
 * reactive scopes (independently memoizeable units of code):
 * 1. InferReactiveScopeVariables (on HIR) determines operands that mutate together and assigns
 *    them a unique reactive scope.
 * 2. AlignReactiveScopesToBlockScopes (on ReactiveFunction) aligns reactive scopes
 *    to block scopes.
 * 3. MergeOverlappingReactiveScopes (this pass, on ReactiveFunction) ensures that reactive
 *    scopes do not overlap, merging any such scopes.
 * 4. BuildReactiveBlocks (on ReactiveFunction) groups the statements for each scope into
 *    a ReactiveScopeBlock.
 *
 * Given a function where the reactive scopes have been correctly aligned and merged,
 * this pass groups the instructions for each reactive scope into ReactiveBlocks.
 */
export function buildReactiveBlocks(fn: ReactiveFunction): void {
  const context = new Context();
  fn.body = context.enter(() => {
    visitBlock(context, fn.body);
  });
}

class Context {
  #builders: Array<Builder> = [];
  #scopes: Set<ScopeId> = new Set();

  visitId(id: InstructionId): void {
    const builder = this.#builders.at(-1)!;
    builder.visitId(id);
  }

  visitScope(scope: ReactiveScope): void {
    if (this.#scopes.has(scope.id)) {
      return;
    }
    this.#scopes.add(scope.id);
    this.#builders.at(-1)!.startScope(scope);
  }

  append(stmt: ReactiveStatement, label: BlockId | null): void {
    this.#builders.at(-1)!.append(stmt, label);
  }

  enter(fn: () => void): ReactiveBlock {
    const builder = new Builder();
    this.#builders.push(builder);
    fn();
    const popped = this.#builders.pop();
    invariant(popped === builder, "Expected push/pop to be called 1:1");
    return builder.complete();
  }
}

class Builder {
  #instructions: ReactiveBlock;
  #stack: Array<
    | { kind: "scope"; block: ReactiveScopeBlock }
    | { kind: "block"; block: ReactiveBlock }
  >;

  constructor() {
    const block: ReactiveBlock = [];
    this.#instructions = block;
    this.#stack = [{ kind: "block", block }];
  }

  append(item: ReactiveStatement, label: BlockId | null): void {
    if (label !== null) {
      invariant(item.kind === "terminal", "Only terminals may have a label");
      item.label = label;
    }
    this.#instructions.push(item);
  }

  startScope(scope: ReactiveScope): void {
    const block: ReactiveScopeBlock = {
      kind: "scope",
      scope,
      instructions: [],
    };
    this.append(block, null);
    this.#instructions = block.instructions;
    this.#stack.push({ kind: "scope", block });
  }

  visitId(id: InstructionId): void {
    for (let i = 0; i < this.#stack.length; i++) {
      const entry = this.#stack[i]!;
      if (entry.kind === "scope" && id >= entry.block.scope.range.end) {
        this.#stack.length = i;
        break;
      }
    }
    const last = this.#stack[this.#stack.length - 1]!;
    if (last.kind === "block") {
      this.#instructions = last.block;
    } else {
      this.#instructions = last.block.instructions;
    }
  }

  complete(): ReactiveBlock {
    // TODO: @josephsavona debug violations of this invariant
    // invariant(
    //   this.#stack.length === 1,
    //   "Expected all scopes to be closed when exiting a block"
    // );
    const first = this.#stack[0]!;
    invariant(
      first.kind === "block",
      "Expected first stack item to be a basic block"
    );
    return first.block;
  }
}

function visitBlock(context: Context, block: ReactiveBlock): void {
  for (const stmt of block) {
    switch (stmt.kind) {
      case "instruction": {
        context.visitId(stmt.instruction.id);
        const scope = getInstructionScope(stmt.instruction);
        if (scope !== null) {
          context.visitScope(scope);
        }
        context.append(stmt, null);
        break;
      }
      case "terminal": {
        const id = stmt.terminal.id;
        if (id !== null) {
          context.visitId(id);
        }
        mapTerminalBlocks(stmt.terminal, (block) => {
          return context.enter(() => {
            visitBlock(context, block);
          });
        });
        context.append(stmt, stmt.label);
        break;
      }
      case "scope": {
        invariant(
          false,
          "Expected the function to not have scopes already assigned"
        );
      }
      default: {
        assertExhaustive(
          stmt,
          `Unexpected statement kind '${(stmt as any).kind}'`
        );
      }
    }
  }
}

export function getInstructionScope({
  id,
  lvalue,
  value,
}: ReactiveInstruction): ReactiveScope | null {
  invariant(
    lvalue !== null,
    "Expected lvalues to not be null when assigning scopes. " +
      "Pruning lvalues too early can result in missing scope information."
  );
  const lvalueScope = getPlaceScope(id, lvalue.place);
  if (lvalueScope !== null) {
    return lvalueScope;
  }
  for (const operand of eachReactiveValueOperand(value)) {
    const operandScope = getPlaceScope(id, operand);
    if (operandScope !== null) {
      return operandScope;
    }
  }
  return null;
}

export function getPlaceScope(
  id: InstructionId,
  place: Place
): ReactiveScope | null {
  const scope = place.identifier.scope;
  if (scope !== null && isScopeActive(scope, id)) {
    return scope;
  }
  return null;
}

function isScopeActive(scope: ReactiveScope, id: InstructionId): boolean {
  return id >= scope.range.start && id < scope.range.end;
}
