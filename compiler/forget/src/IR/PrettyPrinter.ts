/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import generate from "@babel/generator";
import * as t from "@babel/types";
import * as IR from ".";
import * as LIR from "../LIR";

export default function prettyPrint(irFunc: IR.Func) {
  renameReactiveVal(irFunc);

  const commentedNodes: t.Node[] = [];
  addComments(irFunc, commentedNodes);

  let funcNode = irFunc.ast.node;

  let funcDecl: t.FunctionDeclaration | undefined;

  // Build new FunctionDeclaration from original FunctionExpression
  // or ArrowFunctionExpression
  if (
    t.isFunctionExpression(funcNode) ||
    t.isArrowFunctionExpression(funcNode)
  ) {
    const params = funcNode.params;
    let body: t.BlockStatement;

    if (t.isArrowFunctionExpression(funcNode)) {
      if (t.isExpression(funcNode.body)) {
        const stmt = t.expressionStatement(funcNode.body);
        body = t.blockStatement([stmt]);
      } else {
        body = funcNode.body;
      }
    } else {
      body = funcNode.body;
    }

    const name =
      irFunc.name !== undefined
        ? t.identifier(irFunc.name.toString())
        : t.identifier("_anno");

    const commentedNode = t.addComment(name, "leading", irFunc.kind);
    commentedNodes.push(commentedNode);

    funcDecl = t.functionDeclaration(name, params, body);
    if (irFunc.name === "Cell") console.log(funcDecl);
  } else if (t.isFunctionDeclaration(funcNode)) {
    funcDecl = funcNode;

    if (funcNode.id) {
      const commentedNode = t.addComment(funcNode.id, "leading", irFunc.kind);
      commentedNodes.push(commentedNode);
    }
  }

  if (funcDecl === undefined) {
    revertRenameReactiveVal(irFunc);
    return;
  }

  const babelOutput = generate(funcDecl, { concise: true }).code;

  revertRenameReactiveVal(irFunc);
  revertAddComments(commentedNodes);

  return babelOutput;
}

/**
 * Rename every {@link IR.ReactiveVal} by appending a `$` to the name.
 */
export function renameReactiveVal(irFunc: IR.Func) {
  for (const [name, bVal] of irFunc.env.decls) {
    if (IR.isReactiveVal(bVal)) {
      irFunc.ast.scope.rename(`${name}`, `$${name}`);
    }
  }
}

export function revertRenameReactiveVal(irFunc: IR.Func) {
  for (const [name, bVal] of irFunc.env.decls) {
    if (IR.isReactiveVal(bVal)) {
      irFunc.ast.scope.rename(`$${name}`, `${name}`);
    }
  }
}

export function addComments(
  irFunc: IR.Func,
  commentedNodes: t.Node[],
  lirFunc?: LIR.Func
) {
  // Add comments to all decls and uses of {@link BindingVal}
  for (const bVal of irFunc.env.decls.values()) {
    const commentedNode = t.addComment(
      bVal.binding.identifier,
      "leading",
      bVal.getFormatedProperties()
    );
    commentedNodes.push(commentedNode);

    bVal.references.forEach((ref) => {
      const commentedNode = t.addComment(
        ref.path.node,
        "leading",
        ref.getFormatedProperties()
      );
      commentedNodes.push(commentedNode);
    });
  }

  // Add comments to all {@link FreeVal}
  for (const fVal of irFunc.env.freeVars.values()) {
    fVal.references.forEach((ref) => {
      const commentedNode = t.addComment(
        ref.path.node,
        "leading",
        ref.getFormatedProperties()
      );
      commentedNodes.push(commentedNode);
    });
  }

  if (lirFunc) {
    // Add comments to only non-JSX unstable {@link ExprVal}.
    for (const eVal of irFunc.env.exprs.values()) {
      const entry = lirFunc.memoCache.entries.get(eVal);
      if (entry) {
        const eValPath = eVal.ast.path;
        let commentedNode;
        if (IR.isJSXTagVal(eVal)) {
          if (eValPath.isJSXElement()) {
            // </*$*/ id>
            commentedNode = t.addComment(
              eValPath.node.openingElement.name,
              // Some highlighters can't parse leading comments in JSX right.
              "trailing",
              "$"
            );
          } else if (eValPath.isJSXFragment()) {
            // </*$*/>
            commentedNode = t.addComment(
              eValPath.node.openingFragment,
              "inner",
              "$"
            );
          }
        } else if (IR.isExprVal(eVal)) {
          commentedNode = t.addComment(eValPath.node, "leading", "$");
        }
        if (commentedNode != null) {
          commentedNodes.push(commentedNode);
        }
      }
    }
  }
}

/**
 *  Note: this will remove all comments of the node but it's fine since {@link DumpIR} will not be run in production.
 */
export function revertAddComments(commentedNodes: t.Node[]) {
  commentedNodes.forEach((commentedNode) => {
    t.removeComments(commentedNode);
  });
}
