import { BasicBlock, BlockId, HIRFunction, Terminal } from "../HIR/HIR";
import { printInstruction, printPlace } from "../HIR/PrintHIR";
import { assertExhaustive } from "./utils";

const INSTRUCTIONS_NODE_NAME = "instrs";
const TERMINAL_NODE_NAME = "terminal";

enum MermaidFlowchartDirection {
  TopBottom = "TB", // top to bottom
  TopDown = "TD", // top-down/ same as top to bottom
  BottomTop = "BT", // bottom to top
  RightLeft = "RL", // right to left
  LeftRight = "LR", // left to right
}

function printBlockId(id: BlockId): string {
  return `bb${id}`;
}

/**
 * Prints a mermaid arrow with optional label connecting BasicBlocks for use in the "Jumps" section.
 */
function printJumpArrow(
  from: BlockId,
  to: BlockId,
  label: string | null
): string {
  const fromId = printBlockId(from);
  const toId = printBlockId(to);
  if (label != null) {
    return `${fromId}_${TERMINAL_NODE_NAME} -- "${label}" --> ${toId}\n`;
  }
  return `${fromId}_${TERMINAL_NODE_NAME} --> ${toId}\n`;
}

/**
 * Prints a mermaid arrow connecting a BasicBlock's instructions to its Terminal for use in the
 * "Basic Blocks" section.
 */
function printTerminalArrow(blockId: BlockId, block: BasicBlock) {
  const bbId = printBlockId(blockId);
  if (block.instructions.length > 0) {
    return `${bbId}_${INSTRUCTIONS_NODE_NAME} --> ${bbId}_${TERMINAL_NODE_NAME}(["${printTerminalLabel(
      block.terminal
    )}"])`;
  }
  return `${bbId}_${TERMINAL_NODE_NAME}(["${printTerminalLabel(
    block.terminal
  )}"])`;
}

/**
 * Prints a BasicBlock as a mermaid `subgraph`, with instructions as a single multiline mermaid node
 * and the terminal as an arrow connecting the instruction node with the terminal.
 */
function printBlockSubgraphs(blockId: BlockId, block: BasicBlock) {
  const buffer = [];
  const bbId = printBlockId(blockId);
  const instructions = block.instructions
    .map((instr) => `      ${printInstruction(instr).replaceAll('"', "'")}\n`)
    .join("");
  buffer.push(`  subgraph ${bbId}\n`);
  if (block.instructions.length > 0) {
    buffer.push(`    ${bbId}_${INSTRUCTIONS_NODE_NAME}["\n`);
    buffer.push(instructions);
    buffer.push('    "]\n');
  }
  buffer.push(`    ${printTerminalArrow(blockId, block)}`);
  buffer.push("\n  end\n");
  return buffer.join("");
}

function printTerminalLabel(terminal: Terminal): string {
  const buffer = [];
  switch (terminal.kind) {
    case "if": {
      buffer.push(`If (${printPlace(terminal.test)})`);
      break;
    }
    case "goto": {
      buffer.push("Goto");
      break;
    }
    case "return": {
      if (terminal.value != null) {
        buffer.push(`Return ${printPlace(terminal.value)}`);
      } else {
        buffer.push("Return");
      }
      break;
    }
    case "switch":
      buffer.push(`Switch (${printPlace(terminal.test)})`);
      break;
    case "throw":
      buffer.push(`Throw ${printPlace(terminal.value)}`);
      break;
    case "logical": {
      buffer.push(`Logical ${terminal.operator}`);
      break;
    }
    case "while":
      buffer.push("While");
      break;
    case "for":
      buffer.push("For");
      break;
    default:
      assertExhaustive(terminal, `unhandled terminal ${terminal}`);
  }
  return buffer.join("");
}

function printTerminalArrows(blockId: BlockId, terminal: Terminal): string {
  const buffer = [];
  switch (terminal.kind) {
    case "if": {
      buffer.push(printJumpArrow(blockId, terminal.consequent, "then"));
      buffer.push(printJumpArrow(blockId, terminal.alternate, "else"));
      if (
        terminal.fallthrough != null &&
        terminal.alternate !== terminal.fallthrough
      ) {
        buffer.push(
          printJumpArrow(blockId, terminal.fallthrough, "fallthrough")
        );
      }
      break;
    }
    case "logical": {
      buffer.push(printJumpArrow(blockId, terminal.test, "test"));
      buffer.push(printJumpArrow(blockId, terminal.fallthrough, "fallthrough"));
      break;
    }
    case "goto": {
      buffer.push(printJumpArrow(blockId, terminal.block, null));
      break;
    }
    case "switch": {
      terminal.cases.forEach((case_) => {
        if (case_.test != null) {
          buffer.push(
            printJumpArrow(blockId, case_.block, printPlace(case_.test))
          );
        } else {
          buffer.push(printJumpArrow(blockId, case_.block, "default"));
        }
      });
      if (terminal.fallthrough != null) {
        buffer.push(
          printJumpArrow(blockId, terminal.fallthrough, "fallthrough")
        );
      }
      break;
    }
    case "while": {
      buffer.push(printJumpArrow(blockId, terminal.test, "test"));
      buffer.push(printJumpArrow(blockId, terminal.loop, "loop"));
      buffer.push(printJumpArrow(blockId, terminal.fallthrough, "fallthrough"));
      break;
    }
    case "for": {
      buffer.push(printJumpArrow(blockId, terminal.init, "init"));
      buffer.push(printJumpArrow(blockId, terminal.test, "test"));
      buffer.push(printJumpArrow(blockId, terminal.update, "update"));
      buffer.push(printJumpArrow(blockId, terminal.loop, "loop"));
      buffer.push(printJumpArrow(blockId, terminal.fallthrough, "fallthrough"));
      break;
    }
    case "throw":
    case "return": {
      break;
    }
    default:
      assertExhaustive(terminal, `unhandled terminal ${terminal}`);
  }
  return buffer.map((line) => `  ${line}`).join("");
}

/**
 * Visualizes the HIR as a mermaid.js diagram.
 */
export default function visualizeHIRMermaid(fn: HIRFunction): string {
  const ir = fn.body;
  const subgraphs = [];
  const jumps = [];

  for (const [blockId, block] of ir.blocks) {
    const subgraph = printBlockSubgraphs(blockId, block);
    const jump = printTerminalArrows(blockId, block.terminal);

    if (subgraph.length > 0) {
      subgraphs.push(subgraph);
    }

    if (jump.length > 0) {
      jumps.push(jump);
    }
  }

  return `flowchart ${MermaidFlowchartDirection.TopBottom}
  %% Basic Blocks
${subgraphs.length ? subgraphs.join("") : "  %% empty"}
  %% Jumps
${jumps.length ? jumps.join("") : "  %% empty"}`;
}
