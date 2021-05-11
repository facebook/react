/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import * as BE from "./BackEnd";
import { CompilerContext } from "./CompilerContext";
import { CompilerOptions } from "./CompilerOptions";
import * as ME from "./MiddleEnd";
import { PassManager } from "./PassManager";

/**
 * Compiler Driver
 *
 * Owns {@link CompilerContext} and source program.
 */
export interface CompilerDriver {
  context: CompilerContext;
  program: NodePath<t.Program>;
  compile(): void;
}

export function createCompilerDriver(
  options: CompilerOptions,
  program: NodePath<t.Program>
): CompilerDriver {
  const context = new CompilerContext(options, program);

  return {
    context,
    program,
    compile() {
      const passManager = new PassManager(program, context);

      // Syntax Analysis and IR Generation.
      passManager.addPass(ME.ReactFuncsInfer);
      passManager.addPass(ME.ParamAnalysis);
      passManager.addPass(ME.BodyAnalysis);
      passManager.addPass(ME.SketchyCodeCheck);
      passManager.addPass(ME.RefKindInfer);
      passManager.addPass(ME.DumpIR);
      passManager.addPass(ME.IRCheck);
      passManager.addPass(ME.DumpCFG);

      // Dependency Analysis via DepGraph.
      passManager.addPass(ME.DepGraphAnalysis);

      // LIR Generation.
      passManager.addPass(BE.LIRGen);
      passManager.addPass(BE.MemoCacheAlloc);
      passManager.addPass(BE.DumpLIR);

      // JS Generation.
      passManager.addPass(BE.JSGen);

      passManager.runAll();
    },
  };
}
