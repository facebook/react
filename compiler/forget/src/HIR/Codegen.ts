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
  const node = fn.path.node;
  todoInvariant(
    t.isFunctionDeclaration(node),
    "todo: handle other than function declaration"
  );
  const params = fn.params.map((param) => convertIdentifier(param));
  return t.functionDeclaration(
    fn.id !== null ? convertIdentifier(fn.id) : null,
    params,
    body,
    node.generator,
    node.async
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
  switch (block.terminal.kind) {
    case "return": {
      const value =
        block.terminal.value != null
          ? codegenPlace(cx, block.terminal.value)
          : null;
      body.push(t.returnStatement(value));
      break;
    }
    case "throw": {
      const value = codegenPlace(cx, block.terminal.value);
      body.push(t.throwStatement(value));
      break;
    }
    case "if": {
      const test = codegenPlace(cx, block.terminal.test);
      const consequent = codegenBlock(
        cx,
        cx.ir.blocks.get(block.terminal.consequent)!
      );
      const fallthrough =
        block.terminal.fallthrough !== null &&
        block.terminal.fallthrough !== block.terminal.alternate
          ? block.terminal.fallthrough
          : null;
      if (fallthrough !== null) {
        const alternate = codegenBlock(
          cx,
          cx.ir.blocks.get(block.terminal.alternate)!
        );
        body.push(t.ifStatement(test, consequent, alternate));
        const fallthroughBlock = cx.ir.blocks.get(fallthrough)!;
        writeBlock(cx, fallthroughBlock, body);
      } else {
        body.push(t.ifStatement(test, consequent));
        writeBlock(cx, cx.ir.blocks.get(block.terminal.alternate)!, body);
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
      body.push(
        t.expressionStatement(
          t.stringLiteral("<<TODO: handle switch in codegen>>")
        )
      );
      break;
    }
    default: {
      assertExhaustive(block.terminal, "Unexpected terminal");
    }
  }
}

function writeInstr(cx: Context, instr: Instruction, body: Array<t.Statement>) {
  let value;
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
        for (const [property, value] of Object.entries(instrValue.properties)) {
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
      for (const [prop, value] of Object.entries(instrValue.props)) {
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
      const node = instrValue.path.node;
      if (node != null) {
        invariant(
          t.isStatement(node),
          "Expected node to be a statement if present"
        );
        body.push(node);
      }
      return;
    }
    case "Identifier": {
      value = codegenPlace(cx, instrValue);
      break;
    }
    default: {
      assertExhaustive(instrValue, "Unexpected instruction kind");
    }
  }
  if (instr.place !== null) {
    if (
      instr.place.kind === "Identifier" &&
      instr.place.value.name === null &&
      instr.place.memberPath === null
    ) {
      // Temporary value: don't immediately emit, instead save the value to refer to later
      cx.temp.set(instr.place.value.id, value);
    } else {
      body.push(
        t.expressionStatement(
          t.assignmentExpression("=", codegenLVal(instr.place), value)
        )
      );
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

function codegenLVal(place: Place): t.LVal {
  switch (place.kind) {
    case "Identifier": {
      return convertIdentifier(place.value);
    }
    default: {
      throw new Error("todo other lval kinds");
    }
  }
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
    let tmp = cx.temp.get(place.value.id);
    if (tmp != null) {
      return tmp;
    }
    return convertIdentifier(place.value);
  } else {
    let object: t.Expression = convertIdentifier(place.value);
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
