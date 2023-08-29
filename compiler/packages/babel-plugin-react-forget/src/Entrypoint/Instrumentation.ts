/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import { assertExhaustive } from "../Utils/utils";

export function addInstrumentForget(
  fn: t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression,
  instrumentFnName: string
): void {
  let body: t.BlockStatement | t.Expression;
  let name: string | null = null;
  if (fn.type === "FunctionDeclaration") {
    body = fn.body;
    name = fn.id?.name ?? null;
  } else if (fn.type === "FunctionExpression") {
    body = fn.body;
    name = fn.id?.name ?? null;
  } else if (fn.type === "ArrowFunctionExpression") {
    body = fn.body;
  } else {
    assertExhaustive(fn, `Expected a function type, got '${(fn as any).type}'`);
  }

  if (name === null) {
    return;
  }
  if (t.isExpression(body)) {
    body = t.blockStatement([t.expressionStatement(body)]);
  }

  // Technically, this is a conditional hook call. However, we expect
  // __DEV__ and gatingIdentifier to be runtime constants
  const test: t.IfStatement = t.ifStatement(
    t.identifier("__DEV__"),
    t.expressionStatement(
      t.callExpression(t.identifier(instrumentFnName), [t.stringLiteral(name)])
    )
  );
  body.body.unshift(test);
}
