/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as IR from "../IR";
import { Block } from "./Block";
import { createMemoCache, MemoCache } from "./MemoCache";

/**
 * LIR Function.
 */
export class Func {
  // React IR
  ir: IR.Func;
  hasSingleReturnPath: boolean;

  blocks: Block[] = [];

  // The associated memoization cache IR.
  memoCache: MemoCache = createMemoCache();

  constructor(ir: IR.Func) {
    this.ir = ir;
    this.hasSingleReturnPath =
      (!ir.isImplicitReturn && ir.returnCount == 1) ||
      (ir.isImplicitReturn && ir.returnCount == 0);
  }

  addBlock(block: Block): void {
    this.blocks.push(block);
  }
}
