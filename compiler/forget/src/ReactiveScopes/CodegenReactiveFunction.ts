/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import invariant from "invariant";
import {
  codegenInstruction,
  codegenInstructionValue,
  codegenLabel,
  codegenPlace,
  convertIdentifier,
  createFunctionDeclaration,
  Temporaries,
} from "../HIR/Codegen";
import {
  Identifier,
  Instruction,
  InstructionKind,
  ReactiveBlock,
  ReactiveFunction,
  ReactiveScope,
  ReactiveScopeDependency,
  ReactiveTerminal,
  ReactiveValueBlock,
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

function codegenTerminal(cx: Context, terminal: ReactiveTerminal): t.Statement {
  switch (terminal.kind) {
    case "break": {
      return t.breakStatement(
        terminal.label !== null
          ? t.identifier(codegenLabel(terminal.label))
          : null
      );
    }
    case "continue": {
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

export function codegenInstructionNullable(
  cx: Context,
  instr: Instruction,
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
  if (init.value !== null) {
    invariant(
      body.length === 0,
      "Expected for init block to produce only temporaries"
    );
    return codegenInstructionValue(cx.temp, init.value);
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
  if (block.value !== null) {
    const value = codegenInstructionValue(cx.temp, block.value);
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
