/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import {
  Environment,
  HIRFunction,
  inferMutableRanges,
  inferReferenceEffects,
  inferTypes,
  lower,
} from "./HIR";
import {
  buildReactiveFunction,
  codegenReactiveFunction,
  flattenReactiveLoops,
  inferReactiveScopes,
  inferReactiveScopeVariables,
  printReactiveFunction,
  propagateScopeDependencies,
  pruneUnusedLabels,
  pruneUnusedScopes,
} from "./ReactiveScopes";
import { eliminateRedundantPhi, enterSSA, leaveSSA } from "./SSA";
import { logHIRFunction } from "./Utils/logger";

export type CompilerResult = {
  ir: HIRFunction;
  ast: t.Function;
  scopes: string;
};

export default function (
  func: NodePath<t.FunctionDeclaration>
): CompilerResult {
  const env = new Environment();

  const ir = lower(func, env);
  logHIRFunction("HIR", ir);

  enterSSA(ir, env);
  logHIRFunction("SSA", ir);

  eliminateRedundantPhi(ir);
  logHIRFunction("eliminateRedundantPhi", ir);

  inferTypes(ir);
  logHIRFunction("inferTypes", ir);

  inferReferenceEffects(ir);
  logHIRFunction("inferReferenceEffects", ir);

  inferMutableRanges(ir);
  logHIRFunction("inferMutableRanges", ir);

  leaveSSA(ir);
  logHIRFunction("leaveSSA", ir);

  inferReactiveScopeVariables(ir);
  logHIRFunction("inferReactiveScopeVariables", ir);

  inferReactiveScopes(ir);
  logHIRFunction("inferReactiveScopes", ir);

  const reactiveFunction = buildReactiveFunction(ir);
  pruneUnusedLabels(reactiveFunction);
  flattenReactiveLoops(reactiveFunction);
  propagateScopeDependencies(reactiveFunction);
  pruneUnusedScopes(reactiveFunction);
  const scopes = printReactiveFunction(reactiveFunction);
  const ast = codegenReactiveFunction(reactiveFunction);

  return {
    ast,
    ir,
    scopes,
  };
}
