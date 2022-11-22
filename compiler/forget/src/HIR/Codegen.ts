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
  GeneratedSource,
  HIRFunction,
  Identifier,
  IdentifierId,
  Instruction,
  InstructionId,
  InstructionKind,
  InstructionValue,
  LValue,
  Place,
  SourceLocation,
} from "./HIR";
import { BlockTerminal, Visitor, visitTree } from "./HIRTreeVisitor";
import { todoInvariant } from "./todo";

function withLoc<TNode extends t.Node, T extends (...args: any[]) => TNode>(
  fn: T
): (
  loc: SourceLocation | null | undefined,
  ...args: Parameters<T>
) => ReturnType<T> {
  return (
    loc: SourceLocation | null | undefined,
    ...args: Parameters<T>
  ): ReturnType<T> => {
    const node = fn(...args);
    if (loc != null && loc != GeneratedSource) {
      node.loc = loc;
    }
    // @ts-ignore
    return node;
  };
}

const createExpressionStatement = withLoc(t.expressionStatement);
const createFunctionDeclaration = withLoc(t.functionDeclaration);
const createLabelledStatement = withLoc(t.labeledStatement);
const createVariableDeclaration = withLoc(t.variableDeclaration);
const createWhileStatement = withLoc(t.whileStatement);

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
  const visitor = new CodegenVisitor();
  const body = visitTree(fn, visitor);
  invariant(t.isBlockStatement(body), "Expected a block statement");
  const params = fn.params.map((param) => convertIdentifier(param.identifier));
  return createFunctionDeclaration(
    fn.loc,
    fn.id !== null ? convertIdentifier(fn.id) : null,
    params,
    body,
    fn.generator,
    fn.async
  );
}

type Temporaries = Map<IdentifierId, t.Expression>;

class CodegenVisitor
  implements
    Visitor<
      Array<t.Statement>,
      t.Expression | t.Statement | t.JSXFragment,
      t.Statement,
      t.SwitchCase
    >
{
  depth: number = 0;
  temp: Map<IdentifierId, t.Expression> = new Map();

  enterBlock(): t.Statement[] {
    this.depth++;
    return [];
  }
  visitValue(
    value: InstructionValue
  ): t.Expression | t.Statement | t.JSXFragment {
    return codegenInstructionValue(this.temp, value);
  }
  visitInstruction(
    instr: Instruction,
    value: t.Expression | t.Statement | t.JSXFragment
  ): t.Statement {
    if (t.isStatement(value)) {
      return value;
    }
    if (instr.lvalue === null) {
      return t.expressionStatement(value);
    }
    if (
      instr.lvalue.place.memberPath === null &&
      instr.lvalue.place.identifier.name === null
    ) {
      // temporary
      this.temp.set(instr.lvalue.place.identifier.id, value);
      return t.emptyStatement();
    } else {
      switch (instr.lvalue.kind) {
        case InstructionKind.Const: {
          return createVariableDeclaration(instr.loc, "const", [
            t.variableDeclarator(codegenLVal(instr.lvalue), value),
          ]);
        }
        case InstructionKind.Let: {
          return createVariableDeclaration(instr.loc, "let", [
            t.variableDeclarator(codegenLVal(instr.lvalue), value),
          ]);
        }
        case InstructionKind.Reassign: {
          return createExpressionStatement(
            instr.loc,
            t.assignmentExpression("=", codegenLVal(instr.lvalue), value)
          );
        }
        default: {
          assertExhaustive(
            instr.lvalue.kind,
            `Unexpected instruction kind '${instr.lvalue.kind}'`
          );
        }
      }
    }
  }
  visitTerminalId(id: InstructionId): void {}
  visitImplicitTerminal(): t.Statement | null {
    return null;
  }
  visitTerminal(
    terminal: BlockTerminal<
      t.Statement[],
      t.Expression,
      t.Statement,
      t.SwitchCase
    >
  ): t.Statement {
    switch (terminal.kind) {
      case "break": {
        if (terminal.label) {
          return t.breakStatement(t.identifier(terminal.label));
        } else {
          return t.breakStatement();
        }
      }
      case "continue": {
        if (terminal.label) {
          return t.continueStatement(t.identifier(terminal.label));
        } else {
          return t.continueStatement();
        }
      }
      case "if": {
        return t.ifStatement(
          terminal.test,
          terminal.consequent,
          terminal.alternate
        );
      }
      case "switch": {
        return t.switchStatement(terminal.test, terminal.cases);
      }
      case "while": {
        return createWhileStatement(terminal.loc, terminal.test, terminal.loop);
      }
      case "return": {
        if (terminal.value !== null) {
          return t.returnStatement(terminal.value);
        } else if (this.depth === 1) {
          // A return at the top-level of a function must be the last instruction,
          // and functions implicitly return after the last instruction of the top-level.
          // Elide the return.
          return t.emptyStatement();
        } else {
          return t.returnStatement();
        }
      }
      case "throw": {
        return t.throwStatement(terminal.value);
      }
      default: {
        assertExhaustive(
          terminal,
          `Unexpected terminal kind '${(terminal as any).kind}'`
        );
      }
    }
  }
  visitCase(test: t.Expression | null, block: t.Statement): t.SwitchCase {
    return t.switchCase(test, [block]);
  }
  appendBlock(
    block: t.Statement[],
    item: t.Statement,
    label?: string | undefined
  ): void {
    if (item.type === "EmptyStatement") {
      return;
    }
    if (label !== undefined) {
      block.push(createLabelledStatement(item.loc, t.identifier(label), item));
    } else {
      block.push(item);
    }
  }
  leaveBlock(block: t.Statement[]): t.Statement {
    this.depth--;
    return t.blockStatement(block);
  }
}

function codegenInstructionValue(
  temp: Temporaries,
  instrValue: InstructionValue
): t.Expression | t.JSXFragment | t.Statement {
  let value: t.Expression;
  switch (instrValue.kind) {
    case "ArrayExpression": {
      const elements = instrValue.elements.map((element) =>
        codegenPlace(temp, element)
      );
      value = t.arrayExpression(elements);
      break;
    }
    case "BinaryExpression": {
      const left = codegenPlace(temp, instrValue.left);
      const right = codegenPlace(temp, instrValue.right);
      value = t.binaryExpression(instrValue.operator, left, right);
      break;
    }
    case "UnaryExpression": {
      value = t.unaryExpression(
        instrValue.operator as "throw", // todo
        codegenPlace(temp, instrValue.value)
      );
      break;
    }
    case "Primitive": {
      value = codegenValue(temp, instrValue.value);
      break;
    }
    case "CallExpression": {
      const callee = codegenPlace(temp, instrValue.callee);
      const args = instrValue.args.map((arg) => codegenPlace(temp, arg));
      value = t.callExpression(callee, args);
      break;
    }
    case "NewExpression": {
      const callee = codegenPlace(temp, instrValue.callee);
      const args = instrValue.args.map((arg) => codegenPlace(temp, arg));
      value = t.newExpression(callee, args);
      break;
    }
    case "ObjectExpression": {
      const properties = [];
      if (instrValue.properties !== null) {
        for (const [property, value] of instrValue.properties) {
          properties.push(
            t.objectProperty(
              t.stringLiteral(property),
              codegenPlace(temp, value)
            )
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
            t.jsxExpressionContainer(codegenPlace(temp, value))
          )
        );
      }
      let tagValue = codegenPlace(temp, instrValue.tag);
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
          ? instrValue.children.map((child) => codegenJsxElement(temp, child))
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
    case "JsxFragment": {
      value = t.jsxFragment(
        t.jsxOpeningFragment(),
        t.jsxClosingFragment(),
        instrValue.children.map((child) => codegenJsxElement(temp, child))
      );
      break;
    }
    case "OtherStatement": {
      const node = instrValue.node;
      if (!t.isExpression(node)) {
        return node as any; // TODO handle statements, jsx fragments
      }
      value = node;
      break;
    }
    case "Identifier": {
      value = codegenPlace(temp, instrValue);
      break;
    }
    default: {
      assertExhaustive(
        instrValue,
        `Unexpected instruction value kind '${(instrValue as any).kind}'`
      );
    }
  }
  return value;
}

function codegenJsxElement(
  temp: Temporaries,
  place: Place
):
  | t.JSXText
  | t.JSXExpressionContainer
  | t.JSXSpreadChild
  | t.JSXElement
  | t.JSXFragment {
  const value = codegenPlace(temp, place);
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
  const expr = convertIdentifier(lval.place.identifier);
  const memberPath = lval.place.memberPath;
  return memberPath == null
    ? expr
    : memberPath.reduceRight(
        (path: t.Identifier | t.MemberExpression, member) =>
          t.memberExpression(path, t.identifier(member)),
        expr
      );
}

function codegenValue(
  temp: Temporaries,
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

function codegenPlace(temp: Temporaries, place: Place): t.Expression {
  todoInvariant(place.kind === "Identifier", "support scope values");
  if (place.memberPath === null) {
    let tmp = temp.get(place.identifier.id);
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
