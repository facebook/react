/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import { assertExhaustive } from "../Common/utils";
import { invariant } from "../CompilerError";
import {
  BasicBlock,
  HIR,
  HIRFunction,
  Identifier,
  IdentifierId,
  Instruction,
  InstructionKind,
  LValue,
  Place,
} from "./HIR";
import { todoInvariant } from "./todo";

/**
 * Converts HIR into Babel nodes, which can then be printed into source text.
 * Note that converting source to HIR and back is not guaranteed to produce
 * identicl source text: instead, it is guaranteed to produce semantically
 * equivalent JavaScript. Where possible the original shape of the source
 * code is preserved. Notably, temporary variables are only introduced
 * where strictly necessary such that in general the only variable declarations
 * that appear in the output are those that appeared in the input.
 *
 * However, it is expected that minor changes may occur, such as splitting
 * multiple variable declarations into one, converting `else` branches
 * into fallthrough branches, etc.
 *
 * Also, the *semantics* of variable resolution are preserved, but the exact
 * original block structure is *not* guaranteed to be preserved. As such,
 * variable names in the output may have a suffix attached to distinguish them.
 * It is expected that the output will be passed through a minifier which can
 * rename variables to reduce code size. In theory minification could be
 * performed as an HIR optimization pass, that is left todo for the time being.
 */
export default function codegen(fn: HIRFunction): t.Function {
  const entry = fn.body.blocks.get(fn.body.entry)!;
  const cx: Context = { ir: fn.body, temp: new Map() };
  const body = codegenBlock(cx, entry);
  const params = fn.params.map((param) => convertIdentifier(param.identifier));
  return t.functionDeclaration(
    fn.id !== null ? convertIdentifier(fn.id) : null,
    params,
    body,
    fn.generator,
    fn.async
  );
}

type Context = {
  ir: HIR;
  temp: Map<IdentifierId, t.Expression>;
};

function codegenBlock(cx: Context, block: BasicBlock): t.BlockStatement {
  const body: Array<t.Statement> = [];
  writeBlock(cx, block, body);
  return t.blockStatement(body);
}

function writeBlock(cx: Context, block: BasicBlock, body: Array<t.Statement>) {
  for (const instr of block.instructions) {
    writeInstr(cx, instr, body);
  }
  const terminal = block.terminal;
  switch (terminal.kind) {
    case "return": {
      const value =
        terminal.value != null ? codegenPlace(cx, terminal.value) : null;
      body.push(t.returnStatement(value));
      break;
    }
    case "throw": {
      const value = codegenPlace(cx, terminal.value);
      body.push(t.throwStatement(value));
      break;
    }
    case "if": {
      const test = codegenPlace(cx, terminal.test);
      const consequent = codegenBlock(
        cx,
        cx.ir.blocks.get(terminal.consequent)!
      );
      const fallthrough =
        terminal.fallthrough !== null &&
        terminal.fallthrough !== terminal.alternate
          ? terminal.fallthrough
          : null;
      if (fallthrough !== null) {
        const alternate = codegenBlock(
          cx,
          cx.ir.blocks.get(terminal.alternate)!
        );
        body.push(t.ifStatement(test, consequent, alternate));
        const fallthroughBlock = cx.ir.blocks.get(fallthrough)!;
        writeBlock(cx, fallthroughBlock, body);
      } else {
        body.push(t.ifStatement(test, consequent));
        writeBlock(cx, cx.ir.blocks.get(terminal.alternate)!, body);
      }
      break;
    }
    case "goto": {
      body.push(
        t.expressionStatement(
          t.stringLiteral("<<TODO: handle complex control flow in codegen>>")
        )
      );
      break;
    }
    case "switch": {
      const cases: Array<t.SwitchCase> = [];
      terminal.cases.forEach((case_, index) => {
        const test = case_.test !== null ? codegenPlace(cx, case_.test) : null;
        // If the final case is a `default` *and* points directly to the
        // fallthrough branch, then we can skip emitting `default: break`
        // since this implied. For a default in any other position, or
        // for a default pointing to a different block, emit a case
        // normally.
        if (
          index === terminal.cases.length - 1 &&
          test === null &&
          case_.block === terminal.fallthrough
        ) {
          return;
        } else if (case_.block === terminal.fallthrough) {
          // Otherwise for any block that points directly to the fallthrough,
          // emit a break instead
          cases.push(t.switchCase(test, [t.breakStatement()]));
        } else {
          const consequent = codegenBlock(cx, cx.ir.blocks.get(case_.block)!);
          cases.push(t.switchCase(test, [consequent]));
        }
      });
      body.push(t.switchStatement(codegenPlace(cx, terminal.test), cases));
      if (terminal.fallthrough !== null) {
        writeBlock(cx, cx.ir.blocks.get(terminal.fallthrough)!, body);
      }
      break;
    }
    default: {
      assertExhaustive(terminal, "Unexpected terminal");
    }
  }
}

function writeInstr(cx: Context, instr: Instruction, body: Array<t.Statement>) {
  let value: t.Expression;
  const instrValue = instr.value;
  switch (instrValue.kind) {
    case "ArrayExpression": {
      const elements = instrValue.elements.map((element) =>
        codegenPlace(cx, element)
      );
      value = t.arrayExpression(elements);
      break;
    }
    case "BinaryExpression": {
      const left = codegenPlace(cx, instrValue.left);
      const right = codegenPlace(cx, instrValue.right);
      value = t.binaryExpression(instrValue.operator, left, right);
      break;
    }
    case "UnaryExpression": {
      value = t.unaryExpression(
        instrValue.operator as "throw", // todo
        codegenPlace(cx, instrValue.value)
      );
      break;
    }
    case "Primitive": {
      value = codegenValue(cx, instrValue.value);
      break;
    }
    case "CallExpression": {
      const callee = codegenPlace(cx, instrValue.callee);
      const args = instrValue.args.map((arg) => codegenPlace(cx, arg));
      value = t.callExpression(callee, args);
      break;
    }
    case "NewExpression": {
      const callee = codegenPlace(cx, instrValue.callee);
      const args = instrValue.args.map((arg) => codegenPlace(cx, arg));
      value = t.newExpression(callee, args);
      break;
    }
    case "ObjectExpression": {
      const properties = [];
      if (instrValue.properties !== null) {
        for (const [property, value] of instrValue.properties) {
          properties.push(
            t.objectProperty(t.stringLiteral(property), codegenPlace(cx, value))
          );
        }
      }
      value = t.objectExpression(properties);
      break;
    }
    case "JSXText": {
      value = t.stringLiteral(instrValue.value);
      break;
    }
    case "JsxExpression": {
      const attributes: Array<t.JSXAttribute> = [];
      for (const [prop, value] of instrValue.props) {
        attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier(prop),
            t.jsxExpressionContainer(codegenPlace(cx, value))
          )
        );
      }
      let tagValue = codegenPlace(cx, instrValue.tag);
      let tag: string;
      if (tagValue.type === "Identifier") {
        tag = tagValue.name;
      } else {
        invariant(
          tagValue.type === "StringLiteral",
          "Expected JSX tag to be an identifier or string"
        );
        tag = tagValue.value;
      }
      const children =
        instrValue.children !== null
          ? instrValue.children.map((child) => codegenJsxElement(cx, child))
          : [];
      value = t.jsxElement(
        t.jsxOpeningElement(
          t.jsxIdentifier(tag),
          attributes,
          instrValue.children === null
        ),
        instrValue.children !== null
          ? t.jsxClosingElement(t.jsxIdentifier(tag))
          : null,
        children,
        instrValue.children === null
      );
      break;
    }
    case "OtherStatement": {
      const node = instrValue.node;
      if (t.isStatement(node)) {
        body.push(node);
        return;
      }
      value = node as any; // TODO(josephsavona) complete handling of JSX fragment/spreadchild elements
      break;
    }
    case "Identifier": {
      value = codegenPlace(cx, instrValue);
      break;
    }
    default: {
      assertExhaustive(instrValue, "Unexpected instruction kind");
    }
  }
  if (instr.lvalue !== null) {
    if (
      instr.lvalue.place.identifier.name === null &&
      instr.lvalue.place.memberPath === null
    ) {
      // Temporary value: don't immediately emit, instead save the value to refer to later
      cx.temp.set(instr.lvalue.place.identifier.id, value);
    } else {
      switch (instr.lvalue.kind) {
        case InstructionKind.Const: {
          body.push(
            t.variableDeclaration("const", [
              t.variableDeclarator(codegenLVal(instr.lvalue), value),
            ])
          );
          break;
        }
        case InstructionKind.Let: {
          body.push(
            t.variableDeclaration("let", [
              t.variableDeclarator(codegenLVal(instr.lvalue), value),
            ])
          );
          break;
        }
        case InstructionKind.Reassign: {
          body.push(
            t.expressionStatement(
              t.assignmentExpression("=", codegenLVal(instr.lvalue), value)
            )
          );
          break;
        }
        default: {
          assertExhaustive(
            instr.lvalue.kind,
            `Unexpected instruction kind '${instr.lvalue.kind}'`
          );
        }
      }
    }
  } else {
    body.push(t.expressionStatement(value));
  }
}

function codegenJsxElement(
  cx: Context,
  place: Place
):
  | t.JSXText
  | t.JSXExpressionContainer
  | t.JSXSpreadChild
  | t.JSXElement
  | t.JSXFragment {
  const value = codegenPlace(cx, place);
  switch (value.type) {
    case "StringLiteral": {
      return t.jsxText(value.value);
    }
    default: {
      return t.jsxExpressionContainer(value);
    }
  }
}

function codegenLVal(lval: LValue): t.LVal {
  return convertIdentifier(lval.place.identifier);
}

function codegenValue(
  cx: Context,
  value: boolean | number | string | null | undefined
): t.Expression {
  if (typeof value === "number") {
    return t.numericLiteral(value);
  } else if (typeof value === "boolean") {
    return t.booleanLiteral(value);
  } else if (typeof value === "string") {
    return t.stringLiteral(value);
  } else if (value === null) {
    return t.nullLiteral();
  } else if (value === undefined) {
    return t.identifier("undefined");
  } else {
    assertExhaustive(value, "Unexpected primitive value kind");
  }
}

function codegenPlace(cx: Context, place: Place): t.Expression {
  todoInvariant(place.kind === "Identifier", "support scope values");
  if (place.memberPath === null) {
    let tmp = cx.temp.get(place.identifier.id);
    if (tmp != null) {
      return tmp;
    }
    return convertIdentifier(place.identifier);
  } else {
    let object: t.Expression = convertIdentifier(place.identifier);
    for (const path of place.memberPath) {
      object = t.memberExpression(object, t.identifier(path));
    }
    return object;
  }
}

function convertIdentifier(identifier: Identifier): t.Identifier {
  if (identifier.name !== null) {
    return t.identifier(`${identifier.name}$${identifier.id}`);
  }
  return t.identifier(`t${identifier.id}`);
}
