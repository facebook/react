/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import invariant from "invariant";
import {
  ReactiveFunction,
  ReactiveScopeBlock,
  ReactiveScopeDependency,
  ReactiveStatement,
  ReactiveTerminal,
  ReactiveValue,
} from "../HIR/HIR";
import {
  printIdentifier,
  printInstructionValue,
  printPlace,
  printType,
} from "../HIR/PrintHIR";
import { assertExhaustive } from "../Utils/utils";

export function printReactiveFunction(fn: ReactiveFunction): string {
  const writer = new Writer();
  writer.writeLine(
    `function ${fn.id !== null ? printIdentifier(fn.id) : "<unknown>"}(`
  );
  writer.indented(() => {
    for (const param of fn.params) {
      writer.writeLine(`${printPlace(param)},`);
    }
  });
  writer.writeLine(") {");
  printReactiveInstructions(writer, fn.body);
  writer.writeLine("}");
  return writer.complete();
}

export function printReactiveBlock(
  writer: Writer,
  block: ReactiveScopeBlock
): void {
  writer.writeLine(
    `scope @${block.scope.id} [${block.scope.range.start}:${
      block.scope.range.end
    }] dependencies=[${Array.from(block.scope.dependencies)
      .map((dep) => printDependency(dep))
      .join(", ")}] declarations=[${Array.from(block.scope.declarations)
      .map(([, decl]) =>
        printIdentifier({ ...decl.identifier, scope: decl.scope })
      )
      .join(", ")}] reassignments=[${Array.from(block.scope.reassignments).map(
      (reassign) => printIdentifier(reassign)
    )}] {`
  );
  printReactiveInstructions(writer, block.instructions);
  writer.writeLine("}");
}

function printDependency(dependency: ReactiveScopeDependency): string {
  const identifier =
    printIdentifier(dependency.identifier) +
    printType(dependency.identifier.type);
  return `${identifier}${dependency.path.map((prop) => `.${prop}`).join("")}`;
}

export function printReactiveInstructions(
  writer: Writer,
  instructions: Array<ReactiveStatement>
): void {
  writer.indented(() => {
    for (const instr of instructions) {
      printReactiveInstruction(writer, instr);
    }
  });
}

function printReactiveInstruction(
  writer: Writer,
  instr: ReactiveStatement
): void {
  switch (instr.kind) {
    case "instruction": {
      const { instruction } = instr;
      const id = `[${instruction.id}]`;

      if (instruction.lvalue !== null) {
        writer.write(`${id} ${printPlace(instruction.lvalue)} = `);
        printReactiveValue(writer, instruction.value);
        writer.newline();
      } else {
        writer.write(`${id} `);
        printReactiveValue(writer, instruction.value);
        writer.newline();
      }
      break;
    }
    case "scope": {
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

function printReactiveValue(writer: Writer, value: ReactiveValue): void {
  switch (value.kind) {
    case "ConditionalExpression": {
      writer.append(`Ternary `);
      printReactiveValue(writer, value.test);
      writer.newline();
      writer.indented(() => {
        writer.write(`? `);
        printReactiveValue(writer, value.consequent);
        writer.newline();
        writer.write(`: `);
        printReactiveValue(writer, value.alternate);
        writer.newline();
      });
      break;
    }
    case "LogicalExpression": {
      writer.append(`Logical ${value.operator} `);
      printReactiveValue(writer, value.left);
      writer.newline();
      printReactiveValue(writer, value.right);
      break;
    }
    case "SequenceExpression": {
      writer.indented(() => {
        writer.newline();
        writer.writeLine(`Sequence`);
        writer.indented(() => {
          value.instructions.forEach((instr) =>
            printReactiveInstruction(writer, {
              kind: "instruction",
              instruction: instr,
            })
          );
          writer.write(`[${value.id}] `);
          printReactiveValue(writer, value.value);
        });
      });
      break;
    }
    case "OptionalExpression": {
      writer.append(`OptionalExpression optional=${value.optional}`);
      writer.newline();
      writer.indented(() => {
        printReactiveValue(writer, value.value);
      });
      break;
    }
    default: {
      writer.append(printInstructionValue(value));
    }
  }
}

function printTerminal(writer: Writer, terminal: ReactiveTerminal): void {
  switch (terminal.kind) {
    case "break": {
      const id = terminal.id !== null ? `[${terminal.id}]` : [];
      const implicit = terminal.implicit ? "(implicit) " : "";
      if (terminal.label !== null) {
        writer.writeLine(`${id} ${implicit}break bb${terminal.label}`);
      } else {
        writer.writeLine(`${id} ${implicit}break`);
      }
      break;
    }
    case "continue": {
      const id = `[${terminal.id}]`;
      const implicit = terminal.implicit ? "(implicit) " : "";
      if (terminal.label !== null) {
        writer.writeLine(`${id} ${implicit}continue bb${terminal.label}`);
      } else {
        writer.writeLine(`${id} ${implicit}continue`);
      }
      break;
    }
    case "do-while": {
      writer.writeLine(`[${terminal.id}] do-while {`);
      printReactiveInstructions(writer, terminal.loop);
      writer.writeLine("} (");
      printReactiveValue(writer, terminal.test);
      writer.writeLine(")");
      break;
    }
    case "while": {
      writer.writeLine(`[${terminal.id}] while (`);
      printReactiveValue(writer, terminal.test);
      writer.writeLine(") {");
      printReactiveInstructions(writer, terminal.loop);
      writer.writeLine("}");
      break;
    }
    case "if": {
      const { test, consequent, alternate } = terminal;
      writer.writeLine(`[${terminal.id}] if (${printPlace(test)}) {`);
      printReactiveInstructions(writer, consequent);
      if (alternate !== null) {
        writer.writeLine("} else {");
        printReactiveInstructions(writer, alternate);
      }
      writer.writeLine("}");
      break;
    }
    case "switch": {
      writer.writeLine(
        `[${terminal.id}] switch (${printPlace(terminal.test)}) {`
      );
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
      writer.writeLine(`[${terminal.id}] for (`);
      printReactiveValue(writer, terminal.init);
      writer.writeLine(";");
      printReactiveValue(writer, terminal.test);
      writer.writeLine(";");
      if (terminal.update !== null) {
        printReactiveValue(writer, terminal.update);
      }
      writer.writeLine(") {");
      printReactiveInstructions(writer, terminal.loop);
      writer.writeLine("}");
      break;
    }
    case "for-of": {
      writer.writeLine(`[${terminal.id}] for-of (`);
      printReactiveValue(writer, terminal.init);
      writer.writeLine(") {");
      printReactiveInstructions(writer, terminal.loop);
      writer.writeLine("}");
      break;
    }
    case "throw": {
      writer.writeLine(`[${terminal.id}] throw ${printPlace(terminal.value)}`);
      break;
    }
    case "return": {
      writer.writeLine(`[${terminal.id}] return ${printPlace(terminal.value)}`);
      break;
    }
    case "label": {
      writer.writeLine("{");
      printReactiveInstructions(writer, terminal.block);
      writer.writeLine("}");
      break;
    }
    default:
      assertExhaustive(terminal, `Unhandled terminal ${terminal}`);
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

  append(s: string): void {
    this.#out.push(s);
  }

  newline(): void {
    this.#out.push("\n");
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
