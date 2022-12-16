/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import type { Function } from "@babel/types";
import type { CompilerContext } from "../CompilerContext";
import * as IR from "../IR";
import { getAssignmentTargets } from "../IR/babel-utils";
import { PassKind, PassName } from "../Pass";

/**
 * Reference Kind Inference
 */
export default {
  name: PassName.RefKindInfer,
  kind: PassKind.IRFunc as const,
  run,
};

const ANNOTATIONS_IMMUT = ["immut", "readonly"];
const ANNOTATIONS_MUT = ["mut", "mutable", "writable"];

/**
 * Eventually, we probably want to move RefKind refinements
 * into a single visitor pass and do context sensitive analysis.
 * This would avoid:
 *  - different passes making inconsistent / incompatible refinements
 *  - each pass needing to collect its context by traversing parent nodes
 *     / filtering child nodes
 */
export function run(
  irFunc: IR.Func,
  func: NodePath<Function>,
  context: CompilerContext
) {
  for (const topLevel of irFunc.body) {
    refineBorrows(topLevel);
    // We refine MutBorrows and Freezes after Borrows and assume
    //  that a reference kind cannot be both MutBorrow and Freeze
    refineMutBorrows(topLevel);
    refineFreezes(topLevel);
    refineAnnonatedIdents(topLevel);
  }

  /**
   * Visit @param topLevel and refined "leaked/borrowed" uses as
   * {@link IR.RefKind.Borrow}. This is an over approximation.
   */
  function refineBorrows(topLevel: IR.FuncTopLevel) {
    // var/let/const id = NODE
    // function id(NODE) NODE
    // class id NODE
    if (topLevel.isDecl) {
      // Everywhere of declarations.
      refineUses(irFunc, topLevel.ast, IR.RefKind.Borrow);
    }

    topLevel.ast.traverse({
      // lhs = NODE
      AssignmentExpression(assignExpr) {
        refineUses(irFunc, assignExpr.get("right"), IR.RefKind.Borrow);
      },

      // NODE.child
      // NODE.child()
      MemberExpression(memExpr) {
        refineUses(irFunc, memExpr.get("object"), IR.RefKind.Borrow);
      },
      OptionalMemberExpression(memExpr) {
        refineUses(irFunc, memExpr.get("object"), IR.RefKind.Borrow);
      },

      // non-hook-callee(NODE)
      CallExpression(call) {
        const hookCall = IR.HookCall.resolve(call);
        const args = call.get("arguments");

        // Normal Call.
        if (!hookCall) {
          args.forEach((arg) => {
            refineUses(irFunc, arg, IR.RefKind.Borrow);
          });
        }
      },
    });
  }

  /**
   * Visit @param topLevel and refine mutative borrows
   * {@link IR.RefKind.MutBorrow}. This is an under
   * approximation, since we do not track aliasing or
   * know whether function calls will mutate their arguments.
   */
  function refineMutBorrows(topLevel: IR.FuncTopLevel) {
    topLevel.ast.traverse({
      // immutVal.x = 42;  [immutVal.x, immutVal.y] = [1, 2];  {a: immutVal.x} = {a: 42};
      // (NOT `foo(immutVal.x).bar = 42`)
      AssignmentExpression(assignExpr) {
        const lhs = assignExpr.get("left");
        getAssignmentTargets(lhs).forEach((ident) => {
          if (ident != lhs) {
            refineUses(irFunc, ident, IR.RefKind.MutBorrow);
          }
        });
      },
      // delete immutVal.x;  delete immutVal?.x;
      // (NOT `delete foo.func(immutVal.x)`)
      UnaryExpression(unaryExpr) {
        if (unaryExpr.node.operator == "delete") {
          const arg = unaryExpr.get("argument");
          // getAssignmentTargets will return an overestimate
          getAssignmentTargets(arg).forEach((ident) => {
            if (ident != arg) {
              refineUses(irFunc, ident, IR.RefKind.MutBorrow);
            }
          });
        }
      },
      // immutVal.x++
      UpdateExpression(updateExpr) {
        const arg = updateExpr.get("argument");
        // getAssignmentTargets will return an overestimate
        getAssignmentTargets(arg).forEach((ident) => {
          if (ident != arg) {
            refineUses(irFunc, ident, IR.RefKind.MutBorrow);
          }
        });
      },
    });
  }

  /**
   * Visit @param topLevel and refine uses moved to React as
   * {@link IR.RefKind.Freeze}. This is an under approximation.
   */
  function refineFreezes(topLevel: IR.FuncTopLevel) {
    for (const rootVal of topLevel.jsxTreeRoots) {
      refineExprInJSXTree(rootVal);
      function refineExprInJSXTree(expr: IR.ExprVal) {
        if (IR.isJSXTagVal(expr)) {
          expr.children.forEach(refineExprInJSXTree);
        } else {
          // <JSX attr={IDENT} />
          if (expr.ast.path.isIdentifier()) {
            refineUses(irFunc, expr.ast.path, IR.RefKind.Freeze);
          }
        }
      }
    }

    for (const call of topLevel.hookCalls) {
      // callee(IDENT)
      call.call.get("arguments").forEach((arg) => {
        if (arg.isIdentifier()) {
          refineUses(irFunc, arg, IR.RefKind.Freeze);
        }
      });
    }
  }

  /**
   * Refine identifiers annotated with "immut" and "mut".
   */
  function refineAnnonatedIdents(topLevel: IR.FuncTopLevel) {
    topLevel.ast.traverse({
      Identifier(ident) {
        if (ANNOTATIONS_IMMUT.some((anno) => hasLeadingComment(ident, anno))) {
          refineUses(irFunc, ident, IR.RefKind.Freeze);
        }
        if (ANNOTATIONS_MUT.some((anno) => hasLeadingComment(ident, anno))) {
          refineUses(irFunc, ident, IR.RefKind.MutBorrow);
        }
      },
    });
  }
}

function refineUses(
  irFunc: IR.Func,
  path: NodePath,
  refKind: IR.RefKind
): void {
  irFunc.env.getRefsToDeclsFrom(path).forEach((use) => {
    use.refineTo(refKind);
  });
  irFunc.env.getFreeVarsFrom(path).forEach((use) => {
    use.refineTo(refKind);
  });
}

function hasLeadingComment(path: NodePath, annotation: string): boolean {
  return (
    path.node.leadingComments?.some(
      (comment) => comment.value.trim().toLowerCase() === annotation
    ) ?? false
  );
}
