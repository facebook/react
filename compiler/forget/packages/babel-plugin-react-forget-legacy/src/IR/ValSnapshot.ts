/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import * as IR from ".";
import { dumpNodeLoc } from "../Common/Dumper";

export class ValSnapshot {
  node: t.Node | undefined;

  isInput: boolean;

  isReactive: boolean;

  pretty: string;

  constructor(val: IR.Val) {
    this.node = val.ast?.path.node;
    this.isInput = IR.isInputVal(val);
    this.isReactive = IR.isReactiveVal(val);
    // TODO: Add a snapshot version of `toString` to lazily compute this.
    this.pretty = val.toString();
  }

  toLoc() {
    return this.node ? dumpNodeLoc(this.node) : "";
  }

  toString() {
    return [this.toLoc(), this.pretty].filter(Boolean).join(" ");
  }
}
