/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type { CompilerContext } from "../CompilerContext";
import { invariant } from "../CompilerError";
import * as IR from "../IR";
import { isJSXTagVal } from "../IR";
import { hasMultipleReturn } from "../IR/Func";
import { PassKind, PassName } from "../Pass";

/**
 * Body Analysis
 *
 * This middle end analyze the "FunctionBody" position of react func to collect
 * each "FunctionStatementList" item as {@link IR.FuncTopLevel} and resolve
 * hooks calls as {@link React.HookCall}.
 */
export default {
  name: PassName.BodyAnalysis,
  kind: PassKind.IRFunc as const,
  run,
};

export function run(
  irFunc: IR.Func,
  func: NodePath<t.Function>,
  context: CompilerContext
) {
  const funcBody = func.get("body");

  invariant(
    funcBody.isBlockStatement(),
    "ReactFuncsInfer ruled out expression-body functions."
  );

  funcBody.traverse({
    // FunctionBody: FunctionStatementList: StatementListItem
    Statement(stmt) {
      // Traverse only top-level statement list items.
      stmt.skip();

      let topLevel = new IR.FuncTopLevel(stmt, irFunc.env);
      irFunc.body.push(topLevel);

      visitHookCalls(topLevel);
      visitDerivedImmutables(topLevel);
      visitJSX(topLevel);
      visitArgumentsObject(topLevel);
      collectExits(topLevel);
      checkBlock(topLevel);
    },
  });

  if (context.opts.flags.bailOnMultipleReturns && hasMultipleReturn(irFunc)) {
    context.bailout("BailOnMultipleReturns", {
      code: "E0011",
      path: null,
      context: null,
    });
  }

  /**
   * Sanity check.
   */
  function checkBlock(topLevel: IR.FuncTopLevel) {
    if (topLevel.isDecl) {
      invariant(
        topLevel.returnStmts.size === 0,
        "Decl won't return: %s",
        topLevel.ast.node
      );
    } else {
      invariant(
        topLevel.decls.length === 0,
        "Only Decl can produce decls: %s",
        topLevel.ast.node
      );
    }
  }

  /**
   * Visit JSX in @param topLevel
   */
  function visitJSX(topLevel: IR.FuncTopLevel) {
    topLevel.ast.traverse({
      JSXElement(jsxEle) {
        visitJSXTag(jsxEle);
      },
      JSXFragment(jsxFrag) {
        visitJSXTag(jsxFrag);
      },
    });

    function visitJSXTag(rootTag: NodePath<IR.JSXTag>) {
      rootTag.skip();

      const rootVal = new IR.JSXTreeBuilder(rootTag, irFunc).build();
      collectExprInJSXTree(rootVal);
      topLevel.jsxTreeRoots.push(rootVal);
    }

    function collectExprInJSXTree(expr: IR.ExprVal) {
      irFunc.env.exprs.set(expr.ast.path, expr);
      topLevel.refsToExprs.push(expr.getRef());

      if (isJSXTagVal(expr)) {
        expr.children.forEach((subExpr) => collectExprInJSXTree(subExpr));
      }
    }
  }

  /**
   * Visit Hook-like CallExpressions in @param topLevel
   *
   * N.B. Same as {@link ReactFuncsInfer}, CallExpression are where we look
   * for hook calls.
   */
  function visitHookCalls(topLevel: IR.FuncTopLevel) {
    function visitHookCallExpr(call: NodePath<IR.HookCallExpr>) {
      function onInvalidHookNamespace(
        expression: t.Expression,
        isBuiltinHook: boolean
      ): void {
        if (isBuiltinHook) {
          context.bailout("BailOnBuiltinHookWithInvalidHookNamespace", {
            code: "E0016",
            path: call,
            context: null,
          });
        }
        if (isAllPascalCaseNameSpace(expression)) {
          context.bailout("BailOnValidHookNamespace", {
            code: "E0017",
            path: call,
            context: null,
          });
        }
      }

      const hookCall = IR.HookCall.resolve(call, onInvalidHookNamespace);
      if (hookCall) {
        if (
          context.opts.flags.bailOnUseRef &&
          hookCall.hook.kind === IR.HookKind.UseRef
        ) {
          context.bailout("BailOnUseRef", {
            code: "E0012",
            path: call,
            context: null,
          });
        }
        // Pattern matching and refine the return position.
        hookCall.matchRetVals(irFunc, context);
        topLevel.hookCalls.push(hookCall);
      }
    }
    topLevel.ast.traverse({
      CallExpression: visitHookCallExpr,
      OptionalCallExpression: visitHookCallExpr,
    });
  }

  /**
   * Visit VariableDeclarator to look for derived immutables.
   */
  function visitDerivedImmutables(topLevel: IR.FuncTopLevel) {
    topLevel.ast.traverse({
      VariableDeclarator(varDeclarator) {
        const lval = varDeclarator.get("id");
        const rhs = varDeclarator.get("init");

        if (rhs.isExpression()) {
          const from = isDerivedFromInput(rhs);
          if (from) {
            irFunc.env.getDeclsFrom(lval).forEach((val) => {
              IR.refineToDerivedImmutVal(val, from, true);
            });
          }
        }
      },
    });

    function isDerivedFromInput(
      expr: NodePath<t.Expression>
    ): IR.InputVal | undefined {
      // let x = INPUT
      if (expr.isIdentifier()) {
        const val = irFunc.env.decls.get(expr.node.name);
        if (val && IR.isInputVal(val)) return val;
      }
      // let x = INPUT.property
      if (expr.isMemberExpression()) {
        const obj = expr.get("object");
        if (obj.isIdentifier() || obj.isMemberExpression()) {
          return isDerivedFromInput(obj);
        }
      }
      return undefined;
    }
  }

  /**
   * Looking for `argument` object.
   */
  function visitArgumentsObject(topLevel: IR.FuncTopLevel) {
    topLevel.ast.traverse({
      Identifier(ident) {
        if (ident.node.name !== "arguments") return;

        // Bailout of handling the special arguments object.
        // OK, not actually arguments
        if (ident.parent) {
          // const foo = {arguments: 1}
          // class Foo {arguments = 1}
          const isProperty =
            t.isProperty(ident.parent) && ident.parent.key === ident.node;
          // a.arguments
          const isPropertyAccess =
            t.isMemberExpression(ident.parent) &&
            ident.parent.property === ident.node;
          // const foo = {arguments() {}}
          // class Foo {arguments() {}}
          const isMethod =
            (t.isClassMethod(ident.parent) || t.isObjectMethod(ident.parent)) &&
            ident.parent.key === ident.node;
          // class Foo {#arguments = 1}
          const isPrivate = t.isPrivateName(ident.parent);

          if (isProperty || isPropertyAccess || isMethod || isPrivate) return;
        }

        context.bailout("ArgumentsObject", {
          code: "E0020",
          path: ident,
          context: null,
        });
      },
    });
  }

  /**
   * Collect control flow exits.
   */
  function collectExits(topLevel: IR.FuncTopLevel) {
    const stmt = topLevel.ast;
    if (stmt.isReturnStatement()) {
      // Found top-level return.
      irFunc.isImplicitReturn = false;
      topLevel.returnStmts.set(stmt, irFunc.returnCount++);
    } else {
      stmt.traverse({
        ReturnStatement(ret) {
          if (ret.getFunctionParent() === irFunc.ast) {
            topLevel.returnStmts.set(ret, irFunc.returnCount++);
          }
        },
      });
    }
  }
}

// Detect benign cases of `A.B.C.useFoo()`
function isAllPascalCaseNameSpace(expression: t.Expression): boolean {
  const isPascalCaseNameSpace = (ns: string) => /^[A-Z].*/.test(ns);
  if (t.isIdentifier(expression)) {
    return isPascalCaseNameSpace(expression.name);
  }
  if (t.isMemberExpression(expression)) {
    if (
      t.isIdentifier(expression.property) &&
      !isPascalCaseNameSpace(expression.property.name)
    ) {
      return false;
    }
    return isAllPascalCaseNameSpace(expression.object);
  }
  return false;
}
