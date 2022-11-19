/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { assertExhaustive } from "../Common/utils";
import { HIRFunction, Instruction, InstructionValue } from "./HIR";
import { BlockTerminal, Visitor, visitTree } from "./HIRTreeVisitor";
import { printLValue, printMixedHIR } from "./PrintHIR";

/**
 * Returns a text description of the HIR that has the overall tree shape
 * of the original AST, but with the contents of each block printed
 * similarly to printHIR's instruction formatting.
 */
export function printHIRTree(fn: HIRFunction): string {
  return visitTree(fn, new PrintVisitor());
}

class PrintVisitor implements Visitor<Array<string>, string, string, string> {
  depth: number = 0; // for indentation

  enterBlock(): string[] {
    this.depth++;
    return [];
  }
  visitValue(value: InstructionValue): string {
    return printMixedHIR(value);
  }
  visitInstruction(instr: Instruction, value: string): string {
    if (instr.lvalue !== null) {
      return `[${instr.id}] ${printLValue(instr.lvalue)} = ${value}`;
    } else {
      return `[${instr.id}] ${value}`;
    }
  }
  visitImplicitTerminal(): string | null {
    return null;
  }
  visitTerminal(
    terminal: BlockTerminal<string[], string, string, string>
  ): string {
    let value: string;
    switch (terminal.kind) {
      case "break": {
        if (terminal.label !== null) {
          value = `Break ${terminal.label}`;
        } else {
          value = "Break";
        }
        break;
      }
      case "continue": {
        if (terminal.label !== null) {
          value = `Continue ${terminal.label}`;
        } else {
          value = "Continue";
        }
        break;
      }
      case "if": {
        if (terminal.alternate !== null) {
          value = `If (${
            terminal.test
          }) ${terminal.consequent.trimStart()} else ${terminal.alternate}`;
        } else {
          value = `If (${terminal.test}) ${terminal.consequent.trimStart()}`;
        }
        break;
      }
      case "switch": {
        const prefix = "  ".repeat(this.depth);
        value = `Switch (${terminal.test}) {\n${terminal.cases
          .flatMap((case_) => case_.split("\n").map((line) => `  ${line}`))
          .join("\n")}\n${prefix}}`;
        break;
      }
      case "while": {
        value = `While (${terminal.test}) ${terminal.loop.trimStart()}`;
        break;
      }
      case "return": {
        if (terminal.value !== null) {
          value = `Return ${terminal.value}`;
        } else {
          value = "Return";
        }
        break;
      }
      case "throw": {
        value = `Throw ${terminal.value}`;
        break;
      }
      default: {
        assertExhaustive(
          terminal,
          `Unexpected terminal kind '${(terminal as any).kind}'`
        );
      }
    }
    return value;
  }
  visitCase(test: string | null, block: string): string {
    const prefix = "  ".repeat(this.depth);
    if (test === null) {
      return `${prefix}default: ${block.trimStart()}`;
    } else {
      return `${prefix}case ${test}: ${block.trimStart()}`;
    }
  }
  appendBlock(block: string[], item: string, label?: string | undefined): void {
    const prefix = "  ".repeat(this.depth);
    if (item !== "") {
      block.push(`${prefix}${item.trimStart()}`);
    }
    if (label !== undefined) {
      block.push(`${prefix}${label}:`);
    }
  }
  leaveBlock(block: string[]): string {
    this.depth--;
    const prefix = "  ".repeat(this.depth);
    return `${prefix}{\n${block.join("\n")}\n${prefix}}`;
  }
}
