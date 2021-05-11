/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as IR from "../IR";
import { Func } from "./Func";

export class Prog {
  ir: IR.Prog;

  funcs: Map<IR.Func, Func> = new Map();

  constructor(ir: IR.Prog) {
    this.ir = ir;
  }

  /**
   * @return whether or not this prog needs to import useMemoCache.
   */
  importUseMemoCache(): boolean {
    return this.funcs.size > 0;
  }
}
