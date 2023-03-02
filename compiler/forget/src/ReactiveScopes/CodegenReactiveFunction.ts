/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import invariant from "invariant";
import { CompilerError, ErrorSeverity } from "../CompilerError";
import {
  BlockId,
  GeneratedSource,
  Identifier,
  IdentifierId,
  InstructionKind,
  LValue,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveScopeDependency,
  ReactiveTerminal,
  ReactiveValue,
  SourceLocation,
} from "../HIR/HIR";
import { Err, Ok, Result } from "../Utils/Result";
import { assertExhaustive } from "../Utils/utils";

export function codegenReactiveFunction(
  fn: ReactiveFunction
): Result<t.FunctionDeclaration, CompilerError> {
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
  const cacheCount = cx.nextCacheIndex;
  if (cacheCount !== 0) {
    statements.unshift(
      t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier("$"),
          t.callExpression(
            t.memberExpression(
              t.identifier("React"),
              t.identifier("unstable_useMemoCache")
            ),
            [t.numericLiteral(cacheCount)]
          )
        ),
      ])
    );
  }

  if (cx.errors.hasErrors()) {
    return Err(cx.errors);
  }

  return Ok(
    createFunctionDeclaration(
      fn.loc,
      fn.id !== null ? convertIdentifier(fn.id) : null,
      params,
      body,
      fn.generator,
      fn.async
    )
  );
}

class Context {
  #nextCacheIndex: number = 0;
  #declarations: Set<IdentifierId> = new Set();
  temp: Temporaries = new Map();
  errors: CompilerError = new CompilerError();

  get nextCacheIndex(): number {
    return this.#nextCacheIndex++;
  }

  declare(identifier: Identifier): void {
    this.#declarations.add(identifier.id);
  }

  hasDeclared(identifier: Identifier): boolean {
    return this.#declarations.has(identifier.id);
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
          codegenInstructionValue(cx, item.instruction.value)
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
  for (const [, declaration] of scope.declarations) {
    const index = cx.nextCacheIndex;
    if (firstOutputIndex === null) {
      firstOutputIndex = index;
    }

    invariant(
      declaration.name != null,
      "Expected identifier '@%s' to be named",
      declaration.id
    );

    const name = convertIdentifier(declaration);
    if (!cx.hasDeclared(declaration)) {
      statements.push(
        t.variableDeclaration("let", [t.variableDeclarator(name)])
      );
    }
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
    cx.declare(declaration);
  }
  for (const reassignment of scope.reassignments) {
    const index = cx.nextCacheIndex;
    if (firstOutputIndex === null) {
      firstOutputIndex = index;
    }
    const name = convertIdentifier(reassignment);

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
    invariant(
      firstOutputIndex !== null,
      "Expected scope '@%s' to have at least one declaration",
      scope.id
    );
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
        codegenInstructionValue(cx, terminal.test),
        codegenInstructionValue(cx, terminal.update),
        codegenBlock(cx, terminal.loop)
      );
    }
    case "if": {
      return t.ifStatement(
        codegenPlace(cx, terminal.test),
        codegenBlock(cx, terminal.consequent),
        terminal.alternate !== null
          ? codegenBlock(cx, terminal.alternate)
          : null
      );
    }
    case "return": {
      return t.returnStatement(
        terminal.value !== null ? codegenPlace(cx, terminal.value) : null
      );
    }
    case "switch": {
      return t.switchStatement(
        codegenPlace(cx, terminal.test),
        terminal.cases.map((case_) => {
          const test =
            case_.test !== null ? codegenPlace(cx, case_.test) : null;
          const block = codegenBlock(cx, case_.block!);
          return t.switchCase(test, [block]);
        })
      );
    }
    case "throw": {
      return t.throwStatement(codegenPlace(cx, terminal.value));
    }
    case "while": {
      const test = codegenInstructionValue(cx, terminal.test);
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
  if (instr.lvalue !== null && cx.hasDeclared(instr.lvalue.place.identifier)) {
    statement = codegenInstruction(
      cx,
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
    statement = codegenInstruction(cx, instr, value);
  }
  if (statement.type === "EmptyStatement") {
    return null;
  }
  return statement;
}

function codegenForInit(
  cx: Context,
  init: ReactiveValue
): t.Expression | t.VariableDeclaration | null {
  if (init.kind === "SequenceExpression") {
    const body = codegenBlock(
      cx,
      init.instructions.map((instruction) => ({
        kind: "instruction",
        instruction,
      }))
    ).body;
    const declaration = body[0]!;
    invariant(
      declaration.type === "VariableDeclaration",
      "Expected a variable declaration"
    );
    return declaration;
  } else {
    return codegenInstructionValue(cx, init);
  }
}

function codegenDependency(
  cx: Context,
  dependency: ReactiveScopeDependency
): t.Expression {
  let object: t.Expression = convertIdentifier(dependency.identifier);
  if (dependency.path !== null) {
    for (const path of dependency.path) {
      object = t.memberExpression(object, t.identifier(path));
    }
  }
  return object;
}

function withLoc<T extends (...args: any[]) => t.Node>(
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
    return node as ReturnType<T>;
  };
}

const createBinaryExpression = withLoc(t.binaryExpression);
const createCallExpression = withLoc(t.callExpression);
const createExpressionStatement = withLoc(t.expressionStatement);
const createFunctionDeclaration = withLoc(t.functionDeclaration);
const _createLabelledStatement = withLoc(t.labeledStatement);
const createVariableDeclaration = withLoc(t.variableDeclaration);
const _createWhileStatement = withLoc(t.whileStatement);
const createTaggedTemplateExpression = withLoc(t.taggedTemplateExpression);
const createLogicalExpression = withLoc(t.logicalExpression);
const createSequenceExpression = withLoc(t.sequenceExpression);
const createConditionalExpression = withLoc(t.conditionalExpression);
const createTemplateLiteral = withLoc(t.templateLiteral);

type Temporaries = Map<IdentifierId, t.Expression>;

function codegenLabel(id: BlockId): string {
  return `bb${id}`;
}

function codegenInstruction(
  cx: Context,
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
    cx.temp.set(instr.lvalue.place.identifier.id, value);
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
  cx: Context,
  instrValue: ReactiveValue
): t.Expression {
  let value: t.Expression;
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
      value = createCallExpression(instrValue.loc, callee, args);
      break;
    }
    case "PropertyCall": {
      const receiver = codegenPlace(cx, instrValue.receiver);
      const callee = t.memberExpression(
        receiver,
        t.identifier(instrValue.property)
      );
      const args = instrValue.args.map((arg) => codegenPlace(cx, arg));
      value = createCallExpression(instrValue.loc, callee, args);
      break;
    }
    case "ComputedCall": {
      const receiver = codegenPlace(cx, instrValue.receiver);
      const property = codegenPlace(cx, instrValue.property);
      const callee = t.memberExpression(receiver, property, true);
      const args = instrValue.args.map((arg) => codegenPlace(cx, arg));
      value = createCallExpression(instrValue.loc, callee, args);
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
      const attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute> = [];
      for (const attribute of instrValue.props) {
        switch (attribute.kind) {
          case "JsxAttribute": {
            attributes.push(
              t.jsxAttribute(
                t.jsxIdentifier(attribute.name),
                t.jsxExpressionContainer(codegenPlace(cx, attribute.place))
              )
            );
            break;
          }
          case "JsxSpreadAttribute": {
            attributes.push(
              t.jsxSpreadAttribute(codegenPlace(cx, attribute.argument))
            );
            break;
          }
          default: {
            assertExhaustive(
              attribute,
              `Unexpected attribute kind '${(attribute as any).kind}'`
            );
          }
        }
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
    case "JsxFragment": {
      value = t.jsxFragment(
        t.jsxOpeningFragment(),
        t.jsxClosingFragment(),
        instrValue.children.map((child) => codegenJsxElement(cx, child))
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
          codegenPlace(cx, instrValue.object),
          t.identifier(instrValue.property)
        ),
        codegenPlace(cx, instrValue.value)
      );
      break;
    }
    case "PropertyLoad": {
      if (instrValue.optional) {
        value = t.optionalMemberExpression(
          codegenPlace(cx, instrValue.object),
          t.identifier(instrValue.property),
          undefined,
          true
        );
      } else {
        value = t.memberExpression(
          codegenPlace(cx, instrValue.object),
          t.identifier(instrValue.property)
        );
      }
      break;
    }
    case "ComputedStore": {
      value = t.assignmentExpression(
        "=",
        t.memberExpression(
          codegenPlace(cx, instrValue.object),
          codegenPlace(cx, instrValue.property),
          true
        ),
        codegenPlace(cx, instrValue.value)
      );
      break;
    }
    case "ComputedLoad": {
      value = t.memberExpression(
        codegenPlace(cx, instrValue.object),
        codegenPlace(cx, instrValue.property),
        true
      );
      break;
    }
    case "LoadLocal": {
      value = codegenPlace(cx, instrValue.place);
      break;
    }
    case "FunctionExpression": {
      value = instrValue.expr;
      break;
    }
    case "TaggedTemplateExpression": {
      value = createTaggedTemplateExpression(
        instrValue.loc,
        codegenPlace(cx, instrValue.tag),
        t.templateLiteral([t.templateElement(instrValue.value)], [])
      );
      break;
    }
    case "TypeCastExpression": {
      value = t.typeCastExpression(
        codegenPlace(cx, instrValue.value),
        instrValue.type
      );
      break;
    }
    case "LogicalExpression": {
      value = createLogicalExpression(
        instrValue.loc,
        instrValue.operator,
        codegenInstructionValue(cx, instrValue.left),
        codegenInstructionValue(cx, instrValue.right)
      );
      break;
    }
    case "ConditionalExpression": {
      value = createConditionalExpression(
        instrValue.loc,
        codegenInstructionValue(cx, instrValue.test),
        codegenInstructionValue(cx, instrValue.consequent),
        codegenInstructionValue(cx, instrValue.alternate)
      );
      break;
    }
    case "SequenceExpression": {
      const body = codegenBlock(
        cx,
        instrValue.instructions.map((instruction) => ({
          kind: "instruction",
          instruction,
        }))
      ).body;
      const expressions = body.map((stmt) => {
        if (stmt.type === "ExpressionStatement") {
          return stmt.expression;
        } else {
          if (t.isVariableDeclaration(stmt)) {
            const declarator = stmt.declarations[0];
            cx.errors.push({
              reason: `(CodegenReactiveFunction::codegenInstructionValue) Cannot declare variables in a value block, tried to declare '${
                (declarator.id as t.Identifier).name
              }'`,
              severity: ErrorSeverity.Todo,
              nodePath: null,
            });
            return t.stringLiteral(`TODO handle ${declarator.id}`);
          } else {
            cx.errors.push({
              reason: `(CodegenReactiveFunction::codegenInstructionValue) Handle conversion of ${stmt.type} to expression`,
              severity: ErrorSeverity.Todo,
              nodePath: null,
            });
            return t.stringLiteral(`TODO handle ${stmt.type}`);
          }
        }
      });
      if (expressions.length === 0) {
        value = codegenInstructionValue(cx, instrValue.value);
      } else {
        value = createSequenceExpression(instrValue.loc, [
          ...expressions,
          codegenInstructionValue(cx, instrValue.value),
        ]);
      }
      break;
    }
    case "TemplateLiteral": {
      value = createTemplateLiteral(
        instrValue.loc,
        instrValue.quasis.map((q) => t.templateElement(q)),
        instrValue.subexprs.map((p) => codegenPlace(cx, p))
      );
      break;
    }
    case "LoadGlobal": {
      value = t.identifier(instrValue.name);
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
  let tmp = cx.temp.get(place.identifier.id);
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
