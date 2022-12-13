/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import { assertExhaustive } from "../Common/utils";
import {
  BlockId,
  HIRFunction,
  Instruction,
  InstructionId,
  InstructionValue,
  Place,
  ReactiveBasicBlock,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveTerminal,
  ReactiveValueBlock,
  ScopeId,
} from "./HIR";
import { BlockTerminal, Visitor, visitTree } from "./HIRTreeVisitor";
import { eachInstructionOperand } from "./visitors";

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
  | { kind: "block"; block: ReactiveBasicBlock }
  | { kind: "scope"; block: ReactiveBasicBlock; scope: ReactiveScope };

class Builder {
  #instructions: ReactiveBasicBlock;
  #stack: Array<
    | { kind: "scope"; block: ReactiveBlock }
    | { kind: "block"; block: ReactiveBasicBlock }
  >;

  constructor() {
    const block: ReactiveBasicBlock = [];
    this.#instructions = block;
    this.#stack = [{ kind: "block", block }];
  }

  append(item: ReactiveInstruction, label: BlockId | undefined): void {
    if (label !== undefined) {
      invariant(item.kind === "terminal", "Only terminals may have a label");
      item.label = label;
    }
    this.#instructions.push(item);
  }

  startScope(scope: ReactiveScope): void {
    const block: ReactiveBlock = {
      kind: "block",
      id: scope.id,
      range: scope.range,
      dependencies: scope.dependencies,
      instructions: [],
    };
    this.append(block, undefined);
    this.#instructions = block.instructions;
    this.#stack.push({ kind: "scope", block });
  }

  visitId(id: InstructionId): void {
    for (let i = 0; i < this.#stack.length; i++) {
      const scope = this.#stack[i]!;
      if (scope.kind === "scope" && id >= scope.block.range.end) {
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

  complete(): ReactiveBasicBlock {
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
      ReactiveBasicBlock,
      ReactiveValueBlock,
      ReactiveValueBlock,
      InstructionValue | ReactiveValueBlock,
      ReactiveInstruction,
      { test: InstructionValue | null; block: ReactiveBasicBlock }
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
    item: ReactiveInstruction,
    label?: BlockId | undefined
  ): void {
    block.append(item, label);
  }
  leaveBlock(block: Builder): ReactiveBasicBlock {
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
  appendValueBlock(block: ReactiveValueBlock, item: ReactiveInstruction): void {
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
  appendInitBlock(block: ReactiveValueBlock, item: ReactiveInstruction): void {
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
  ): ReactiveInstruction {
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
  visitImplicitTerminal(): ReactiveInstruction | null {
    return null;
  }
  visitTerminal(
    terminal: BlockTerminal<
      ReactiveValueBlock,
      InstructionValue | ReactiveValueBlock,
      ReactiveBasicBlock,
      { test: InstructionValue | null; block: ReactiveBasicBlock }
    >
  ): ReactiveInstruction {
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
            block: ReactiveBasicBlock | void;
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
    block: ReactiveBasicBlock
  ): { test: InstructionValue | null; block: ReactiveBasicBlock } {
    if (test !== null && test.kind !== "Identifier") {
      invariant(false, "Expected a Place");
    }
    return { test, block };
  }
}

function getInstructionScope(instr: Instruction): ReactiveScope | null {
  let scope: ReactiveScope | null = null;
  if (
    instr.lvalue !== null &&
    instr.lvalue.place.identifier.scope !== null &&
    isScopeActive(instr.lvalue.place.identifier.scope, instr.id)
  ) {
    scope = instr.lvalue.place.identifier.scope;
  } else {
    for (const operand of eachInstructionOperand(instr)) {
      if (
        operand.identifier.scope !== null &&
        isScopeActive(operand.identifier.scope, instr.id)
      ) {
        scope = operand.identifier.scope;
        break;
      }
    }
  }
  if (
    scope !== null &&
    (scope.range.end > scope.range.start + 1 || mayAllocate(instr.value))
  ) {
    return scope;
  }
  return null;
}

function mayAllocate(value: InstructionValue): boolean {
  switch (value.kind) {
    case "BinaryExpression":
    case "Identifier":
    case "JSXText":
    case "Primitive": {
      return false;
    }
    case "ArrayExpression":
    case "CallExpression":
    case "JsxExpression":
    case "JsxFragment":
    case "NewExpression":
    case "ObjectExpression":
    case "OtherStatement":
    case "UnaryExpression": {
      return true;
    }
    default: {
      assertExhaustive(value, `Unexpected value kind '${(value as any).kind}'`);
    }
  }
}

function isScopeActive(scope: ReactiveScope, id: InstructionId): boolean {
  return id >= scope.range.start && id < scope.range.end;
}

class ArraySet<T> {
  items: Array<T> = [];
  set: Set<T> = new Set();

  add(item: T) {
    if (!this.set.has(item)) {
      this.set.add(item);
      this.items.push(item);
    }
  }

  delete(item: T) {
    if (this.set.has(item)) {
      this.set.delete(item);
      this.items.splice(
        this.items.findIndex((x) => x === item),
        1
      );
    }
  }

  has(item: T): boolean {
    return this.set.has(item);
  }

  last(): T {
    invariant(this.items.length > 0, "Called ArraySet::last on empty set");
    return this.items[this.items.length - 1];
  }

  *[Symbol.iterator]() {
    yield* this.items;
  }
}
