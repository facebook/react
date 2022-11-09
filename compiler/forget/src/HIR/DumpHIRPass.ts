/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type { CompilerContext } from "../CompilerContext";
import { OutputKind } from "../CompilerOutputs";
import { PassKind, PassName } from "../Pass";

import { lower } from "../HIR/BuildHIR";
import { eliminateRedundantPhi } from "../HIR/EliminateRedundantPhi";
import enterSSA from "../HIR/EnterSSA";
import { inferMutableRanges } from "../HIR/InferMutableLifetimes";
import inferReferenceEffects from "../HIR/InferReferenceEffects";
import printHIR from "../HIR/PrintHIR";
import { Environment } from "./HIRBuilder";
import leaveSSA from "./LeaveSSA";

export default {
  name: PassName.DumpHIR,
  kind: PassKind.Prog as const,
  run,
};

/**
 * A step in the first approach compiler pipeline that outputs
 * the new architecture's HIR for the playground.
 */
export function run(program: NodePath<t.Program>, context: CompilerContext) {
  if (!context.opts.outputKinds.includes(OutputKind.HIR)) {
    return;
  }
  const results: string[] = [];
  program.traverse({
    Function(func) {
      try {
        const env = new Environment();
        const ir = lower(func, env);
        enterSSA(ir, env);
        eliminateRedundantPhi(ir);
        inferReferenceEffects(ir);
        inferMutableRanges(ir);
        leaveSSA(ir);
        const textHIR = printHIR(ir.body);
        results.push(textHIR);
      } catch (e) {
        results.push(`Error: ${e}`);
      }
    },
  });
  context.outputs[OutputKind.HIR] = results.join("\n\n");
}
