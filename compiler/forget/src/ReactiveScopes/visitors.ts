/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  InstructionId,
  InstructionValue,
  LValue,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveScopeBlock,
  ReactiveTerminal,
  ReactiveTerminalStatement,
  ReactiveValue,
  ReactiveValueBlock,
} from "../HIR/HIR";
import { eachInstructionValueOperand } from "../HIR/visitors";
import { assertExhaustive } from "../Utils/utils";

export function visitReactiveFunction<TState>(
  fn: ReactiveFunction,
  visitor: ReactiveFunctionVisitor<TState>,
  state: TState
): void {
  visitor.visitBlock(fn.body, state);
}

export class ReactiveFunctionVisitor<TState = void> {
  visitID(id: InstructionId, state: TState): void {}
  visitLValue(id: InstructionId, lvalue: LValue, state: TState): void {}
  visitPlace(id: InstructionId, place: Place, state: TState): void {}

  visitValue(id: InstructionId, value: ReactiveValue, state: TState): void {
    this.traverseValue(id, value, state);
  }
  traverseValue(id: InstructionId, value: ReactiveValue, state: TState): void {
    switch (value.kind) {
      case "LogicalExpression": {
        this.visitValue(id, value.left, state);
        this.visitValue(id, value.right, state);
        break;
      }
      case "ConditionalExpression": {
        this.visitValue(id, value.test, state);
        this.visitValue(id, value.consequent, state);
        this.visitValue(id, value.alternate, state);
        break;
      }
      case "SequenceExpression": {
        for (const instr of value.instructions) {
          this.visitInstruction(instr, state);
        }
        this.visitValue(id, value.value, state);
        break;
      }
      default: {
        for (const place of eachReactiveValueOperand(value)) {
          this.visitPlace(id, place, state);
        }
      }
    }
  }

  visitInstruction(instruction: ReactiveInstruction, state: TState): void {
    this.traverseInstruction(instruction, state);
  }
  traverseInstruction(instruction: ReactiveInstruction, state: TState): void {
    this.visitID(instruction.id, state);
    if (instruction.lvalue !== null) {
      this.visitLValue(instruction.id, instruction.lvalue, state);
    }
    this.visitValue(instruction.id, instruction.value, state);
  }

  visitTerminal(stmt: ReactiveTerminalStatement, state: TState): void {
    this.traverseTerminal(stmt, state);
  }
  traverseTerminal(stmt: ReactiveTerminalStatement, state: TState): void {
    const { terminal } = stmt;
    if (terminal.id !== null) {
      this.visitID(terminal.id, state);
    }
    switch (terminal.kind) {
      case "break":
      case "continue": {
        break;
      }
      case "return": {
        if (terminal.value !== null) {
          this.visitValue(terminal.id, terminal.value, state);
        }
        break;
      }
      case "throw": {
        this.visitValue(terminal.id, terminal.value, state);
        break;
      }
      case "for": {
        this.visitValue(terminal.id, terminal.init, state);
        this.visitValue(terminal.id, terminal.test, state);
        this.visitValue(terminal.id, terminal.update, state);
        this.visitBlock(terminal.loop, state);
        break;
      }
      case "while": {
        this.visitValue(terminal.id, terminal.test, state);
        this.visitBlock(terminal.loop, state);
        break;
      }
      case "if": {
        this.visitValue(terminal.id, terminal.test, state);
        this.visitBlock(terminal.consequent, state);
        if (terminal.alternate !== null) {
          this.visitBlock(terminal.alternate, state);
        }
        break;
      }
      case "switch": {
        this.visitValue(terminal.id, terminal.test, state);
        for (const case_ of terminal.cases) {
          if (case_.test !== null) {
            this.visitPlace(terminal.id, case_.test, state);
          }
          if (case_.block !== undefined) {
            this.visitBlock(case_.block, state);
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

  visitValueBlock(block: ReactiveValueBlock, state: TState): void {
    // NOTE: intentionally bypass calling visitBlock
    this.traverseBlock(block.instructions, state);
    if (block.last !== null) {
      this.visitPlace(block.last.id, block.last.value, state);
    }
  }

  visitScope(scope: ReactiveScopeBlock, state: TState): void {
    this.traverseScope(scope, state);
  }
  traverseScope(scope: ReactiveScopeBlock, state: TState): void {
    this.visitBlock(scope.instructions, state);
  }

  visitBlock(block: ReactiveBlock, state: TState): void {
    this.traverseBlock(block, state);
  }
  traverseBlock(block: ReactiveBlock, state: TState): void {
    for (const instr of block) {
      switch (instr.kind) {
        case "instruction": {
          this.visitInstruction(instr.instruction, state);
          break;
        }
        case "scope": {
          this.visitScope(instr, state);
          break;
        }
        case "terminal": {
          this.visitTerminal(instr, state);
          break;
        }
        default: {
          assertExhaustive(
            instr,
            `Unexpected instruction kind '${(instr as any).kind}'`
          );
        }
      }
    }
  }
}

export function visitFunction(
  fn: ReactiveFunction,
  visitors: {
    visitValue?: (value: InstructionValue) => void;
    visitInstruction?: (instr: ReactiveInstruction) => void;
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
            for (const operand of eachReactiveValueOperand(
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
    if (block.last !== null && visitValue) {
      visitValue(block.last.value);
    }
  }
  visitBlock(fn.body);
}

export function* eachReactiveValueOperand(
  instrValue: ReactiveValue
): Iterable<Place> {
  switch (instrValue.kind) {
    case "LogicalExpression": {
      yield* eachReactiveValueOperand(instrValue.left);
      yield* eachReactiveValueOperand(instrValue.right);
      break;
    }
    case "SequenceExpression": {
      for (const instr of instrValue.instructions) {
        yield* eachReactiveValueOperand(instr.value);
      }
      yield* eachReactiveValueOperand(instrValue.value);
      break;
    }
    case "ConditionalExpression": {
      yield* eachReactiveValueOperand(instrValue.test);
      yield* eachReactiveValueOperand(instrValue.consequent);
      yield* eachReactiveValueOperand(instrValue.alternate);
      break;
    }
    default: {
      yield* eachInstructionValueOperand(instrValue);
    }
  }
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
      // TODO
      // visitValueBlock(terminal.init);
      // visitValueBlock(terminal.test);
      // visitValueBlock(terminal.update);
      visitBlock(terminal.loop);
      break;
    }
    case "while": {
      // TODO
      // visitValueBlock(terminal.test);
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
