/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { assertExhaustive, retainWhere } from "../Common/utils";
import {
  BlockId,
  HIRFunction,
  Identifier,
  Instruction,
  InstructionId,
  InstructionValue,
  makeInstructionId,
  Place,
  ReactiveScope,
} from "./HIR";
import { BlockTerminal, Visitor, visitTree } from "./HIRTreeVisitor";
import { eachInstructionValueOperand } from "./visitors";

export function inferReactiveScopeDependencies(fn: HIRFunction) {
  // TODO: visitTree is more of a transformer visitor, consider adding a new tree visitor
  // that only visits and replacing this usage
  const visitor = new ScopeDependenciesVisitor(fn);
  visitTree(fn, visitor);
}

export function instructionInScope(
  instrId: InstructionId,
  scope: ReactiveScope
) {
  return instrId >= scope.range.start && instrId < scope.range.end;
}

class ScopeDependenciesVisitor
  implements Visitor<void, void, void, void, InstructionValue, void, void>
{
  #identifiers: Map<Identifier, InstructionId> = new Map();
  // Scopes that are currently active at this point in the traversal
  #activeScopes: Set<ReactiveScope> = new Set();

  get #lastActiveScope(): ReactiveScope | null {
    const scopes = [...this.#activeScopes];
    return scopes[scopes.length - 1];
  }

  constructor(fn: HIRFunction) {
    if (fn.id !== null) {
      this.#identifiers.set(fn.id, makeInstructionId(0));
    }
    for (const param of fn.params) {
      this.#identifiers.set(param.identifier, makeInstructionId(0));
    }
  }

  #recordActiveScope(scope: ReactiveScope) {
    this.#activeScopes.add(scope);
  }

  /**
   * Prune any scopes that are out of range
   */
  #visitId(id: InstructionId): void {
    const scopes = [...this.#activeScopes];
    retainWhere(scopes, (pending) => pending.range.end > id);
    this.#activeScopes = new Set(scopes);
  }

  /**
   * Adds a dependency on the terminal operand to the last active scope
   */
  #addTerminalDependency(operand: Place): void {
    const activeScope = this.#lastActiveScope;
    if (activeScope != null) {
      const identId = this.#identifiers.get(operand.identifier);
      if (identId !== undefined && identId < activeScope.range.start) {
        activeScope.dependencies.add(operand);
      }
    }
  }

  visitTerminal(
    terminal: BlockTerminal<void, InstructionValue, void, void>
  ): void {
    switch (terminal.kind) {
      case "if":
      case "switch":
      case "for":
      case "while": {
        if (typeof terminal?.test?.kind !== "string") {
          console.log(terminal);
        }
        for (const operand of eachInstructionValueOperand(terminal.test)) {
          this.#addTerminalDependency(operand);
        }
        break;
      }
      case "return":
      case "throw": {
        if (terminal.value != null) {
          for (const operand of eachInstructionValueOperand(terminal.value)) {
            this.#addTerminalDependency(operand);
          }
        }
        break;
      }
      case "continue":
      case "break": {
        break;
      }
      default:
        assertExhaustive(terminal, `unhandled terminal ${terminal}`);
    }
  }

  visitTerminalId(id: InstructionId): void {
    this.#visitId(id);
  }

  /**
   * We don't need to map to a different representation, so just return the value directly
   */
  visitValue(value: InstructionValue, id: InstructionId): InstructionValue {
    return value;
  }

  visitInstruction(instr: Instruction, _value: InstructionValue): void {
    this.#visitId(instr.id);
    const { lvalue, value } = instr;
    if (lvalue !== null && lvalue.place.memberPath === null) {
      if (!this.#identifiers.has(lvalue.place.identifier)) {
        this.#identifiers.set(lvalue.place.identifier, instr.id);
      }
    }

    const activeScopes: Set<ReactiveScope> = new Set();
    const dependencies: Array<Place> = [];
    if (lvalue != null) {
      if (
        lvalue.place.identifier.scope !== null &&
        lvalue.place.memberPath === null &&
        instructionInScope(instr.id, lvalue.place.identifier.scope)
      ) {
        activeScopes.add(lvalue.place.identifier.scope);
      } else {
        dependencies.push(lvalue.place);
      }
    }
    for (const operand of eachInstructionValueOperand(value)) {
      if (
        operand.identifier.scope !== null &&
        instructionInScope(instr.id, operand.identifier.scope)
      ) {
        activeScopes.add(operand.identifier.scope);
      } else {
        dependencies.push(operand);
      }
    }

    for (const scope of activeScopes) {
      this.#recordActiveScope(scope);
    }

    if (dependencies.length > 0) {
      const scope = this.#lastActiveScope;
      if (scope != null) {
        for (const dep of dependencies) {
          const identId = this.#identifiers.get(dep.identifier);
          if (identId !== undefined && identId < scope.range.start) {
            scope.dependencies.add(dep);
          }
        }
      }
    }
  }

  enterBlock(): void {}
  enterValueBlock(): void {}
  enterInitBlock(block: void): void {}
  visitImplicitTerminal(): void | null {}
  visitCase(test: InstructionValue, block: void): void {}
  appendBlock(block: void, item: void, label?: BlockId | undefined): void {}
  appendValueBlock(block: void, item: void): void {}
  appendInitBlock(block: void, item: void): void {}
  leaveBlock(block: void): void {}
  leaveValueBlock(block: void, value: InstructionValue): InstructionValue {
    return value;
  }
  leaveInitBlock(block: void): void {}
}
