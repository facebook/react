/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import invariant from "invariant";
import {
  BlockId,
  GeneratedSource,
  Identifier,
  IdentifierId,
  InstructionKind,
  InstructionValue,
  LValue,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveScopeDependency,
  ReactiveTerminal,
  ReactiveValueBlock,
  SourceLocation,
} from "../HIR/HIR";
import { todoInvariant } from "../Utils/todo";
import { assertExhaustive } from "../Utils/utils";

export function codegenReactiveFunction(fn: ReactiveFunction): t.Function {
  const cx = new Context();
  const params = fn.params.map((param) => convertIdentifier(param.identifier));
  const body = codegenBlock(cx, fn.body);
  const statements = body.body;
  if (statements.length !== 0) {
    const last = statements[statements.length - 1];
    if (last.type === "ReturnStatement" && last.argument == null) {
      statements.pop();
    }
  }
  if (cx.nextCacheIndex !== 0) {
    statements.unshift(
      t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier("$"),
          t.callExpression(
            t.memberExpression(
              t.identifier("React"),
              t.identifier("useMemoCache")
            ),
            []
          )
        ),
      ])
    );
  }
  return createFunctionDeclaration(
    fn.loc,
    fn.id !== null ? convertIdentifier(fn.id) : null,
    params,
    body,
    fn.generator,
    fn.async
  );
}

class Context {
  #nextCacheIndex: number = 0;
  #identifiers: Set<Identifier> = new Set();
  temp: Temporaries = new Map();

  get nextCacheIndex(): number {
    return this.#nextCacheIndex++;
  }

  declare(identifier: Identifier): void {
    this.#identifiers.add(identifier);
  }

  declared(identifier: Identifier): boolean {
    return this.#identifiers.has(identifier);
  }
}

function codegenBlock(cx: Context, block: ReactiveBlock): t.BlockStatement {
  const statements: Array<t.Statement> = [];
  for (const item of block) {
    switch (item.kind) {
      case "instruction": {
        const statement = codegenInstructionNullable(
          cx,
          item.instruction,
          codegenInstructionValue(cx.temp, item.instruction.value)
        );
        if (statement !== null) {
          statements.push(statement);
        }
        break;
      }
      case "scope": {
        codegenReactiveScope(cx, statements, item.scope, item.instructions);
        break;
      }
      case "terminal": {
        const statement = codegenTerminal(cx, item.terminal);
        if (statement === null) {
          break;
        }
        if (item.label !== null) {
          statements.push(
            t.labeledStatement(
              t.identifier(codegenLabel(item.label)),
              statement
            )
          );
        } else {
          statements.push(statement);
        }
        break;
      }
      default: {
        assertExhaustive(item, `Unexpected item kind '${(item as any).kind}'`);
      }
    }
  }
  return t.blockStatement(statements);
}

function codegenReactiveScope(
  cx: Context,
  statements: Array<t.Statement>,
  scope: ReactiveScope,
  block: ReactiveBlock
): void {
  const cacheStoreStatements: Array<t.Statement> = [];
  const cacheLoadStatements: Array<t.Statement> = [];
  const changeIdentifiers: Array<t.Identifier> = [];
  for (const dep of scope.dependencies) {
    const index = cx.nextCacheIndex;
    const changeIdentifier = t.identifier(`c_${index}`);
    const depValue = codegenDependency(cx, dep);

    changeIdentifiers.push(changeIdentifier);
    statements.push(
      t.variableDeclaration("const", [
        t.variableDeclarator(
          changeIdentifier,
          t.binaryExpression(
            "!==",
            t.memberExpression(
              t.identifier("$"),
              t.numericLiteral(index),
              true
            ),
            depValue
          )
        ),
      ])
    );
    cacheStoreStatements.push(
      t.expressionStatement(
        t.assignmentExpression(
          "=",
          t.memberExpression(t.identifier("$"), t.numericLiteral(index), true),
          depValue
        )
      )
    );
  }
  let firstOutputIndex: number | null = null;
  for (const output of scope.outputs) {
    const index = cx.nextCacheIndex;
    if (firstOutputIndex === null) {
      firstOutputIndex = index;
    }

    // TODO @josephsavona: ensure change and temp variables have non-conflicting names
    output.name ??= `t${index}`;

    const name = convertIdentifier(output);
    cx.declare(output);
    statements.push(t.variableDeclaration("let", [t.variableDeclarator(name)]));
    cacheStoreStatements.push(
      t.expressionStatement(
        t.assignmentExpression(
          "=",
          t.memberExpression(t.identifier("$"), t.numericLiteral(index), true),
          name
        )
      )
    );
    cacheLoadStatements.push(
      t.expressionStatement(
        t.assignmentExpression(
          "=",
          name,
          t.memberExpression(t.identifier("$"), t.numericLiteral(index), true)
        )
      )
    );
  }
  invariant(
    firstOutputIndex !== null,
    "Expected scope '@%s' to have at least one output",
    scope.id
  );
  let testCondition = (changeIdentifiers as Array<t.Expression>).reduce(
    (acc: t.Expression | null, ident: t.Expression) => {
      if (acc == null) {
        return ident;
      }
      return t.logicalExpression("||", acc, ident);
    },
    null as t.Expression | null
  );
  if (testCondition === null) {
    testCondition = t.binaryExpression(
      "===",
      t.memberExpression(
        t.identifier("$"),
        t.numericLiteral(firstOutputIndex),
        true
      ),
      t.callExpression(
        t.memberExpression(t.identifier("Symbol"), t.identifier("for")),
        [t.stringLiteral("react.memo_cache_sentinel")]
      )
    );
  }

  const computationBlock = codegenBlock(cx, block);
  computationBlock.body.push(...cacheStoreStatements);
  const memoBlock = t.blockStatement(cacheLoadStatements);
  statements.push(t.ifStatement(testCondition, computationBlock, memoBlock));
}

function codegenTerminal(
  cx: Context,
  terminal: ReactiveTerminal
): t.Statement | null {
  switch (terminal.kind) {
    case "break": {
      if (terminal.implicit) {
        return null;
      }
      return t.breakStatement(
        terminal.label !== null
          ? t.identifier(codegenLabel(terminal.label))
          : null
      );
    }
    case "continue": {
      if (terminal.implicit) {
        return null;
      }
      return t.continueStatement(
        terminal.label !== null
          ? t.identifier(codegenLabel(terminal.label))
          : null
      );
    }
    case "for": {
      return t.forStatement(
        codegenForInit(cx, terminal.init),
        codegenValueBlock(cx, terminal.test),
        codegenValueBlock(cx, terminal.update),
        codegenBlock(cx, terminal.loop)
      );
    }
    case "if": {
      return t.ifStatement(
        codegenPlace(cx.temp, terminal.test),
        codegenBlock(cx, terminal.consequent),
        terminal.alternate !== null
          ? codegenBlock(cx, terminal.alternate)
          : null
      );
    }
    case "return": {
      return t.returnStatement(
        terminal.value !== null ? codegenPlace(cx.temp, terminal.value) : null
      );
    }
    case "switch": {
      return t.switchStatement(
        codegenPlace(cx.temp, terminal.test),
        terminal.cases.map((case_) => {
          const test =
            case_.test !== null ? codegenPlace(cx.temp, case_.test) : null;
          const block = codegenBlock(cx, case_.block!);
          return t.switchCase(test, [block]);
        })
      );
    }
    case "throw": {
      return t.throwStatement(codegenPlace(cx.temp, terminal.value));
    }
    case "while": {
      const test = codegenValueBlock(cx, terminal.test);
      return t.whileStatement(test, codegenBlock(cx, terminal.loop));
    }
    default: {
      assertExhaustive(
        terminal,
        `Unexpected terminal kind '${(terminal as any).kind}'`
      );
    }
  }
}

function codegenInstructionNullable(
  cx: Context,
  instr: ReactiveInstruction,
  value: t.Expression
): t.Statement | null {
  let statement;
  if (instr.lvalue !== null && cx.declared(instr.lvalue.place.identifier)) {
    statement = codegenInstruction(
      cx.temp,
      {
        ...instr,
        lvalue: {
          ...instr.lvalue,
          kind: InstructionKind.Reassign,
        },
      },
      value
    );
  } else {
    statement = codegenInstruction(cx.temp, instr, value);
  }
  if (statement.type === "EmptyStatement") {
    return null;
  }
  return statement;
}

function codegenForInit(
  cx: Context,
  init: ReactiveValueBlock
): t.Expression | t.VariableDeclaration | null {
  const body = codegenBlock(cx, init.instructions).body;
  if (init.last !== null) {
    invariant(
      body.length === 0,
      "Expected for init block to produce only temporaries"
    );
    return codegenInstructionValue(cx.temp, init.last.value);
  } else {
    invariant(
      body.length === 1,
      "Expected for init to have a variable declaration"
    );
    const declaration = body[0]!;
    invariant(
      declaration.type === "VariableDeclaration",
      "Expected a variable declaration"
    );
    return declaration;
  }
}

function codegenValueBlock(
  cx: Context,
  block: ReactiveValueBlock
): t.Expression {
  const body = codegenBlock(cx, block.instructions).body;
  const expressions = body.map((stmt) => {
    if (stmt.type === "ExpressionStatement") {
      return stmt.expression;
    } else {
      todoInvariant(false, `Handle conversion of ${stmt.type} to expression`);
    }
  });
  if (block.last !== null) {
    const value = codegenInstructionValue(cx.temp, block.last.value);
    expressions.push(value);
  }
  invariant(
    expressions.length !== 0,
    "Expected a value block to produce one or more expressions"
  );
  if (expressions.length === 1) {
    return expressions[0];
  } else {
    return t.sequenceExpression(expressions);
  }
}

function codegenDependency(
  cx: Context,
  dependency: ReactiveScopeDependency
): t.Expression {
  let object: t.Expression = convertIdentifier(dependency.place.identifier);
  if (dependency.path !== null) {
    for (const path of dependency.path) {
      object = t.memberExpression(object, t.identifier(path));
    }
  }
  return object;
}

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

const createBinaryExpression = withLoc(t.binaryExpression);
const createCallExpression = withLoc(t.callExpression);
const createExpressionStatement = withLoc(t.expressionStatement);
const createFunctionDeclaration = withLoc(t.functionDeclaration);
const createLabelledStatement = withLoc(t.labeledStatement);
const createVariableDeclaration = withLoc(t.variableDeclaration);
const createWhileStatement = withLoc(t.whileStatement);

type Temporaries = Map<IdentifierId, t.Expression>;

function codegenLabel(id: BlockId): string {
  return `bb${id}`;
}

function codegenInstruction(
  temp: Temporaries,
  instr: ReactiveInstruction,
  value: t.Expression
): t.Statement {
  if (t.isStatement(value)) {
    return value;
  }
  if (instr.lvalue === null) {
    return t.expressionStatement(value);
  }
  if (instr.lvalue.place.identifier.name === null) {
    // temporary
    temp.set(instr.lvalue.place.identifier.id, value);
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

function codegenInstructionValue(
  temp: Temporaries,
  instrValue: InstructionValue
): t.Expression {
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
      value = createBinaryExpression(
        instrValue.loc,
        instrValue.operator,
        left,
        right
      );
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
      value = createCallExpression(instrValue.loc, callee, args);
      break;
    }
    case "PropertyCall": {
      const receiver = codegenPlace(temp, instrValue.receiver);
      const callee = t.memberExpression(
        receiver,
        t.identifier(instrValue.property)
      );
      const args = instrValue.args.map((arg) => codegenPlace(temp, arg));
      value = createCallExpression(instrValue.loc, callee, args);
      break;
    }
    case "ComputedCall": {
      const receiver = codegenPlace(temp, instrValue.receiver);
      const property = codegenPlace(temp, instrValue.property);
      const callee = t.memberExpression(receiver, property, true);
      const args = instrValue.args.map((arg) => codegenPlace(temp, arg));
      value = createCallExpression(instrValue.loc, callee, args);
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
    case "UnsupportedNode": {
      const node = instrValue.node;
      if (!t.isExpression(node)) {
        return node as any; // TODO handle statements, jsx fragments
      }
      value = node;
      break;
    }
    case "PropertyStore": {
      value = t.assignmentExpression(
        "=",
        t.memberExpression(
          codegenPlace(temp, instrValue.object),
          t.identifier(instrValue.property)
        ),
        codegenPlace(temp, instrValue.value)
      );
      break;
    }
    case "PropertyLoad": {
      value = t.memberExpression(
        codegenPlace(temp, instrValue.object),
        t.identifier(instrValue.property)
      );
      break;
    }
    case "ComputedStore": {
      value = t.assignmentExpression(
        "=",
        t.memberExpression(
          codegenPlace(temp, instrValue.object),
          codegenPlace(temp, instrValue.property),
          true
        ),
        codegenPlace(temp, instrValue.value)
      );
      break;
    }
    case "ComputedLoad": {
      value = t.memberExpression(
        codegenPlace(temp, instrValue.object),
        codegenPlace(temp, instrValue.property),
        true
      );
      break;
    }
    case "Identifier": {
      value = codegenPlace(temp, instrValue);
      break;
    }
    case "FunctionExpression": {
      const id =
        instrValue.name !== null ? t.identifier(instrValue.name) : null;
      const params = instrValue.params.map((p) => t.identifier(p));
      value = t.functionExpression(id, params, instrValue.body);
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
  return convertIdentifier(lval.place.identifier);
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
  let tmp = temp.get(place.identifier.id);
  if (tmp != null) {
    return tmp;
  }
  return convertIdentifier(place.identifier);
}

function convertIdentifier(identifier: Identifier): t.Identifier {
  if (identifier.name !== null) {
    return t.identifier(`${identifier.name}`);
  }
  return t.identifier(`t${identifier.id}`);
}
