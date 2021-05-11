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
import * as IR from "../IR";
import prettyPrint from "../LIR/PrettyPrinter";
import { PassKind, PassName } from "../Pass";

/**
 * Dump LIR
 */
export default {
  name: PassName.DumpLIR,
  kind: PassKind.IRFunc as const,
  run,
};

export function run(
  irFunc: IR.Func,
  func: NodePath<t.Function>,
  context: CompilerContext
) {
  if (context.opts.outputKinds.includes(OutputKind.LIR)) {
    const output = [...context.lirProg.funcs.values()]
      .map((lirFunc) => prettyPrint(lirFunc))
      .join("\n\n");

    context.outputs[OutputKind.LIR] = output;
  }
}
