/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
  JsxAttribute,
  Pattern,
  Place,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveInstruction,
  ReactiveScope,
  ReactiveScopeDependency,
  ReactiveTerminal,
  ReactiveValue,
  SourceLocation,
  SpreadPattern,
} from "../HIR/HIR";
import { printPlace } from "../HIR/PrintHIR";
import { eachPatternOperand } from "../HIR/visitors";
import { Err, Ok, Result } from "../Utils/Result";
import { assertExhaustive } from "../Utils/utils";

export function codegenReactiveFunction(
  fn: ReactiveFunction
): Result<t.FunctionDeclaration, CompilerError> {
  const cx = new Context();
  if (fn.id !== null) {
    cx.temp.set(fn.id.id, null);
  }
  for (const param of fn.params) {
    cx.temp.set(param.identifier.id, null);
  }

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
        const statement = codegenInstructionNullable(cx, item.instruction);
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
        } else if (statement.type === "BlockStatement") {
          statements.push(...statement.body);
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
        terminal.update !== null
          ? codegenInstructionValue(cx, terminal.update)
          : null,
        codegenBlock(cx, terminal.loop)
      );
    }
    case "for-of": {
      if (terminal.init.kind !== "SequenceExpression") {
        CompilerError.invariant(
          `Expected a sequence expression init for ForOf`,
          terminal.init.loc,
          `Got '${terminal.init.kind}' expression instead`
        );
      }
      if (terminal.init.instructions.length !== 2) {
        CompilerError.todo(
          "Support non-trivial ForOf inits",
          terminal.init.loc
        );
      }
      const iterableCollection = terminal.init.instructions[0];
      const iterableItem = terminal.init.instructions[1];
      let lval: t.LVal;
      switch (iterableItem.value.kind) {
        case "StoreLocal": {
          lval = codegenLValue(iterableItem.value.lvalue.place);
          break;
        }
        case "Destructure": {
          lval = codegenLValue(iterableItem.value.lvalue.pattern);
          break;
        }
        default:
          CompilerError.invariant(
            `Expected a StoreLocal or Destructure to be assigned to the collection`,
            iterableItem.value.loc,
            `Found ${iterableItem.value.kind}`
          );
      }
      let varDeclKind: "const" | "let";
      switch (iterableItem.value.lvalue.kind) {
        case InstructionKind.Const:
          varDeclKind = "const" as const;
          break;
        case InstructionKind.Let:
          varDeclKind = "let" as const;
          break;
        case InstructionKind.Reassign:
          CompilerError.invariant(
            "Destructure should never be Reassign as it would be an Object/ArrayPattern",
            iterableItem.loc
          );
        default:
          assertExhaustive(
            iterableItem.value.lvalue.kind,
            `Unhandled lvalue kind: ${iterableItem.value.lvalue.kind}`
          );
      }
      return t.forOfStatement(
        // Special handling here since we only want the VariableDeclarators without any inits
        // This needs to be updated when we handle non-trivial ForOf inits
        createVariableDeclaration(iterableItem.value.loc, varDeclKind, [
          t.variableDeclarator(lval, null),
        ]),
        codegenInstructionValue(cx, iterableCollection.value),
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
      const value = codegenPlace(cx, terminal.value);
      if (value.type === "Identifier" && value.name === "undefined") {
        // Use implicit undefined
        return t.returnStatement();
      }
      return t.returnStatement(value);
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
    case "do-while": {
      const test = codegenInstructionValue(cx, terminal.test);
      return t.doWhileStatement(test, codegenBlock(cx, terminal.loop));
    }
    case "while": {
      const test = codegenInstructionValue(cx, terminal.test);
      return t.whileStatement(test, codegenBlock(cx, terminal.loop));
    }
    case "label": {
      return codegenBlock(cx, terminal.block);
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
  instr: ReactiveInstruction
): t.Statement | null {
  let statement;
  if (
    instr.value.kind === "StoreLocal" ||
    instr.value.kind === "Destructure" ||
    instr.value.kind === "DeclareLocal"
  ) {
    let kind: InstructionKind = instr.value.lvalue.kind;
    let lvalue;
    let value: t.Expression | null;
    if (instr.value.kind === "StoreLocal") {
      kind = cx.hasDeclared(instr.value.lvalue.place.identifier)
        ? InstructionKind.Reassign
        : kind;
      lvalue = instr.value.lvalue.place;
      value = codegenPlace(cx, instr.value.value);
    } else if (instr.value.kind === "DeclareLocal") {
      if (cx.hasDeclared(instr.value.lvalue.place.identifier)) {
        return null;
      }
      kind = instr.value.lvalue.kind;
      lvalue = instr.value.lvalue.place;
      value = null;
    } else {
      lvalue = instr.value.lvalue.pattern;
      for (const place of eachPatternOperand(lvalue)) {
        if (
          kind !== InstructionKind.Reassign &&
          place.identifier.name === null
        ) {
          cx.temp.set(place.identifier.id, null);
        }
        if (cx.hasDeclared(place.identifier)) {
          kind = InstructionKind.Reassign;
          break;
        }
      }
      value = codegenPlace(cx, instr.value.value);
    }
    switch (kind) {
      case InstructionKind.Const: {
        if (instr.lvalue !== null) {
          CompilerError.invariant(
            `Const declaration cannot be referenced as an expression`,
            instr.value.loc
          );
        }
        return createVariableDeclaration(instr.loc, "const", [
          t.variableDeclarator(codegenLValue(lvalue), value),
        ]);
      }
      case InstructionKind.Let: {
        if (instr.lvalue !== null) {
          CompilerError.invariant(
            `Const declaration cannot be referenced as an expression`,
            instr.value.loc
          );
        }
        return createVariableDeclaration(instr.loc, "let", [
          t.variableDeclarator(codegenLValue(lvalue), value),
        ]);
      }
      case InstructionKind.Reassign: {
        invariant(value !== null, "Expected a value for reassignment");
        const expr = t.assignmentExpression("=", codegenLValue(lvalue), value);
        if (instr.lvalue !== null) {
          cx.temp.set(instr.lvalue.identifier.id, expr);
          return null;
        } else {
          return createExpressionStatement(instr.loc, expr);
        }
      }
      default: {
        assertExhaustive(kind, `Unexpected instruction kind '${kind}'`);
      }
    }
  } else {
    const value = codegenInstructionValue(cx, instr.value);
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
const createJsxNamespacedName = withLoc(t.jsxNamespacedName);
const createJsxElement = withLoc(t.jsxElement);
const createJsxAttribute = withLoc(t.jsxAttribute);
const createJsxIdentifier = withLoc(t.jsxIdentifier);
const createJsxExpressionContainer = withLoc(t.jsxExpressionContainer);
const createJsxText = withLoc(t.jsxText);
const createJsxClosingElement = withLoc(t.jsxClosingElement);
const createStringLiteral = withLoc(t.stringLiteral);

type Temporaries = Map<IdentifierId, t.Expression | null>;

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
  if (instr.lvalue.identifier.name === null) {
    // temporary
    cx.temp.set(instr.lvalue.identifier.id, value);
    return t.emptyStatement();
  } else {
    if (cx.hasDeclared(instr.lvalue.identifier)) {
      return createExpressionStatement(
        instr.loc,
        t.assignmentExpression(
          "=",
          convertIdentifier(instr.lvalue.identifier),
          value
        )
      );
    } else {
      return createVariableDeclaration(instr.loc, "const", [
        t.variableDeclarator(convertIdentifier(instr.lvalue.identifier), value),
      ]);
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
      const elements = instrValue.elements.map((element) => {
        if (element.kind === "Identifier") {
          return codegenPlace(cx, element);
        } else {
          return t.spreadElement(codegenPlace(cx, element.place));
        }
      });
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
      value = codegenValue(cx, instrValue.loc, instrValue.value);
      break;
    }
    case "CallExpression": {
      const callee = codegenPlace(cx, instrValue.callee);
      const args = instrValue.args.map((arg) => codegenArgument(cx, arg));
      value = createCallExpression(instrValue.loc, callee, args);
      break;
    }
    case "OptionalCall": {
      const call = codegenInstructionValue(cx, instrValue.call);
      invariant(call.type === "CallExpression", "Expected a call expression");
      invariant(
        t.isExpression(call.callee),
        "v8 intrinsics are validated during lowering"
      );
      value = t.optionalCallExpression(
        call.callee,
        call.arguments,
        instrValue.optional
      );
      break;
    }
    case "MethodCall": {
      const memberExpr = codegenPlace(cx, instrValue.property);
      invariant(
        t.isMemberExpression(memberExpr) ||
          t.isOptionalMemberExpression(memberExpr),
        "[Codegen] Internal error: MethodCall::property must be an unpromoted + unmemoized MemberExpression."
      );
      invariant(
        t.isNodesEquivalent(
          memberExpr.object,
          codegenPlace(cx, instrValue.receiver)
        ),
        "[Codegen] Internal error: Forget should always generate MethodCall::property " +
          "as a MemberExpression of MethodCall::receiver"
      );
      const args = instrValue.args.map((arg) => codegenArgument(cx, arg));
      value = createCallExpression(instrValue.loc, memberExpr, args);
      break;
    }
    case "NewExpression": {
      const callee = codegenPlace(cx, instrValue.callee);
      const args = instrValue.args.map((arg) => codegenArgument(cx, arg));
      value = t.newExpression(callee, args);
      break;
    }
    case "ObjectExpression": {
      const properties = [];
      for (const property of instrValue.properties) {
        if (property.kind === "ObjectProperty") {
          const key = t.identifier(property.name);
          const value = codegenPlace(cx, property.place);
          properties.push(
            t.objectProperty(
              key,
              value,
              false,
              value.type === "Identifier" && value.name === key.name
            )
          );
        } else {
          properties.push(t.spreadElement(codegenPlace(cx, property.place)));
        }
      }
      value = t.objectExpression(properties);
      break;
    }
    case "JSXText": {
      value = createStringLiteral(instrValue.loc, instrValue.value);
      break;
    }
    case "JsxExpression": {
      const attributes: Array<t.JSXAttribute | t.JSXSpreadAttribute> = [];
      for (const attribute of instrValue.props) {
        attributes.push(codegenJsxAttribute(cx, attribute));
      }
      let tagValue = codegenPlace(cx, instrValue.tag);
      let tag: t.JSXIdentifier | t.JSXNamespacedName | t.JSXMemberExpression;
      if (tagValue.type === "Identifier") {
        tag = createJsxIdentifier(instrValue.tag.loc, tagValue.name);
      } else if (tagValue.type === "MemberExpression") {
        tag = convertMemberExpressionToJsx(tagValue);
      } else {
        invariant(
          tagValue.type === "StringLiteral",
          "Expected JSX tag to be an identifier or string, got '%s'",
          tagValue.type
        );
        if (tagValue.value.indexOf(":") >= 0) {
          const [namespace, name] = tagValue.value.split(":", 2);
          tag = createJsxNamespacedName(
            instrValue.tag.loc,
            createJsxIdentifier(instrValue.tag.loc, namespace),
            createJsxIdentifier(instrValue.tag.loc, name)
          );
        } else {
          tag = createJsxIdentifier(instrValue.loc, tagValue.value);
        }
      }
      const children =
        instrValue.children !== null
          ? instrValue.children.map((child) => codegenJsxElement(cx, child))
          : [];
      value = createJsxElement(
        instrValue.loc,
        t.jsxOpeningElement(tag, attributes, instrValue.children === null),
        instrValue.children !== null
          ? createJsxClosingElement(instrValue.tag.loc, tag)
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
      const object = codegenPlace(cx, instrValue.object);
      // We currently only lower single chains of optional memberexpr.
      // (See BuildHIR.ts for more detail.)
      if (t.isOptionalMemberExpression(object) || instrValue.optional) {
        value = t.optionalMemberExpression(
          object,
          t.identifier(instrValue.property),
          undefined,
          instrValue.optional
        );
      } else {
        value = t.memberExpression(
          object,
          t.identifier(instrValue.property),
          undefined,
          instrValue.optional
        );
      }
      break;
    }
    case "PropertyDelete": {
      value = t.unaryExpression(
        "delete",
        t.memberExpression(
          codegenPlace(cx, instrValue.object),
          t.identifier(instrValue.property)
        )
      );
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
      const object = codegenPlace(cx, instrValue.object);
      const property = codegenPlace(cx, instrValue.property);
      if (t.isOptionalMemberExpression(object) || instrValue.optional) {
        value = t.optionalMemberExpression(
          object,
          property,
          true,
          instrValue.optional
        );
      } else {
        value = t.memberExpression(object, property, true, instrValue.optional);
      }
      break;
    }
    case "ComputedDelete": {
      value = t.unaryExpression(
        "delete",
        t.memberExpression(
          codegenPlace(cx, instrValue.object),
          codegenPlace(cx, instrValue.property),
          true
        )
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
    case "RegExpLiteral": {
      value = t.regExpLiteral(instrValue.pattern, instrValue.flags);
      break;
    }
    case "Await": {
      value = t.awaitExpression(codegenPlace(cx, instrValue.value));
      break;
    }
    case "NextIterableOf": {
      value = codegenPlace(cx, instrValue.value);
      break;
    }
    case "DeclareLocal":
    case "Destructure":
    case "StoreLocal": {
      CompilerError.invariant(
        `Unexpected ${instrValue.kind} in codegenInstructionValue`,
        instrValue.loc
      );
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

function codegenJsxAttribute(
  cx: Context,
  attribute: JsxAttribute
): t.JSXAttribute | t.JSXSpreadAttribute {
  switch (attribute.kind) {
    case "JsxAttribute": {
      let propName: t.JSXIdentifier | t.JSXNamespacedName;
      if (attribute.name.indexOf(":") === -1) {
        propName = createJsxIdentifier(attribute.place.loc, attribute.name);
      } else {
        const [namespace, name] = attribute.name.split(":", 2);
        propName = createJsxNamespacedName(
          attribute.place.loc,
          createJsxIdentifier(attribute.place.loc, namespace),
          createJsxIdentifier(attribute.place.loc, name)
        );
      }
      const innerValue = codegenPlace(cx, attribute.place);
      let value;
      switch (innerValue.type) {
        case "StringLiteral":
        case "JSXElement":
        case "JSXFragment": {
          value = innerValue;
          break;
        }
        default: {
          value = createJsxExpressionContainer(attribute.place.loc, innerValue);
          break;
        }
      }
      return createJsxAttribute(attribute.place.loc, propName, value);
    }
    case "JsxSpreadAttribute": {
      return t.jsxSpreadAttribute(codegenPlace(cx, attribute.argument));
    }
    default: {
      assertExhaustive(
        attribute,
        `Unexpected attribute kind '${(attribute as any).kind}'`
      );
    }
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
      return createJsxText(place.loc, value.value);
    }
    case "JSXElement":
    case "JSXFragment": {
      return value;
    }
    default: {
      return createJsxExpressionContainer(place.loc, value);
    }
  }
}

function convertMemberExpressionToJsx(
  expr: t.MemberExpression
): t.JSXMemberExpression {
  invariant(
    expr.property.type === "Identifier",
    "Expected JSX member expression property to be a string"
  );
  const property = t.jsxIdentifier(expr.property.name);
  if (expr.object.type === "Identifier") {
    return t.jsxMemberExpression(t.jsxIdentifier(expr.object.name), property);
  } else {
    invariant(
      expr.object.type === "MemberExpression",
      "Expected JSX member expression to be an identifier or nested member expression"
    );
    const object = convertMemberExpressionToJsx(expr.object);
    return t.jsxMemberExpression(object, property);
  }
}

function codegenLValue(
  pattern: Pattern | Place | SpreadPattern
): t.ArrayPattern | t.ObjectPattern | t.RestElement | t.Identifier {
  switch (pattern.kind) {
    case "ArrayPattern": {
      return t.arrayPattern(pattern.items.map((item) => codegenLValue(item)));
    }
    case "ObjectPattern": {
      return t.objectPattern(
        pattern.properties.map((property) => {
          if (property.kind === "ObjectProperty") {
            const key = t.identifier(property.name);
            const value = codegenLValue(property.place);
            return t.objectProperty(
              key,
              value,
              false,
              value.type === "Identifier" && value.name === key.name
            );
          } else {
            return t.restElement(codegenLValue(property.place));
          }
        })
      );
    }
    case "Spread": {
      return t.restElement(codegenLValue(pattern.place));
    }
    case "Identifier": {
      return convertIdentifier(pattern.identifier);
    }
    default: {
      assertExhaustive(
        pattern,
        `Unexpected pattern kind '${(pattern as any).kind}'`
      );
    }
  }
}

function codegenValue(
  cx: Context,
  loc: SourceLocation,
  value: boolean | number | string | null | undefined
): t.Expression {
  if (typeof value === "number") {
    return t.numericLiteral(value);
  } else if (typeof value === "boolean") {
    return t.booleanLiteral(value);
  } else if (typeof value === "string") {
    return createStringLiteral(loc, value);
  } else if (value === null) {
    return t.nullLiteral();
  } else if (value === undefined) {
    return t.identifier("undefined");
  } else {
    assertExhaustive(value, "Unexpected primitive value kind");
  }
}

function codegenArgument(
  cx: Context,
  arg: Place | SpreadPattern
): t.Expression | t.SpreadElement {
  if (arg.kind === "Identifier") {
    return codegenPlace(cx, arg);
  } else {
    return t.spreadElement(codegenPlace(cx, arg.place));
  }
}

function codegenPlace(cx: Context, place: Place): t.Expression {
  let tmp = cx.temp.get(place.identifier.id);
  if (tmp != null) {
    return tmp;
  }
  if (place.identifier.name === null && tmp === undefined) {
    CompilerError.invariant(
      `[Codegen] No value found for temporary`,
      place.loc,
      `Value for '${printPlace(place)}' was not set in the codegen context`
    );
  }
  const identifier = convertIdentifier(place.identifier);
  identifier.loc = place.loc as any;
  return identifier;
}

function convertIdentifier(identifier: Identifier): t.Identifier {
  if (identifier.name !== null) {
    return t.identifier(`${identifier.name}`);
  }
  return t.identifier(`t${identifier.id}`);
}
