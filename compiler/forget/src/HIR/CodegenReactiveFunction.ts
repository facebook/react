/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import invariant from "invariant";
import { assertExhaustive } from "../Common/utils";
import {
  codegenInstruction,
  codegenInstructionValue,
  codegenLabel,
  codegenPlace,
  convertIdentifier,
  createFunctionDeclaration,
  Temporaries,
} from "./Codegen";
import {
  Instruction,
  ReactiveBasicBlock,
  ReactiveFunction,
  ReactiveScope,
  ReactiveTerminal,
  ReactiveValueBlock,
} from "./HIR";
import { todoInvariant } from "./todo";

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
  temp: Temporaries = new Map();
}

function codegenBlock(
  cx: Context,
  block: ReactiveBasicBlock
): t.BlockStatement {
  const statements: Array<t.Statement> = [];
  for (const item of block) {
    switch (item.kind) {
      case "instruction": {
        const statement = codegenInstructionNullable(
          cx.temp,
          item.instruction,
          codegenInstructionValue(cx.temp, item.instruction.value)
        );
        if (statement !== null) {
          statements.push(statement);
        }
        break;
      }
      case "block": {
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
  block: ReactiveBasicBlock
): void {
  // TODO @josephsavona: Emit memoized blocks!
  const body = codegenBlock(cx, block).body;
  statements.push(...body);
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
  temp: Temporaries,
  instr: Instruction,
  value: t.Expression
): t.Statement | null {
  const statement = codegenInstruction(temp, instr, value);
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
