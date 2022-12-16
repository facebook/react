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
import prettyPrint from "../IR/PrettyPrinter";
import { PassKind, PassName } from "../Pass";

/**
 * An optional debug step when the output {@link OutputKind.IR} is enabled.
 * Records the output IR in the compiler context.
 */
export default {
  name: PassName.DumpIR,
  kind: PassKind.IRFunc as const,
  run,
};

export function run(
  irFunc: IR.Func,
  func: NodePath<t.Function>,
  context: CompilerContext
) {
  if (context.opts.outputKinds.includes(OutputKind.IR)) {
    const output = [...context.irProg.funcs.values()]
      .map((irFunc) => prettyPrint(irFunc))
      .join("\n\n");

    context.outputs[OutputKind.IR] = output;
  }
}
