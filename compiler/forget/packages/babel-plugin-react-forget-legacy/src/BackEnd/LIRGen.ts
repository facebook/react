/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { setEmpty, setEq, setIntersect, setSubset } from "../Common/utils";
import type { CompilerContext } from "../CompilerContext";
import { invariant } from "../CompilerError";
import * as IR from "../IR";
import * as LIR from "../LIR";
import { PassKind, PassName } from "../Pass";

/**
 * LIR Generation.
 * This pass we lower {@link IR.Func} to {@link LIR.Func} to help with codegen.
 *
 * The major job of this pass is to treat {@link IR.FuncTopLevel} as
 * {@link LIR.Instr} and schedule them into {@link LIR.ReactiveBlock} (which also
 * needs to be scheuled according to certain rules).
 */
export default {
  name: PassName.LIRGen,
  kind: PassKind.IRFunc as const,
  run,
};

/**
 * Generate LIR for the given @param irFunc.
 */
export function run(
  irFunc: IR.Func,
  func: NodePath<t.Function>,
  context: CompilerContext
) {
  const lirFunc = new LIR.Func(irFunc);
  context.lirProg.funcs.set(irFunc, lirFunc);
  const scheduler = new InstrScheduler(lirFunc);

  for (const irFuncTopLevel of irFunc.body) {
    const instr = new LIR.Instr(irFuncTopLevel, irFunc);

    if (instr.isPinned()) scheduler.flushActiveList();

    if (instr.isRequiredEveryRender()) {
      scheduler.scheduleRenderBlock(LIR.createRenderBlock(instr));
    } else {
      let reactiveBlock = scheduler.findReactiveBlock(instr.inputs);
      if (!reactiveBlock) {
        const newReactiveBlock = LIR.createReactiveBlock(instr.inputs);
        scheduler.scheduleReactiveBlock(newReactiveBlock);
        reactiveBlock = newReactiveBlock;
      }
      reactiveBlock.emit(instr);
    }

    if (instr.isPinned()) scheduler.flushActiveList();
  }

  scheduler.flushActiveList();
  check(lirFunc, context);
}

class InstrScheduler {
  // TODO: may be faster to use a linked list.
  activeList: LIR.Block[];

  lirFunc: LIR.Func;

  constructor(lirFunc: LIR.Func) {
    this.lirFunc = lirFunc;
    this.activeList = [];
  }

  /**
   * Insert @param newBlock into the ActiveList by moving it from back to front
   * until it hits a RenderBlock or a ReactiveBlock it depends on.
   */
  scheduleRenderBlock(newBlock: LIR.RenderBlock) {
    for (const [i, tailBlock] of [...this.activeList.entries()].reverse()) {
      let stop = false;
      if (LIR.isRenderBlock(tailBlock)) {
        stop = true;
      } else {
        invariant(LIR.isReactiveBlock(tailBlock), "");
        const uses = LIR.getAllUses(newBlock);
        if (!setEmpty(uses) && setIntersect(LIR.getAllDefs(tailBlock), uses)) {
          // Check if newBlock uses any values declared in tailBlock
          // so that we don't create uses-before-decls.
          stop = true;
        }
      }
      if (stop) {
        // after the tailBlock
        this.activeList.splice(i + 1, 0, newBlock);
        return;
      }
    }
    // Insert at the front.
    this.activeList.splice(0, 0, newBlock);
  }

  /**
   * Insert @param newBlock into the ActiveList while keeping it sorted in
   * a partial order where if i < j, then ActiveList[j].Inputs can't be subset
   * of ActiveList[i].Inputs.
   */
  scheduleReactiveBlock(newBlock: LIR.ReactiveBlock) {
    for (const [i, headBlock] of this.activeList.entries()) {
      if (LIR.isReactiveBlock(headBlock)) {
        if (setSubset(newBlock.inputs, headBlock.inputs)) {
          // before the headBlock
          this.activeList.splice(i, 0, newBlock);
          return;
        }
      }
    }
    // Insert at the end.
    this.activeList.push(newBlock);
  }

  /**
   * @returns the active block with the same set of @param inputs, if exists.
   */
  findReactiveBlock(
    inputs: Set<IR.ReactiveVal>
  ): LIR.ReactiveBlock | undefined {
    for (const block of this.activeList) {
      if (LIR.isReactiveBlock(block)) {
        if (setEq(inputs, block.inputs)) {
          return block;
        }
      }
    }
    return undefined;
  }

  /**
   * Flush all pending blocks in the ActiveList to LIR functions. This is used
   * by pinned Instr to create boundaries.
   */
  flushActiveList() {
    for (const block of this.activeList) {
      this.lirFunc.addBlock(block);
    }
    this.activeList = [];
  }
}

/**
 * Check the validity of generated @param lirFunc.
 */
function check(lirFunc: LIR.Func, context: CompilerContext) {
  const declared = new Set<IR.Val>();

  for (const param of lirFunc.ir.params) {
    declared.add(param);
  }

  for (const block of lirFunc.blocks) {
    for (const decl of LIR.getAllDecls(block)) {
      declared.add(decl);
    }

    // Check use-before-decl for instructions in reactive blocks
    if (LIR.isReactiveBlock(block)) {
      for (const input of block.inputs) {
        if (!declared.has(input)) {
          // Find the instr that create the use to fire bailout/diagnostics
          for (const instr of block.body) {
            if (instr.ir.uses.some((ref) => ref.val === input)) {
              context.bailout("LazyInstrInputDefinedLater", {
                code: "E0008",
                path: instr.ast,
                context: {
                  input: input.ast.path.parentPath ?? input.ast.path,
                },
              });
            }
          }
        }
      }
    }
  }
}
