/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  BlockId,
  HIRFunction,
  Instruction,
  InstructionId,
  InstructionValue,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveScope,
  ReactiveScopeBlock,
  ReactiveStatement,
  ReactiveTerminal,
  ReactiveValueBlock,
  ScopeId,
} from "../HIR/HIR";
import { BlockTerminal, Visitor, visitTree } from "../HIR/HIRTreeVisitor";
import { eachInstructionOperand } from "../HIR/visitors";
import { assertExhaustive } from "../Utils/utils";

export function buildReactiveFunction(fn: HIRFunction): ReactiveFunction {
  const builder = new ReactiveFunctionBuilder();
  const body = visitTree(fn, builder);
  invariant(body != null, "Expected a root block");
  return {
    loc: fn.loc,
    id: fn.id,
    params: fn.params,
    generator: fn.generator,
    async: fn.async,
    body,
  };
}

type BlockKind =
  | { kind: "block"; block: ReactiveBlock }
  | { kind: "scope"; block: ReactiveBlock; scope: ReactiveScope };

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

  append(item: ReactiveStatement, label: BlockId | undefined): void {
    if (label !== undefined) {
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
    this.append(block, undefined);
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
    // TODO @josephsavona: debug two failures of this
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

class ReactiveFunctionBuilder
  implements
    Visitor<
      Builder,
      ReactiveBlock,
      ReactiveValueBlock,
      ReactiveValueBlock,
      InstructionValue | ReactiveValueBlock,
      ReactiveStatement,
      { test: InstructionValue | null; block: ReactiveBlock }
    >
{
  #builders: Array<Builder> = [];
  #scopes: Set<ScopeId> = new Set();

  visitId(id: InstructionId): void {
    const builder = this.#builders[this.#builders.length - 1]!;
    builder.visitId(id);
  }

  enterBlock(): Builder {
    const builder = new Builder();
    this.#builders.push(builder);
    return builder;
  }
  appendBlock(
    block: Builder,
    item: ReactiveStatement,
    label?: BlockId | undefined
  ): void {
    block.append(item, label);
  }
  leaveBlock(block: Builder): ReactiveBlock {
    const builder = this.#builders.pop();
    invariant(
      builder === block,
      "Expected enterBlock/leaveBlock to be called 1:1"
    );
    return block.complete();
  }

  enterValueBlock(block: Builder): ReactiveValueBlock {
    return {
      kind: "value-block",
      instructions: [],
      value: null,
    };
  }
  appendValueBlock(block: ReactiveValueBlock, item: ReactiveStatement): void {
    block.instructions.push(item);
  }
  leaveValueBlock(
    block: ReactiveValueBlock,
    value: InstructionValue | ReactiveValueBlock | null
  ): InstructionValue | ReactiveValueBlock {
    if (value !== null) {
      invariant(
        value.kind !== "value-block",
        "Expected value block to end in a value"
      );
      block.value = value;
    }
    return block;
  }

  enterInitBlock(block: Builder): ReactiveValueBlock {
    return this.enterValueBlock(block);
  }
  appendInitBlock(block: ReactiveValueBlock, item: ReactiveStatement): void {
    this.appendValueBlock(block, item);
  }
  leaveInitBlock(block: ReactiveValueBlock): ReactiveValueBlock {
    return block;
  }

  visitValue(
    value: InstructionValue,
    id: InstructionId
  ): InstructionValue | ReactiveValueBlock {
    return value;
  }
  visitInstruction(
    instruction: Instruction,
    value: InstructionValue | ReactiveValueBlock
  ): ReactiveStatement {
    this.visitId(instruction.id);
    const scope = getInstructionScope(instruction);
    if (scope !== null && !this.#scopes.has(scope.id)) {
      this.#scopes.add(scope.id);
      const builder = this.#builders[this.#builders.length - 1]!;
      builder.startScope(scope);
    }
    return { kind: "instruction", instruction };
  }
  visitTerminalId(id: InstructionId): void {
    this.visitId(id);
  }
  visitImplicitTerminal(): ReactiveStatement | null {
    return null;
  }
  visitTerminal(
    terminal: BlockTerminal<
      ReactiveValueBlock,
      InstructionValue | ReactiveValueBlock,
      ReactiveBlock,
      { test: InstructionValue | null; block: ReactiveBlock }
    >
  ): ReactiveStatement {
    let result: ReactiveTerminal;
    switch (terminal.kind) {
      case "break": {
        result = { kind: "break", label: terminal.label };
        break;
      }
      case "continue": {
        result = { kind: "continue", label: terminal.label };
        break;
      }
      case "for": {
        const { test, update } = terminal;
        result = {
          kind: "for",
          init: terminal.init,
          test: terminal.test as ReactiveValueBlock,
          update: terminal.update as ReactiveValueBlock,
          loop: terminal.loop,
        };
        break;
      }
      case "if": {
        result = {
          kind: "if",
          test: terminal.test as Place,
          consequent: terminal.consequent,
          alternate: terminal.alternate,
        };
        break;
      }
      case "return": {
        const value = terminal.value;
        if (value !== null && value.kind !== "Identifier") {
          invariant(false, "Expected return to be a Place");
        }
        result = { kind: "return", value };
        break;
      }
      case "switch": {
        result = {
          kind: "switch",
          test: terminal.test as Place,
          cases: terminal.cases as Array<{
            test: Place | null;
            block: ReactiveBlock | void;
          }>,
        };
        break;
      }
      case "throw": {
        result = { kind: "throw", value: terminal.value as Place };
        break;
      }
      case "while": {
        result = {
          kind: "while",
          test: terminal.test as ReactiveValueBlock,
          loop: terminal.loop,
        };
        break;
      }
      default: {
        assertExhaustive(
          terminal,
          `Unexpected terminal kind '${(terminal as any).kind}'`
        );
      }
    }
    return {
      kind: "terminal",
      terminal: result,
      label: null,
    };
  }
  visitCase(
    test: InstructionValue | ReactiveValueBlock | null,
    block: ReactiveBlock
  ): { test: InstructionValue | null; block: ReactiveBlock } {
    if (test !== null && test.kind !== "Identifier") {
      invariant(false, "Expected a Place");
    }
    return { test, block };
  }
}

function getInstructionScope(instr: Instruction): ReactiveScope | null {
  if (
    instr.lvalue.place.identifier.scope !== null &&
    isScopeActive(instr.lvalue.place.identifier.scope, instr.id)
  ) {
    return instr.lvalue.place.identifier.scope;
  } else {
    for (const operand of eachInstructionOperand(instr)) {
      if (
        operand.identifier.scope !== null &&
        isScopeActive(operand.identifier.scope, instr.id)
      ) {
        return operand.identifier.scope;
      }
    }
  }
  return null;
}

function isScopeActive(scope: ReactiveScope, id: InstructionId): boolean {
  return id >= scope.range.start && id < scope.range.end;
}
