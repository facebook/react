/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import { assertExhaustive } from "../Common/utils";
import {
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveTerminal,
  ReactiveValueBlock,
} from "./HIR";
import {
  printInstruction,
  printInstructionValue,
  printPlace,
} from "./PrintHIR";

export function printReactiveFunction(fn: ReactiveFunction): string {
  const writer = new Writer();
  writer.writeLine(`function ${fn.id?.name ?? "<unknown>"}(`);
  writer.indented(() => {
    for (const param of fn.params) {
      writer.writeLine(`${param.identifier.name ?? "<param>"},`);
    }
  });
  writer.writeLine(") {");
  printReactiveInstructions(writer, fn.body);
  writer.writeLine("}");
  return writer.complete();
}

export function printReactiveBlock(writer: Writer, block: ReactiveBlock): void {
  writer.writeLine(
    `scope @${block.id} [${block.range.start}:${
      block.range.end
    }] deps=[${Array.from(block.dependencies)
      .map((dep) => printPlace(dep))
      .join(", ")}] {`
  );
  printReactiveInstructions(writer, block.instructions);
  writer.writeLine("}");
}

export function printReactiveInstructions(
  writer: Writer,
  instructions: Array<ReactiveInstruction>
): void {
  writer.indented(() => {
    for (const instr of instructions) {
      printReactiveInstruction(writer, instr);
    }
  });
}

function printReactiveInstruction(
  writer: Writer,
  instr: ReactiveInstruction
): void {
  switch (instr.kind) {
    case "instruction": {
      writer.writeLine(printInstruction(instr.instruction));
      break;
    }
    case "block": {
      printReactiveBlock(writer, instr);
      break;
    }
    case "terminal": {
      printTerminal(writer, instr.terminal);
      break;
    }
    default: {
      assertExhaustive(
        instr,
        `Unexpected terminal kind '${(instr as any).kind}'`
      );
    }
  }
}

function printValueBlock(writer: Writer, block: ReactiveValueBlock): void {
  writer.indented(() => {
    for (const instr of block.instructions) {
      printReactiveInstruction(writer, instr);
    }
    if (block.value !== null) {
      writer.writeLine(printInstructionValue(block.value));
    }
  });
}

function printTerminal(writer: Writer, terminal: ReactiveTerminal): void {
  switch (terminal.kind) {
    case "break": {
      if (terminal.label !== null) {
        writer.writeLine(`break bb${terminal.label}`);
      } else {
        writer.writeLine(`break`);
      }
      break;
    }
    case "continue": {
      if (terminal.label !== null) {
        writer.writeLine(`continue bb${terminal.label}`);
      } else {
        writer.writeLine(`continue`);
      }
      break;
    }
    case "while": {
      writer.writeLine(`while (`);
      printValueBlock(writer, terminal.test);
      writer.writeLine(") {");
      printReactiveInstructions(writer, terminal.loop);
      writer.writeLine("}");
      break;
    }
    case "if": {
      const { test, consequent, alternate } = terminal;
      writer.writeLine(`if (${printPlace(test)}) {`);
      printReactiveInstructions(writer, consequent);
      if (alternate !== null) {
        writer.writeLine("} else {");
        printReactiveInstructions(writer, alternate);
      }
      writer.writeLine("}");
      break;
    }
    case "switch": {
      writer.writeLine(`switch (${printPlace(terminal.test)}) {`);
      writer.indented(() => {
        for (const case_ of terminal.cases) {
          let prefix =
            case_.test !== null ? `case ${printPlace(case_.test)}` : "default";
          writer.writeLine(`${prefix}: {`);
          writer.indented(() => {
            const block = case_.block;
            invariant(block != null, "Expected case to have a block");
            printReactiveInstructions(writer, block);
          });
          writer.writeLine("}");
        }
      });
      writer.writeLine("}");
      break;
    }
    case "for": {
      writer.writeLine("for (");
      printValueBlock(writer, terminal.init);
      writer.writeLine(";");
      printValueBlock(writer, terminal.test);
      writer.writeLine(";");
      printValueBlock(writer, terminal.update);
      writer.writeLine(") {");
      printReactiveInstructions(writer, terminal.loop);
      writer.writeLine("}");
      break;
    }
    case "throw": {
      writer.writeLine(`throw ${printPlace(terminal.value)}`);
      break;
    }
    case "return": {
      if (terminal.value !== null) {
        writer.writeLine(`return ${printPlace(terminal.value)}`);
      } else {
        writer.writeLine("return");
      }
      break;
    }
  }
}

export class Writer {
  #out: Array<string> = [];
  #depth: number;

  constructor({ depth }: { depth: number } = { depth: 0 }) {
    this.#depth = depth;
  }

  complete(): string {
    return this.#out.join("");
  }

  write(s: string): void {
    this.#out.push("  ".repeat(this.#depth) + s);
  }

  writeLine(s: string): void {
    this.#out.push("  ".repeat(this.#depth) + s + "\n");
  }

  indented(f: () => void): void {
    this.#depth++;
    f();
    this.#depth--;
  }
}
