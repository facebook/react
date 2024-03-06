/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompilerError } from "../CompilerError";
import {
  Identifier,
  IdentifierId,
  InstructionId,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveScopeBlock,
} from "../HIR/HIR";
import { ReactiveFunctionVisitor, visitReactiveFunction } from "./visitors";

/**
 * Ensures that each named variable in the given function has a unique name
 * that does not conflict with any other variables in the same block scope.
 * Note that the scoping is based on the final inferred blocks, not the
 * block scopes that were present in the original source. Thus variables
 * that shadowed in the original source may end up with unique names in the
 * output, if Forget would merge those two blocks into a single scope.
 *
 * Variables are renamed using their original name followed by a number,
 * starting with 0 and incrementing until a unique name is found. Eg if the
 * compiler collapses three scopes that each had their own `foo` declaration,
 * they will be renamed to `foo`, `foo0`, and `foo1`, assuming that no conflicts'
 * exist for `foo0` and `foo1`.
 *
 * For temporary values that are promoted to named variables, the starting name
 * is "T0" for values that appear in JSX tag position and "t0" otherwise. If this
 * name conflicts, the number portion increments until the name is unique (t1, t2, etc).
 */
export function renameVariables(fn: ReactiveFunction): void {
  const scopes = new Scopes();
  renameVariablesImpl(fn, new Visitor(), scopes);
}

function renameVariablesImpl(
  fn: ReactiveFunction,
  visitor: Visitor,
  scopes: Scopes
): void {
  scopes.enter(() => {
    for (const param of fn.params) {
      if (param.kind === "Identifier") {
        scopes.visit(param.identifier);
      } else {
        scopes.visit(param.place.identifier);
      }
    }
    visitReactiveFunction(fn, visitor, scopes);
  });
}

class Visitor extends ReactiveFunctionVisitor<Scopes> {
  override visitLValue(_id: InstructionId, lvalue: Place, state: Scopes): void {
    state.visit(lvalue.identifier);
  }
  override visitPlace(id: InstructionId, place: Place, state: Scopes): void {
    state.visit(place.identifier);
  }
  override visitBlock(block: ReactiveBlock, state: Scopes): void {
    state.enter(() => {
      this.traverseBlock(block, state);
    });
  }

  override visitScope(scope: ReactiveScopeBlock, state: Scopes): void {
    for (const [_, declaration] of scope.scope.declarations) {
      state.visit(declaration.identifier);
    }
    this.traverseScope(scope, state);
  }

  override visitReactiveFunctionValue(
    _id: InstructionId,
    _dependencies: Place[],
    _fn: ReactiveFunction,
    _state: Scopes
  ): void {
    renameVariablesImpl(_fn, this, _state);
  }
}

class Scopes {
  #seen: Map<IdentifierId, string> = new Map();
  #stack: Array<Map<string, IdentifierId>> = [new Map()];

  visit(identifier: Identifier): void {
    const originalName = identifier.name;
    if (originalName === null) {
      return;
    }
    const mappedName = this.#seen.get(identifier.id);
    if (mappedName !== undefined) {
      identifier.name = mappedName;
      return;
    }
    let name = originalName;
    let id = 0;
    if (name.startsWith("#t")) {
      name = `t${id++}`;
    } else if (name.startsWith("#T")) {
      name = `T${id++}`;
    }
    let previous = this.#lookup(name);
    while (previous !== null) {
      if (originalName.startsWith("#t")) {
        name = `t${id++}`;
      } else if (originalName.startsWith("#T")) {
        name = `T${id++}`;
      } else {
        name = `${identifier.name}$${id++}`;
      }
      previous = this.#lookup(name);
    }
    identifier.name = name;
    this.#seen.set(identifier.id, name);
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
    CompilerError.invariant(last === next, {
      reason: "Mismatch push/pop calls",
      description: null,
      loc: null,
      suggestions: null,
    });
  }
}
