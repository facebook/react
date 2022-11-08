/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { assertExhaustive } from "../Common/utils";
import { BlockId, Instruction, Place, Terminal } from "./HIR";

export function* eachInstructionOperand(instr: Instruction): Iterable<Place> {
  const instrValue = instr.value;
  switch (instrValue.kind) {
    case "NewExpression":
    case "CallExpression": {
      yield instrValue.callee;
      yield* instrValue.args;
      break;
    }
    case "BinaryExpression": {
      yield instrValue.left;
      yield instrValue.right;
      break;
    }
    case "Identifier": {
      yield instrValue;
      break;
    }
    case "UnaryExpression": {
      yield instrValue.value;
      break;
    }
    case "JsxExpression": {
      yield instrValue.tag;
      yield* instrValue.props.values();
      if (instrValue.children) {
        yield* instrValue.children;
      }
      break;
    }
    case "JsxFragment": {
      yield* instrValue.children;
      break;
    }
    case "ObjectExpression": {
      if (instrValue.properties !== null) {
        yield* instrValue.properties.values();
      }
      break;
    }
    case "ArrayExpression": {
      yield* instrValue.elements;
      break;
    }
    case "OtherStatement":
    case "Primitive":
    case "JSXText": {
      break;
    }
    default: {
      assertExhaustive(
        instrValue,
        `Unexpected instruction kind '${(instrValue as any).kind}'`
      );
    }
  }
}

export function mapInstructionOperands(
  instr: Instruction,
  fn: (place: Place) => Place
): void {
  const instrValue = instr.value;
  switch (instrValue.kind) {
    case "BinaryExpression": {
      instrValue.left = fn(instrValue.left);
      instrValue.right = fn(instrValue.right);
      break;
    }
    case "Identifier": {
      instr.value = fn(instrValue);
      break;
    }
    case "NewExpression":
    case "CallExpression": {
      instrValue.callee = fn(instrValue.callee);
      instrValue.args = instrValue.args.map((arg) => fn(arg));
      break;
    }
    case "UnaryExpression": {
      instrValue.value = fn(instrValue.value);
      break;
    }
    case "JsxExpression": {
      instrValue.tag = fn(instrValue.tag);
      for (const [prop, place] of instrValue.props) {
        instrValue.props.set(prop, fn(place));
      }
      if (instrValue.children) {
        instrValue.children = instrValue.children.map((p) => fn(p));
      }
      break;
    }
    case "ObjectExpression": {
      if (instrValue.properties !== null) {
        const props = instrValue.properties;
        for (const [prop, place] of props) {
          props.set(prop, fn(place));
        }
      }
      break;
    }
    case "ArrayExpression": {
      instrValue.elements = instrValue.elements.map((e) => fn(e));
      break;
    }
    case "JsxFragment": {
      instrValue.children = instrValue.children.map((e) => fn(e));
      break;
    }
    case "OtherStatement":
    case "Primitive":
    case "JSXText": {
      break;
    }
    default: {
      assertExhaustive(instrValue, "Unexpected instruction kind");
    }
  }
}

/**
 * Maps a terminal node's block assignments using the provided function.
 */
export function mapTerminalSuccessors(
  terminal: Terminal,
  fn: (block: BlockId, isFallthrough: boolean) => BlockId
): Terminal {
  switch (terminal.kind) {
    case "goto": {
      const target = fn(terminal.block, false);
      return {
        kind: "goto",
        block: target,
      };
    }
    case "if": {
      const consequent = fn(terminal.consequent, false);
      const alternate = fn(terminal.alternate, false);
      const fallthrough =
        terminal.fallthrough !== null ? fn(terminal.fallthrough, true) : null;
      return {
        kind: "if",
        test: terminal.test,
        consequent,
        alternate,
        fallthrough,
      };
    }
    case "switch": {
      const cases = terminal.cases.map((case_) => {
        const target = fn(case_.block, false);
        return {
          test: case_.test,
          block: target,
        };
      });
      const fallthrough =
        terminal.fallthrough !== null ? fn(terminal.fallthrough, true) : null;
      return {
        kind: "switch",
        test: terminal.test,
        cases,
        fallthrough,
      };
    }
    case "return": {
      return {
        kind: "return",
        value: terminal.value,
      };
    }
    case "throw": {
      return terminal;
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind '${(terminal as any as Terminal).kind}'`
      );
    }
  }
}

/**
 * Iterates over the successor block ids of the provided terminal. The function is called
 * specifically for the successors that define the standard control flow, and not
 * pseduo-successors such as fallthroughs.
 */
export function* eachTerminalSuccessor(terminal: Terminal): Iterable<BlockId> {
  switch (terminal.kind) {
    case "goto": {
      yield terminal.block;
      break;
    }
    case "if": {
      yield terminal.consequent;
      yield terminal.alternate;
      break;
    }
    case "switch": {
      for (const case_ of terminal.cases) {
        yield case_.block;
      }
      break;
    }
    case "return": {
      break;
    }
    case "throw": {
      break;
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind '${(terminal as any as Terminal).kind}'`
      );
    }
  }
}

export function mapTerminalOperands(
  terminal: Terminal,
  fn: (place: Place) => Place
): void {
  switch (terminal.kind) {
    case "if": {
      terminal.test = fn(terminal.test);
      break;
    }
    case "switch": {
      terminal.test = fn(terminal.test);
      for (const case_ of terminal.cases) {
        if (case_.test === null) {
          continue;
        }
        case_.test = fn(case_.test);
      }
      break;
    }
    case "return":
    case "throw": {
      if (terminal.value !== null) {
        terminal.value = fn(terminal.value);
      }
      break;
    }
    case "goto": {
      // no-op
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

export function* eachTerminalOperand(terminal: Terminal): Iterable<Place> {
  switch (terminal.kind) {
    case "if": {
      yield terminal.test;
      break;
    }
    case "switch": {
      yield terminal.test;
      for (const case_ of terminal.cases) {
        if (case_.test === null) {
          continue;
        }
        yield case_.test;
      }
      break;
    }
    case "return":
    case "throw": {
      if (terminal.value !== null) {
        yield terminal.value;
      }
      break;
    }
    case "goto": {
      // no-op
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
