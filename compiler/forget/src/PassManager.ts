/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import type { Program } from "@babel/types";
import { CompilerContext } from "./CompilerContext";
import { Pass, PassName, runPass } from "./Pass";

export class PassManager {
  program: NodePath<Program>;
  context: CompilerContext;
  passes: Pass[];

  constructor(program: NodePath<Program>, context: CompilerContext) {
    this.program = program;
    this.context = context;
    this.passes = [];
  }

  addPass(pass: Pass) {
    this.passes.push(pass);
  }

  runAll() {
    let hasMutatedBabelAST = false;
    for (const pass of this.passes) {
      if (pass.mutatesBabelAST) {
        hasMutatedBabelAST = true;
      }
      if (pass.name === PassName.JSGen && this.context.hasBailedOut()) {
        break;
      }
      try {
        runPass(pass, this.program, this.context);
      } catch (e) {
        this.context.bailoutWithoutDiagnostic(`UnexpectedError: ${e}`);
        // console log stacktrace in jest
        if (global.__DEV__) {
          console.error(e.stack);
        }
        if (hasMutatedBabelAST) {
          // The AST has been mutated, we can't bail out anymore.
          throw e;
        } else {
          this.context.logger.error(e.toString());
          return;
        }
      }
      // check if this is the stopPass
      if (pass.name === this.context.opts.stopPass) {
        break;
      }
    }
  }
}
