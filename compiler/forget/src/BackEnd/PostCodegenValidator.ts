/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { CompilerContext } from "../CompilerContext";
import * as LIR from "../LIR";
import { PassKind, PassName } from "../Pass";

/**
 * Optional post-codegen pass to validate the generated source code does not introduce
 * bugs. Enable by passing a `postCodegenValidator` validation function in compiler options.
 */
export default {
  name: PassName.Validator,
  kind: PassKind.LIRProg as const,
  run,
};

export function run(lirProg: LIR.Prog, context: CompilerContext) {
  // Only run validation if the input has React functions and was successfully
  // transformed (no bailouts)
  if (lirProg.funcs.size === 0 || context.bailouts.length !== 0) {
    return;
  }
  const postCodegenValidator = context.opts.postCodegenValidator;
  if (postCodegenValidator === null) {
    return;
  }
  const prog = lirProg.ir.ast;
  const source = String(prog);
  const errors = postCodegenValidator(source);
  if (errors != null && errors.length > 0) {
    const messages = [];
    for (const error of errors) {
      messages.push(error.message);
    }
    throw new Error(
      `Generated code failed validation:\n${messages.join("\n")}`
    );
  }
}
