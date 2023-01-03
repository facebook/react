/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Instruction,
  InstructionValue,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveScope,
  ReactiveTerminal,
  ReactiveValueBlock,
} from "../HIR/HIR";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { assertExhaustive } from "../Utils/utils";

export function visitFunction(
  fn: ReactiveFunction,
  visitors: {
    visitValue?: (value: InstructionValue) => void;
    visitInstruction?: (instr: Instruction) => void;
    visitTerminal?: (terminal: ReactiveTerminal) => void;
    visitScope?: (scope: ReactiveScope) => void;
  }
): void {
  const { visitValue, visitInstruction, visitTerminal, visitScope } = visitors;
  function visitBlock(block: ReactiveBlock): void {
    for (const item of block) {
      switch (item.kind) {
        case "instruction": {
          if (visitValue) {
            for (const operand of eachInstructionValueOperand(
              item.instruction.value
            )) {
              visitValue(operand);
            }
          }
          if (visitInstruction) {
            visitInstruction(item.instruction);
          }
          break;
        }
        case "terminal": {
          if (visitValue) {
            eachTerminalOperand(item.terminal, (operand) => {
              visitValue(operand);
            });
          }
          if (visitTerminal) {
            visitTerminal(item.terminal);
          }
          eachTerminalBlock(item.terminal, visitBlock, visitValueBlock);
          break;
        }
        case "scope": {
          if (visitScope) {
            visitScope(item.scope);
          }
          visitBlock(item.instructions);
          break;
        }
        default: {
          assertExhaustive(
            item,
            `Unexpected item kind '${(item as any).kind}'`
          );
        }
      }
    }
  }
  function visitValueBlock(block: ReactiveValueBlock): void {
    visitBlock(block.instructions);
    if (block.value !== null && visitValue) {
      visitValue(block.value);
    }
  }
  visitBlock(fn.body);
}

export function mapTerminalBlocks(
  terminal: ReactiveTerminal,
  fn: (block: ReactiveBlock) => ReactiveBlock
): void {
  switch (terminal.kind) {
    case "break":
    case "continue":
    case "return":
    case "throw": {
      break;
    }
    case "for": {
      terminal.loop = fn(terminal.loop);
      break;
    }
    case "while": {
      terminal.loop = fn(terminal.loop);
      break;
    }
    case "if": {
      terminal.consequent = fn(terminal.consequent);
      if (terminal.alternate !== null) {
        terminal.alternate = fn(terminal.alternate);
      }
      break;
    }
    case "switch": {
      for (const case_ of terminal.cases) {
        if (case_.block !== undefined) {
          case_.block = fn(case_.block);
        }
      }
      break;
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind '${(terminal as any).kind}'`
      );
    }
  }
}

export function eachTerminalBlock(
  terminal: ReactiveTerminal,
  visitBlock: (block: ReactiveBlock) => void,
  visitValueBlock: (block: ReactiveValueBlock) => void
): void {
  switch (terminal.kind) {
    case "break":
    case "continue":
    case "return":
    case "throw": {
      break;
    }
    case "for": {
      visitValueBlock(terminal.init);
      visitValueBlock(terminal.test);
      visitValueBlock(terminal.update);
      visitBlock(terminal.loop);
      break;
    }
    case "while": {
      visitValueBlock(terminal.test);
      visitBlock(terminal.loop);
      break;
    }
    case "if": {
      visitBlock(terminal.consequent);
      if (terminal.alternate !== null) {
        visitBlock(terminal.alternate);
      }
      break;
    }
    case "switch": {
      for (const case_ of terminal.cases) {
        if (case_.block !== undefined) {
          visitBlock(case_.block);
        }
      }
      break;
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind '${(terminal as any).kind}'`
      );
    }
  }
}

export function eachTerminalOperand(
  terminal: ReactiveTerminal,
  fn: (place: Place) => void
): void {
  switch (terminal.kind) {
    case "break":
    case "continue": {
      break;
    }
    case "return": {
      if (terminal.value !== null) {
        fn(terminal.value);
      }
      break;
    }
    case "throw": {
      fn(terminal.value);
      break;
    }
    case "for": {
      break;
    }
    case "while": {
      break;
    }
    case "if": {
      fn(terminal.test);
      break;
    }
    case "switch": {
      fn(terminal.test);
      for (const case_ of terminal.cases) {
        if (case_.test !== null) {
          fn(case_.test);
        }
      }
      break;
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind '${(terminal as any).kind}'`
      );
    }
  }
}
