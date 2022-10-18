/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import generate from "@babel/generator";
import * as t from "@babel/types";
import invariant from "invariant";
import * as LIR from "../LIR";
import { assertExhaustive } from "../Common/utils";
import * as IR from "../IR";
import {
  addComments,
  renameReactiveVal,
  revertAddComments,
  revertRenameReactiveVal,
} from "../IR/PrettyPrinter";
import {
  EntryKind,
  isExprEntry,
  isFixedEntry,
  isLocalEntry,
  isReactiveEntry,
} from "./MemoCache";

export default function prettyPrint(lirFunc: LIR.Func) {
  renameReactiveVal(lirFunc.ir);

  const commentedNodes: t.Node[] = [];
  addComments(lirFunc.ir, commentedNodes, lirFunc);

  const prettyAST = buildPrettyAST(lirFunc, commentedNodes);
  const babelOutput = generate(prettyAST, { concise: true }).code;

  revertRenameReactiveVal(lirFunc.ir);
  revertAddComments(commentedNodes);

  return babelOutput;
}

/**
 * Build an @returns AST for pretty printing to avoid mutating
 * the original AST.
 */
function buildPrettyAST(lirFunc: LIR.Func, commentedNodes: t.Node[]) {
  const funcNode = lirFunc.ir.ast.node;

  let name: t.Identifier | undefined;
  if ("id" in funcNode && funcNode.id) name = funcNode.id;
  else if (lirFunc.ir.name) name = t.identifier(lirFunc.ir.name.toString());

  if (name) {
    const commentedNode = t.addComment(name, "leading", lirFunc.ir.kind);
    commentedNodes.push(commentedNode);
  }

  const params = funcNode.params;
  const body = lirFunc.ir.ast.get("body");

  // See {@link ReactFuncsInfer} for the reason.
  if (!body.isBlockStatement()) throw new Error("unreachable");
  const directives = body.node.directives;

  const stmts: t.Statement[] = [genPrologue(lirFunc)];

  lirFunc.blocks.forEach((block) => {
    // Convert ReactiveBlock into IfStatements with a label of outputs
    if (LIR.isReactiveBlock(block)) {
      const callExpr = t.callExpression(
        t.identifier("$$"),
        [...block.inputs].map((reactiveVal) =>
          // Must clone since it seems comments are only attached to one
          // instance of the same node, regardless of how many references exist.
          // Same with the following cases.
          t.cloneNode(reactiveVal.binding.identifier)
        )
      );

      const blockStmt = t.blockStatement(
        block.body.map((instr) => instr.ast.node)
      );

      const ifStmt = t.ifStatement(callExpr, blockStmt);

      const blockOutputs = block.outputs;

      if (blockOutputs.size !== 0) {
        const outputIdents = [...blockOutputs].map((o) =>
          t.cloneNode(o.binding.identifier)
        );

        stmts.push(
          t.labeledStatement(
            t.identifier("$"),
            t.expressionStatement(t.sequenceExpression(outputIdents))
          )
        );
      }

      stmts.push(ifStmt);
    }
    // RenderBlock
    else {
      const subStmts = block.body.map((instr) => instr.ast.node);
      stmts.push(...subStmts);
    }
  });

  const ast = t.functionDeclaration(
    name ?? t.identifier("_anno"),
    params,
    t.blockStatement(stmts, directives)
  );

  return ast;
}

function genPrologue(lirFunc: LIR.Func): t.Statement {
  const memoCacheArray: t.Identifier[] = [];

  [...lirFunc.memoCache.entries.values()].forEach((e) => {
    let ident;

    switch (e.kind) {
      case EntryKind.Fixed:
        invariant(isFixedEntry(e), "");
        ident = t.identifier(e.value.toString());
        break;
      case EntryKind.Expr:
        invariant(isExprEntry(e), "");
        ident = t.identifier(IR.formatValKind(e.value).toLowerCase());
        t.addComment(ident, "leading", e.value.toLoc());
        break;
      case EntryKind.Reactive:
      case EntryKind.Local:
        invariant(isReactiveEntry(e) || isLocalEntry(e), "");
        ident = t.cloneNode(e.value.binding.identifier);
        break;
      default:
        assertExhaustive(e.kind, `Unhandled Entry ${e}`);
    }

    memoCacheArray.push(ident);
  });

  return t.expressionStatement(
    t.assignmentExpression(
      "=",
      t.identifier("$"),
      t.arrayExpression(memoCacheArray)
    )
  );
}
