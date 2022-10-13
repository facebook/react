/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type { CompilerContext } from "../CompilerContext";
import { OutputKind } from "../CompilerOutputs";
import * as LIR from "../LIR";
import * as IR from "../IR";
import { PassKind, PassName } from "../Pass";
import { assertExhaustive } from "../Common/utils";
import invariant from "invariant";
import { isReactiveBlock, isRenderBlock } from "../LIR";

/**
 * An optional debug step when the output {@link OutputKind.IR} is enabled.
 * Records the output IR in the compiler context.
 */
export default {
  name: PassName.DumpIR,
  kind: PassKind.LIRFunc as const,
  run,
};

export function run(
  lirFunc: LIR.Func,
  _func: NodePath<t.Function>,
  _context: CompilerContext
) {
  const irFunc = lirFunc.ir;

  const reactiveValues = new Set<string>();
  function defineReactiveVal(value: IR.ReactiveVal) {
    const name = value.binding.identifier.name;
    reactiveValues.add(name);
  }

  function useReactiveValues(values: Set<IR.ReactiveVal>) {
    for (const reactiveValue of values) {
      const name = reactiveValue.binding.identifier.name;
      invariant(
        reactiveValues.has(name),
        `Reactive value "${name}" not yet defined.`
      );
    }
  }

  for (const param of irFunc.params) {
    if (IR.isReactiveVal(param)) {
      defineReactiveVal(param);
    }
  }

  function visitJSX(expr: IR.ExprVal) {
    if (IR.isJSXTagVal(expr)) {
      expr.children.forEach((child) => visitJSX(child));
    }
    if (!expr.stable) {
      const entry = lirFunc.memoCache.entries.get(expr);
      if (entry) {
        invariant(LIR.MemoCache.isExprEntry(entry), "");
        const { inputs } = irFunc.depGraph.getOrCreateVertex(entry.value);
        useReactiveValues(inputs);
      }
    }
  }

  for (const block of lirFunc.blocks) {
    switch (block.kind) {
      case LIR.BlockKind.Render:
        invariant(isRenderBlock(block), "Expected render block");
        for (const instr of block.body) {
          for (const decl of instr.ir.decls) {
            if (IR.isReactiveVal(decl)) {
              defineReactiveVal(decl);
            }
          }
        }
        break;
      case LIR.BlockKind.Reactive:
        invariant(isReactiveBlock(block), "Expected reactive block");
        useReactiveValues(block.inputs);
        for (const instr of block.body) {
          instr.ir.jsxTreeRoots.forEach((root) => {
            visitJSX(root);
          });
        }
        break;
      default:
        assertExhaustive(block.kind, `Unhandled block ${block}`);
    }
  }
}
