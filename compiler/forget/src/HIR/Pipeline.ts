/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { lower } from "../HIR/BuildHIR";
import { eliminateRedundantPhi } from "../HIR/EliminateRedundantPhi";
import enterSSA from "../HIR/EnterSSA";
import { Environment } from "../HIR/HIRBuilder";
import inferReferenceEffects from "../HIR/InferReferenceEffects";
import { leaveSSA } from "../HIR/LeaveSSA";
import codegen from "./Codegen";
import { HIRFunction } from "./HIR";
import { inferMutableRanges } from "./InferMutableRanges";
import { inferReactiveScopes } from "./InferReactiveScopes";
import { inferReactiveScopeVariables } from "./InferReactiveScopeVariables";
import { inferTypes } from "./InferTypes";
import { logHIRFunction } from "./logger";

export type CompilerFlags = {
  eliminateRedundantPhi: boolean;
  inferReferenceEffects: boolean;
  inferTypes: boolean;
  inferMutableRanges: boolean;
  inferReactiveScopeVariables: boolean;
  inferReactiveScopes: boolean;
  inferReactiveScopeDependencies: boolean;
  leaveSSA: boolean;
  codegen: boolean;
};

export type CompilerResult = {
  ir: HIRFunction;
  ast: t.Function | null;
};

export default function (
  func: NodePath<t.FunctionDeclaration>,
  flags: CompilerFlags
): CompilerResult {
  const env = new Environment();

  const ir = lower(func, env);
  logHIRFunction("HIR", ir);

  enterSSA(ir, env);
  logHIRFunction("SSA", ir);

  if (flags.eliminateRedundantPhi) {
    eliminateRedundantPhi(ir);
    logHIRFunction("eliminateRedundantPhi", ir);
  }
  if (flags.inferTypes) {
    inferTypes(ir);
    logHIRFunction("inferTypes", ir);
  }
  if (flags.inferReferenceEffects) {
    inferReferenceEffects(ir);
    logHIRFunction("inferReferenceEffects", ir);
  }

  if (flags.inferMutableRanges) {
    inferMutableRanges(ir);
    logHIRFunction("inferMutableRanges", ir);
  }

  if (flags.leaveSSA) {
    leaveSSA(ir);
    logHIRFunction("leaveSSA", ir);
  }

  if (flags.inferReactiveScopeVariables) {
    inferReactiveScopeVariables(ir);
    logHIRFunction("inferReactiveScopeVariables", ir);
  }

  if (flags.inferReactiveScopes) {
    inferReactiveScopes(ir);
    logHIRFunction("inferReactiveScopes", ir);
  }

  if (flags.codegen) {
    return {
      ast: codegen(ir),
      ir: ir,
    };
  }

  return { ast: null, ir: ir };
}
