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
}
