/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Identifier,
  IdentifierId,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveTerminal,
  ReactiveValueBlock,
} from "../HIR/HIR";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { invariant } from "../Utils/CompilerError";
import { assertExhaustive } from "../Utils/utils";

/**
 * Ensures that each named variable in the given function has a unique name
 * that does not conflict with any other variables in the same block scope.
 * Note that the scoping is based on the final inferred blocks, not the
 * block scopes that were present in the original source. Thus variables
 * that shadowed in the original source may end up with unique names in the
 * output, if Forget would merge those two blocks into a single scope.
 */
export function renameVariables(fn: ReactiveFunction): void {
  const scopes = new Scopes();
  scopes.enter(() => {
    if (fn.id !== null) {
      scopes.visit(fn.id);
    }
    for (const param of fn.params) {
      scopes.visit(param.identifier);
    }
    visitBlock(scopes, fn.body);
  });
}

function visitBlock(scopes: Scopes, block: ReactiveBlock): void {
  scopes.enter(() => visitBlockInner(scopes, block));
}

function visitBlockInner(scopes: Scopes, block: ReactiveBlock): void {
  for (const stmt of block) {
    switch (stmt.kind) {
      case "instruction": {
        for (const operand of eachInstructionValueOperand(
          stmt.instruction.value
        )) {
          scopes.visit(operand.identifier);
        }
        if (stmt.instruction.lvalue !== null) {
          scopes.visit(stmt.instruction.lvalue.place.identifier);
        }
        break;
      }
      case "scope": {
        // NOTE: we intentionally don't enter new block scope here,
        // since the outputs of the scope will be in the outer block
        visitBlockInner(scopes, stmt.instructions);
        break;
      }
      case "terminal": {
        visitTerminal(scopes, stmt.terminal);
        break;
      }
    }
  }
}

function visitValueBlock(scopes: Scopes, block: ReactiveValueBlock): void {
  for (const stmt of block.instructions) {
    invariant(
      stmt.kind === "instruction",
      "Value blocks may only contain instructions"
    );
    for (const operand of eachInstructionValueOperand(stmt.instruction.value)) {
      scopes.visit(operand.identifier);
    }
    if (stmt.instruction.lvalue !== null) {
      scopes.visit(stmt.instruction.lvalue.place.identifier);
    }
  }
  if (block.value !== null) {
    for (const operand of eachInstructionValueOperand(block.value)) {
      scopes.visit(operand.identifier);
    }
  }
}

export function visitTerminal(
  scopes: Scopes,
  terminal: ReactiveTerminal
): void {
  switch (terminal.kind) {
    case "return": {
      if (terminal.value !== null) {
        scopes.visit(terminal.value.identifier);
      }
      break;
    }
    case "throw": {
      scopes.visit(terminal.value.identifier);
      break;
    }
    case "break":
    case "continue": {
      break;
    }
    case "for": {
      scopes.enter(() => {
        visitValueBlock(scopes, terminal.init);
        visitValueBlock(scopes, terminal.test);
        visitValueBlock(scopes, terminal.update);
        visitBlock(scopes, terminal.loop);
      });
      break;
    }
    case "while": {
      visitValueBlock(scopes, terminal.test);
      visitBlock(scopes, terminal.loop);
      break;
    }
    case "if": {
      scopes.visit(terminal.test.identifier);
      visitBlock(scopes, terminal.consequent);
      if (terminal.alternate !== null) {
        visitBlock(scopes, terminal.alternate);
      }
      break;
    }
    case "switch": {
      scopes.visit(terminal.test.identifier);
      for (const case_ of terminal.cases) {
        if (case_.test !== null) {
          scopes.visit(case_.test.identifier);
        }
        if (case_.block !== undefined) {
          visitBlock(scopes, case_.block);
        }
      }
      break;
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind '${(terminal as any).kind}'`
      );
    }
  }
}

class Scopes {
  #nextId: number = 0;
  #seen: Set<IdentifierId> = new Set();
  #stack: Array<Map<string, IdentifierId>> = [new Map()];

  visit(identifier: Identifier): void {
    if (identifier.name === null || this.#seen.has(identifier.id)) {
      return;
    }
    this.#seen.add(identifier.id);
    let name = identifier.name;
    let previous = this.#lookup(name);
    while (previous !== null) {
      name = `${identifier.name}$${this.#nextId++}`;
      previous = this.#lookup(name);
    }
    identifier.name = name;
    this.#stack.at(-1)!.set(name, identifier.id);
  }

  #lookup(name: string): IdentifierId | null {
    for (let i = this.#stack.length - 1; i >= 0; i--) {
      const scope = this.#stack[i]!;
      const entry = scope.get(name);
      if (entry !== undefined) {
        return entry;
      }
    }
    return null;
  }

  enter(fn: () => void): void {
    const next = new Map();
    this.#stack.push(next);
    fn();
    const last = this.#stack.pop();
    invariant(last === next, "Mismatch push/pop calls");
  }
}
