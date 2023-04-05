/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  Identifier,
  IdentifierId,
  InstructionId,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScopeBlock,
} from "../HIR/HIR";
import {
  eachReactiveValueOperand,
  ReactiveFunctionVisitor,
  visitReactiveFunction,
} from "./visitors";

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
    visitReactiveFunction(fn, new Visitor(), scopes);
  });
}

class Visitor extends ReactiveFunctionVisitor<Scopes> {
  override visitPlace(id: InstructionId, place: Place, state: Scopes): void {
    state.visit(place.identifier);
  }
  override visitBlock(block: ReactiveBlock, state: Scopes): void {
    state.enter(() => {
      this.traverseBlock(block, state);
    });
  }
  override visitInstruction(
    instruction: ReactiveInstruction,
    state: Scopes
  ): void {
    for (const operand of eachReactiveValueOperand(instruction.value)) {
      state.visit(operand.identifier);
    }
    if (instruction.lvalue !== null) {
      state.visit(instruction.lvalue.identifier);
    }
  }
  override visitScope(scope: ReactiveScopeBlock, state: Scopes): void {
    // Intentionally bypass visitBlock() since scopes do not introduce a new
    // block scope
    this.traverseBlock(scope.instructions, state);
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
