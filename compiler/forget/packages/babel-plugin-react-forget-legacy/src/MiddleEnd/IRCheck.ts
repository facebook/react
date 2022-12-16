/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type { CompilerContext } from "../CompilerContext";
import * as IR from "../IR";
import { PassKind, PassName } from "../Pass";

/**
 * Semantic check over IR.
 */
export default {
  name: PassName.IRCheck,
  kind: PassKind.IRFunc as const,
  run,
};

export function run(
  irFunc: IR.Func,
  func: NodePath<t.Function>,
  context: CompilerContext
) {
  for (const [name, val] of irFunc.env.decls) {
    if (val.immutable) {
      for (const [refPath, ref] of val.references) {
        if (ref.kind === IR.RefKind.Reassign) {
          // Bindings created from Hook calls, Hook variables and Parameters are
          // assumed/enforced to be "immutable" (and `const` in terms of JS).
          // Violations of this rule would trigger bailout/deopt.
          // Alternatively, we can only treat `const` bindings as DerivedImmut
          // and still treat `let` bindings as Unknown.
          context.bailout("ReassignImmutableValue", {
            code: "E0010",
            path: refPath,
            context: { name },
          });
        }
        if (ref.kind === IR.RefKind.MutBorrow) {
          context.bailout("MutateImmutableValue", {
            code: "E0013",
            path: refPath,
            context: { name },
          });
        }
      }
    }
  }

  if (context.opts.flags.bailOnUseRef) {
    func.traverse({
      MemberExpression(expression) {
        const { node } = expression;
        if (
          node.property.type === "Identifier" &&
          node.property.name === "current"
        ) {
          context.bailout("BailOnRefLike", {
            code: "E0014",
            path: expression,
            context: null,
          });
        }
      },
    });
  }
}
