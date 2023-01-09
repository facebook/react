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
  lower,
  mergeConsecutiveBlocks,
  ReactiveFunction,
} from "./HIR";
import { inferMutableRanges, inferReferenceEffects } from "./Inference";
import { constantPropagation } from "./Optimization";
import {
  buildReactiveFunction,
  codegenReactiveFunction,
  flattenReactiveLoops,
  inferReactiveScopes,
  inferReactiveScopeVariables,
  propagateScopeDependencies,
  pruneUnusedLabels,
  pruneUnusedLValues,
  pruneUnusedScopes,
  renameVariables,
} from "./ReactiveScopes";
import { eliminateRedundantPhi, enterSSA, leaveSSA } from "./SSA";
import { inferTypes } from "./TypeInference";
import { logHIRFunction, logReactiveFunction } from "./Utils/logger";

export type CompilerResult = {
  ast: t.Function;
  ir: HIRFunction;
  reactiveFunction: ReactiveFunction;
};

export default function (
  func: NodePath<t.FunctionDeclaration>
): CompilerResult {
  const env = new Environment();

  const ir = lower(func, env);
  logHIRFunction("HIR", ir);

  mergeConsecutiveBlocks(ir);
  logHIRFunction("mergeConsecutiveBlocks", ir);

  enterSSA(ir, env);
  logHIRFunction("SSA", ir);

  eliminateRedundantPhi(ir);
  logHIRFunction("eliminateRedundantPhi", ir);

  constantPropagation(ir);
  logHIRFunction("constantPropagation", ir);

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
  logReactiveFunction("buildReactiveFunction", reactiveFunction);

  pruneUnusedLabels(reactiveFunction);
  logReactiveFunction("pruneUnusedLabels", reactiveFunction);

  flattenReactiveLoops(reactiveFunction);
  logReactiveFunction("flattenReactiveLoops", reactiveFunction);

  propagateScopeDependencies(reactiveFunction);
  logReactiveFunction("propagateScopeDependencies", reactiveFunction);

  pruneUnusedScopes(reactiveFunction);
  logReactiveFunction("pruneUnusedScopes", reactiveFunction);

  pruneUnusedLValues(reactiveFunction);
  logReactiveFunction("pruneUnusedLValues", reactiveFunction);

  renameVariables(reactiveFunction);
  logReactiveFunction("renameVariables", reactiveFunction);

  const ast = codegenReactiveFunction(reactiveFunction);

  return {
    ast,
    ir,
    reactiveFunction,
  };
}
