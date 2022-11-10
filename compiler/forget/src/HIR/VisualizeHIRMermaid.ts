import { assertExhaustive } from "../Common/utils";
import { BasicBlock, BlockId, HIRFunction, Terminal } from "./HIR";
import { printInstruction, printPlace } from "./PrintHIR";

enum MermaidFlowchartDirection {
  TopBottom = "TB", // top to bottom
  TopDown = "TD", // top-down/ same as top to bottom
  BottomTop = "BT", // bottom to top
  RightLeft = "RL", // right to left
  LeftRight = "LR", // left to right
}

function indent(str: string, level: number = 1) {
  const leadingSpaces = " ".repeat(level * 2);
  return str
    .split("\n")
    .map((line) => `${leadingSpaces}${line}`)
    .join("\n");
}

function printBlockId(id: BlockId): string {
  return `bb${id}`;
}

function printJump(from: BlockId, to: BlockId, label: string | null): string {
  const fromId = printBlockId(from);
  const toId = printBlockId(to);
  if (label != null) {
    return `${fromId}_terminal -- ${label} --> ${toId}\n`;
  }
  return `${fromId}_terminal --> ${toId}\n`;
}

function visualizeInstructions({ id, instructions }: BasicBlock): string {
  return (
    `${printBlockId(id)}_instrs["\n` +
    indent(
      instructions
        .map((instr) => printInstruction(instr).replaceAll('"', "'"))
        .join("\n"),
      2
    ) +
    indent('\n"]')
  );
}

function visualizeTerminal(terminal: Terminal) {
  let buffer = "";
  switch (terminal.kind) {
    case "if": {
      buffer = buffer.concat(`If (${printPlace(terminal.test)})`);
      break;
    }
    case "goto": {
      buffer = buffer.concat("Goto");
      break;
    }
    case "return": {
      if (terminal.value != null) {
        buffer = buffer.concat(`Return ${printPlace(terminal.value)}`);
      } else {
        buffer = buffer.concat("Return");
      }
      break;
    }
    case "switch":
      buffer = buffer.concat(`Switch (${printPlace(terminal.test)})`);
      break;
    case "throw":
      buffer = buffer.concat(`Throw ${printPlace(terminal.value)}`);
      break;
    case "while":
      buffer = buffer.concat("While");
      break;
    default:
      assertExhaustive(terminal, `unhandled terminal ${terminal}`);
  }
  return buffer;
}

function visualizeJump(blockId: BlockId, terminal: Terminal): string {
  let buffer = "";
  switch (terminal.kind) {
    case "if": {
      buffer = buffer.concat(printJump(blockId, terminal.consequent, "then"));
      buffer = buffer.concat(printJump(blockId, terminal.alternate, "else"));
      if (
        terminal.fallthrough != null &&
        terminal.alternate !== terminal.fallthrough
      ) {
        buffer = buffer.concat(
          printJump(blockId, terminal.fallthrough, "fallthrough")
        );
      }
      break;
    }
    case "goto": {
      buffer = buffer.concat(printJump(blockId, terminal.block, null));
      break;
    }
    case "switch": {
      terminal.cases.forEach((case_) => {
        if (case_.test != null) {
          buffer = buffer.concat(
            printJump(blockId, case_.block, printPlace(case_.test))
          );
        } else {
          buffer = buffer.concat(printJump(blockId, case_.block, "default"));
        }
      });
      if (terminal.fallthrough != null) {
        buffer = buffer.concat(
          printJump(blockId, terminal.fallthrough, "fallthrough")
        );
      }
      break;
    }
    case "while": {
      buffer = buffer.concat(printJump(blockId, terminal.test, "test"));
      buffer = buffer.concat(printJump(blockId, terminal.loop, "loop"));
      buffer = buffer.concat(
        printJump(blockId, terminal.fallthrough, "fallthrough")
      );
      break;
    }
    case "throw":
    case "return": {
      break;
    }
    default:
      assertExhaustive(terminal, `unhandled terminal ${terminal}`);
  }
  return buffer;
}

/**
 * Visualizes the HIR as a mermaid.js diagram.
 */
export default function visualizeHIRMermaid(fn: HIRFunction): string {
  const ir = fn.body;
  const subgraphs = [];
  const jumps = [];

  for (const [blockId, block] of ir.blocks) {
    let buffer;
    const bbId = printBlockId(blockId);
    buffer = indent(`subgraph ${bbId}\n`);
    if (block.instructions.length > 0) {
      buffer = buffer.concat(indent(visualizeInstructions(block)));
      buffer = buffer.concat(
        indent(
          `\n${bbId}_instrs --> ${bbId}_terminal(["${visualizeTerminal(
            block.terminal
          )}"])`,
          2
        )
      );
    } else {
      buffer = buffer.concat(
        indent(`${bbId}_terminal(["${visualizeTerminal(block.terminal)}"])`)
      );
    }
    buffer = buffer.concat(indent("\nend\n"));
    subgraphs.push(buffer);
  }

  for (const [blockId, block] of ir.blocks) {
    const jump = visualizeJump(blockId, block.terminal);
    if (jump.length > 0) {
      jumps.push(indent(jump));
    }
  }

  return `flowchart ${MermaidFlowchartDirection.TopBottom}
  %% Basic Blocks
${subgraphs.length ? subgraphs.join("\n") : "  %% empty"}

  %% Jumps
${jumps.length ? jumps.join("\n") : "  %% empty"}`;
}
