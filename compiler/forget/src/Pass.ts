/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NodePath } from "@babel/traverse";
import type { Function, Program } from "@babel/types";
import { assertExhaustive } from "./Common/utils";
import type { CompilerContext } from "./CompilerContext";
import * as IR from "./IR";
import * as LIR from "./LIR";

export enum PassName {
  // MiddleEnd
  ReactFuncsInfer = 0,
  ParamAnalysis,
  BodyAnalysis,
  SketchyCodeCheck,
  RefKindInfer,
  DumpIR,
  DumpHIR,
  IRCheck,
  DepGraphAnalysis,
  // BackEnd
  LIRGen,
  MemoCacheAlloc,
  DumpLIR,
  JSGen,
  DumpCFG,
  Validator,
}

export function isBackEndPass(pass: PassName) {
  return pass >= PassName.LIRGen;
}

export enum PassKind {
  Prog,
  Func,
  IRProg,
  IRFunc,
  LIRProg,
  LIRFunc,
}

export type Pass =
  | ProgPass
  | FuncPass
  | IRProgPass
  | IRFuncPass
  | LIRProgPass
  | LIRFuncPass;

export type BasePass = {
  name: PassName;

  /**
   * If set to true, this pass and any passes after it are not allowed to
   * bail out as it's not longer possible to do so cleanly.
   */
  mutatesBabelAST?: boolean;
};

/**
 * Pass run on Babel's `Program` node, which are really just module btw.
 */
export type ProgPass = BasePass & {
  kind: PassKind.Prog;
  run(prog: NodePath<Program>, context: CompilerContext): void;
};

/**
 * Pass on Babel's `Function` node.
 */
export type FuncPass = BasePass & {
  kind: PassKind.Func;
  run(func: NodePath<Function>, context: CompilerContext): void;
};

/**
 * Pass on {@link IR.Prog}
 */
export type IRProgPass = BasePass & {
  kind: PassKind.IRProg;
  run(prog: IR.Prog, context: CompilerContext): void;
};

/**
 * Pass on {@link IR.Func}
 */
export type IRFuncPass = BasePass & {
  kind: PassKind.IRFunc;
  run(
    irFunc: IR.Func,
    func: NodePath<Function>,
    context: CompilerContext
  ): void;
};

/**
 * Pass on {@link LIR.Prog}
 */
export type LIRProgPass = BasePass & {
  kind: PassKind.LIRProg;
  run(prog: LIR.Prog, context: CompilerContext): void;
};

/**
 * Pass on {@link LIR.Func}
 */
export type LIRFuncPass = BasePass & {
  kind: PassKind.LIRFunc;
  run(lir: LIR.Func, func: NodePath<Function>, context: CompilerContext): void;
};

/**
 * Run a pass
 * @param pass
 * @param program
 * @param context
 */
export function runPass(
  pass: Pass,
  program: NodePath<Program>,
  context: CompilerContext
) {
  switch (pass.kind) {
    case PassKind.Prog:
      pass.run(program, context);
      break;

    case PassKind.Func:
      program.traverse({
        Function(func) {
          pass.run(func, context);
        },
      });
      break;

    case PassKind.IRProg:
      pass.run(context.irProg, context);
      break;

    case PassKind.IRFunc:
      for (const [func, irFunc] of context.irProg.funcs) {
        pass.run(irFunc, func, context);
      }
      break;

    case PassKind.LIRProg:
      pass.run(context.lirProg, context);
      break;

    case PassKind.LIRFunc:
      for (const [irFunc, lirFunc] of context.lirProg.funcs) {
        pass.run(lirFunc, irFunc.ast, context);
      }
      break;

    default:
      assertExhaustive(pass, `Unhandled pass: ${pass}`);
  }
}
