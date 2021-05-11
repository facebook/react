/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as IR from "../IR";
import { Instr } from "./Instr";

/**
 * LIR Block.
 *
 * TODO: revisit this notion and explore the idea of organizing the LIR
 * differently (as a tree of "Reactive Scope"):
 * - React Func
 *   - Prologue
 *   - Input section
 *   - ReactiveScope (Func.inputs)
 *     - Instr*
 *     - ReactiveScope (Instr.inputs)
 *        - Instr*
 *        - ReactiveScope
 * Where
 *   type SchedulerUnit = Instr | ReactiveScope
 */
export interface Block {
  kind: BlockKind;
  body: Instr[];
}

export enum BlockKind {
  /**
   * {@link RenderBlock} are code that are reactive on their parental reactive
   * scope, which is often their containing react functions.
   *
   * They are generated as-is and are unconditioanlly evaluated every render.
   * Such blocks are "unmemoized" in terms of auto-memoization.
   */
  Render,

  /**
   * {@link ReactiveBlock} are code that can be reactive on a smaller subset of
   * inputs, i.e. they create their own new reactive scope.
   *
   * They are generated as being wrapped under a conditional so that they are
   * only re-evaluated if their reactive inputs has changed.
   *
   * Such blocks are "memoized" for auto-memoization, but they are also going to
   * be used by reactive effects, etc.
   */
  Reactive,
}

export interface RenderBlock extends Block {
  kind: BlockKind.Render;
}

export const isRenderBlock = (block: Block): block is RenderBlock =>
  block.kind === BlockKind.Render;

export function createRenderBlock(instr: Instr): RenderBlock {
  return {
    kind: BlockKind.Render,
    body: [instr],
  };
}

export interface ReactiveBlock extends Block {
  kind: BlockKind.Reactive;

  /**
   * The set of reactive values invalidates this block.
   */
  inputs: Set<IR.ReactiveVal>;

  /**
   * The set of declarations included in this block.
   */
  outputDecls: Set<IR.BindingVal>;

  /**
   * The set of definitions produced by this block.
   */
  outputs: Set<IR.BindingVal>;

  /**
   * TODO: an fusion optimization can merge other {@link ReactiveBlock} as
   * its children to save comparsion.
   */
  subBlocks: Block[];

  emit(instr: Instr): void;
}

export function isReactiveBlock(b: Block): b is ReactiveBlock {
  return b.kind === BlockKind.Reactive;
}

export function createReactiveBlock(
  inputs: Set<IR.ReactiveVal>
): ReactiveBlock {
  return {
    kind: BlockKind.Reactive,
    body: [],
    emit(this: ReactiveBlock, instr: Instr) {
      this.body.push(instr);

      for (const decl of instr.ir.decls) {
        this.outputDecls.add(decl);
      }

      // Add all non-input defs (decls and mutable uses) as outputs.
      for (const def of instr.ir.defs) {
        if (IR.isBindingVal(def) && !IR.isInputVal(def)) {
          this.outputs.add(def);
        }
      }
    },
    inputs,
    outputDecls: new Set(),
    outputs: new Set(),
    subBlocks: [],
  };
}

/**
 * @returns all uses of a @param block
 */
export function getAllUses(block: Block): Set<IR.Val> {
  const res = new Set<IR.Val>();
  for (const instr of block.body) {
    for (const use of instr.ir.uses) {
      res.add(use.val);
    }
  }
  return res;
}

/**
 * @returns all definitions of a @param block
 */
export function getAllDefs(block: Block): Set<IR.Val> {
  const res = new Set<IR.Val>();
  for (const instr of block.body) {
    for (const def of instr.ir.defs) {
      res.add(def);
    }
  }
  return res;
}

/**
 * @returns all declared values of a @param block
 */
export function getAllDecls(block: Block): Set<IR.Val> {
  const res = new Set<IR.Val>();
  for (const instr of block.body) {
    for (const def of instr.ir.decls) {
      res.add(def);
    }
  }
  return res;
}
