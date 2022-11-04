/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import generate from "@babel/generator";
import { assertExhaustive } from "../Common/utils";
import {
  HIR,
  Identifier,
  Instruction,
  InstructionKind,
  InstructionValue,
  LValue,
  Phi,
  Place,
  SourceLocation,
  Terminal,
} from "./HIR";

export type Options = {
  indent: number;
};

export default function printHIR(
  ir: HIR,
  options: Options | null = null
): string {
  let output = [];
  let indent = " ".repeat(options?.indent ?? 0);
  const push = (text: string, indent: string = "  ") => {
    output.push(`${indent}${text}`);
  };
  for (const [blockId, block] of ir.blocks) {
    output.push(`bb${blockId}:`);
    if (block.preds.size > 0) {
      const preds = ["predecessor blocks:"];
      for (const pred of block.preds) {
        preds.push(`bb${pred.id}`);
      }
      push(preds.join(" "));
    }
    for (const phi of block.phis) {
      push(printPhi(phi));
    }
    for (const instr of block.instructions) {
      push(printInstruction(instr));
    }
    const terminal = printTerminal(block.terminal);
    if (Array.isArray(terminal)) {
      terminal.forEach((line) => push(line));
    } else {
      push(terminal);
    }
  }
  return output.map((line) => indent + line).join("\n");
}

export function printMixedHIR(
  value: Instruction | InstructionValue | Terminal
): string {
  if (!("kind" in value)) {
    return printInstruction(value);
  }
  switch (value.kind) {
    case "if":
    case "return":
    case "switch":
    case "throw":
    case "goto": {
      const terminal = printTerminal(value);
      if (Array.isArray(terminal)) {
        return terminal.join("; ");
      }
      return terminal;
    }
    default: {
      return printInstructionValue(value);
    }
  }
}

export function printInstruction(instr: Instruction): string {
  const id = `[${instr.id}]`;
  const value = printInstructionValue(instr.value);

  if (instr.lvalue !== null) {
    return `${id} ${printLValue(instr.lvalue)} = ${value}`;
  } else {
    return `${id} ${value}`;
  }
}

function printPhi(phi: Phi): string {
  const items = [];
  items.push(printIdentifier(phi.id));
  items.push(": phi(");
  const phis = [];
  for (const [block, id] of phi.operands) {
    phis.push(`bb${block.id}: ${printIdentifier(id)}`);
  }

  items.push(phis.join(", "));
  items.push(")");
  return items.join("");
}

function printTerminal(terminal: Terminal): Array<string> | string {
  let value;
  switch (terminal.kind) {
    case "if": {
      value = `If (${printPlace(terminal.test)}) then:bb${
        terminal.consequent
      } else:bb${terminal.alternate}`;
      break;
    }
    case "throw": {
      value = `Throw ${printPlace(terminal.value)}`;
      break;
    }
    case "return": {
      value = `Return${
        terminal.value != null ? " " + printPlace(terminal.value) : ""
      }`;
      break;
    }
    case "goto": {
      value = `Goto bb${terminal.block}`;
      break;
    }
    case "switch": {
      const output = [];
      output.push(`Switch (${printPlace(terminal.test)})`);
      terminal.cases.forEach((case_) => {
        if (case_.test !== null) {
          output.push(`  Case ${printPlace(case_.test)}: bb${case_.block}`);
        } else {
          output.push(`  Default: bb${case_.block}`);
        }
      });
      value = output;
      break;
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind '${terminal as any as Terminal}'`
      );
    }
  }
  return value;
}

function printInstructionValue(instrValue: InstructionValue): string {
  let value = "";
  switch (instrValue.kind) {
    case "ArrayExpression": {
      value = `Array [${instrValue.elements
        .map((element) => printPlace(element))
        .join(", ")}]`;
      break;
    }
    case "ObjectExpression": {
      const properties = [];
      if (instrValue.properties !== null) {
        for (const [key, value] of instrValue.properties) {
          properties.push(`${key}: ${printPlace(value)}`);
        }
      }
      value = `Object { ${properties.join(", ")} }`;
      break;
    }
    case "UnaryExpression": {
      value = `Unary ${printPlace(instrValue.value)}`;
      break;
    }
    case "BinaryExpression": {
      value = `Binary ${printPlace(instrValue.left)} ${
        instrValue.operator
      } ${printPlace(instrValue.right)}`;
      break;
    }
    case "CallExpression": {
      value = `Call ${printPlace(instrValue.callee)}(${instrValue.args
        .map((arg) => printPlace(arg))
        .join(", ")})`;
      break;
    }
    case "JSXText":
    case "Primitive": {
      value = JSON.stringify(instrValue.value);
      break;
    }
    case "JsxExpression": {
      const propItems = [];
      for (const [prop, value] of instrValue.props) {
        propItems.push(`${prop}={${printPlace(value)}}`);
      }
      const props = propItems.length !== 0 ? " " + propItems.join(" ") : "";
      if (instrValue.children !== null) {
        const children = instrValue.children.map((child) => {
          return `{${printPlace(child)}}`;
        });
        value = `JSX <${printPlace(instrValue.tag)}${props}${
          props.length > 0 ? " " : ""
        }>${children.join("")}</${printPlace(instrValue.tag)}>`;
      } else {
        value = `JSX <${printPlace(instrValue.tag)}${props}${
          props.length > 0 ? " " : ""
        }/>`;
      }
      break;
    }
    case "NewExpression": {
      value = `New ${printPlace(instrValue.callee)}(${instrValue.args
        .map((arg) => printPlace(arg))
        .join(", ")})`;
      break;
    }
    case "OtherStatement": {
      value = `OtherStatement(${generate(instrValue.node).code})`;
      break;
    }
    case "Identifier": {
      value = printPlace(instrValue);
      break;
    }
    default: {
      assertExhaustive(
        instrValue,
        `Unexpected instruction kind '${
          (instrValue as any as InstructionValue).kind
        }'`
      );
    }
  }
  return value;
}

export function printLValue(lval: LValue): string {
  const place = printPlace(lval.place);
  switch (lval.kind) {
    case InstructionKind.Let: {
      return `Let ${place}`;
    }
    case InstructionKind.Const: {
      return `Const ${place}`;
    }
    case InstructionKind.Reassign: {
      return `Reassign ${place}`;
    }
    default: {
      assertExhaustive(lval.kind, `Unexpected lvalue kind '${lval.kind}'`);
    }
  }
}

export function printPlace(place: Place): string {
  const items = [place.effect, " ", printIdentifier(place.identifier)];
  if (place.memberPath != null) {
    for (const path of place.memberPath) {
      items.push(".");
      items.push(path);
    }
  }
  return items.filter((x) => x != null).join("");
}

export function printIdentifier(id: Identifier): string {
  return `${id.name ?? ""}\$${id.id}`;
}

export function printSourceLocation(loc: SourceLocation): string {
  if (typeof loc === "symbol") {
    return "generated";
  } else {
    return `${loc.start.line}:${loc.start.column}:${loc.end.line}:${loc.end.column}`;
  }
}
