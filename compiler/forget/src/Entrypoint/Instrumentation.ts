/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/core";
import * as t from "@babel/types";

export function addInstrumentForget(
  fn: NodePath<t.FunctionDeclaration>,
  fnName: string,
  gatingIdentifierName: string,
  instrumentFnName: string
): void {
  const fnBody = fn.get("body");
  // Technically, this is a conditional hook call. However, we expect
  // __DEV__ and gatingIdentifier to be runtime constants
  const testExpr: t.Node = t.ifStatement(
    t.logicalExpression(
      "&&",
      t.identifier("__DEV__"),
      t.identifier(gatingIdentifierName)
    ),
    t.expressionStatement(
      t.callExpression(t.identifier(instrumentFnName), [
        t.stringLiteral(fnName),
      ])
    )
  );
  fnBody.unshiftContainer("body", testExpr);
}
