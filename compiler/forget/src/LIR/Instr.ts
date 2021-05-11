/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import * as IR from "../IR";

/**
 * LIR Instruction.
 *
 * This is a thin abstraction over {@link IR.FuncTopLevel} to help with
 * reorder/reoganizing/rescheduling them into {@link LIR.Block} for code gen.
 */
export class Instr {
  ir: IR.FuncTopLevel;
  ast: NodePath<t.Statement>;

  /**
   * The set of reactive values invalidates this instr.
   */
  inputs: Set<IR.ReactiveVal>;

  constructor(topLevel: IR.FuncTopLevel, irFunc: IR.Func) {
    this.ir = topLevel;
    this.ast = topLevel.ast;
    this.inputs = new Set<IR.ReactiveVal>();

    // Iterating over decls and uses of Instr to collect their inputs.
    topLevel.decls.forEach((def) =>
      irFunc.depGraph
        .getOrCreateVertex(def)
        .inputs.forEach((val) => this.inputs.add(val))
    );
    topLevel.uses.forEach((ref) =>
      irFunc.depGraph
        .getOrCreateVertex(ref.val)
        .inputs.forEach((val) => this.inputs.add(val))
    );
  }

  /**
   * @return whether or not this instr is required every render.
   *
   * This is defined as whether or not the block has inputs or
   * contains any hook calls.
   */
  isRequiredEveryRender(): boolean {
    return (
      this.ir.hookCalls.length > 0 ||
      this.ir.decls.some((bVal) => IR.isInputVal(bVal))
    );
  }

  /**
   * @return whether or not a body item is considered exitable e.g. early return
   */
  isExitable(): boolean {
    return this.ir.returnStmts.size > 0;
  }

  /**
   * @return whether or not a body item is considered "pinned".
   */
  isPinned(): boolean {
    return this.isExitable();
  }
}
