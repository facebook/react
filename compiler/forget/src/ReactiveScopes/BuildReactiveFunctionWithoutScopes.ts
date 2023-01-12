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
  ReactiveStatement,
  ReactiveTerminal,
  ReactiveValueBlock,
} from "../HIR/HIR";
import { BlockTerminal, Visitor, visitTree } from "../HIR/HIRTreeVisitor";
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

class Builder {
  #instructions: ReactiveBlock = [];

  append(item: ReactiveStatement, label: BlockId | undefined): void {
    if (label !== undefined) {
      invariant(item.kind === "terminal", "Only terminals may have a label");
      item.label = label;
    }
    this.#instructions.push(item);
  }

  complete(): ReactiveBlock {
    return this.#instructions;
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
  enterBlock(): Builder {
    return new Builder();
  }
  appendBlock(
    block: Builder,
    item: ReactiveStatement,
    label?: BlockId | undefined
  ): void {
    block.append(item, label);
  }
  leaveBlock(block: Builder): ReactiveBlock {
    return block.complete();
  }

  enterValueBlock(block: Builder): ReactiveValueBlock {
    return {
      kind: "value-block",
      instructions: [],
      last: null,
    };
  }
  appendValueBlock(block: ReactiveValueBlock, item: ReactiveStatement): void {
    block.instructions.push(item);
  }
  leaveValueBlock(
    block: ReactiveValueBlock,
    last: {
      value: InstructionValue | ReactiveValueBlock;
      id: InstructionId;
    } | null
  ): InstructionValue | ReactiveValueBlock {
    if (last !== null) {
      const { id, value } = last;
      invariant(
        value.kind !== "value-block",
        "Expected value block to end in a value"
      );
      block.last = { id, value };
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
    return { kind: "instruction", instruction };
  }
  visitTerminalId(id: InstructionId): void {}
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
        result = { kind: "break", label: terminal.label, id: terminal.id };
        break;
      }
      case "continue": {
        result = { kind: "continue", label: terminal.label, id: terminal.id };
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
          id: terminal.id,
        };
        break;
      }
      case "if": {
        result = {
          kind: "if",
          test: terminal.test as Place,
          consequent: terminal.consequent,
          alternate: terminal.alternate,
          id: terminal.id,
        };
        break;
      }
      case "return": {
        const value = terminal.value;
        if (value !== null && value.kind !== "Identifier") {
          invariant(false, "Expected return to be a Place");
        }
        result = { kind: "return", value, id: terminal.id };
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
          id: terminal.id,
        };
        break;
      }
      case "throw": {
        result = {
          kind: "throw",
          value: terminal.value as Place,
          id: terminal.id,
        };
        break;
      }
      case "while": {
        result = {
          kind: "while",
          test: terminal.test as ReactiveValueBlock,
          loop: terminal.loop,
          id: terminal.id,
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
