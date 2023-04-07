/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import {
  HIRFunction,
  lower,
  mergeConsecutiveBlocks,
  ReactiveFunction,
  validateConsistentIdentifiers,
  validateTerminalSuccessors,
} from "./HIR";
import { Environment, EnvironmentConfig } from "./HIR/Environment";
import {
  analyseFunctions,
  dropMemoCalls,
  inferMutableRanges,
  inferReferenceEffects,
  inlineUseMemo,
} from "./Inference";
import { constantPropagation, deadCodeElimination } from "./Optimization";
import {
  alignReactiveScopesToBlockScopes,
  buildReactiveBlocks,
  buildReactiveFunction,
  codegenReactiveFunction,
  flattenReactiveLoops,
  flattenScopesWithHooks,
  inferReactiveScopeVariables,
  memoizeFbtOperandsInSameScope,
  mergeOverlappingReactiveScopes,
  promoteUsedTemporaries,
  propagateScopeDependencies,
  pruneNonEscapingScopes,
  pruneNonReactiveDependencies,
  pruneUnusedLabels,
  pruneUnusedLValues,
  pruneUnusedScopes,
  renameVariables,
} from "./ReactiveScopes";
import { eliminateRedundantPhi, enterSSA, leaveSSA } from "./SSA";
import { inferTypes } from "./TypeInference";
import { logHIRFunction, logReactiveFunction } from "./Utils/logger";
import { assertExhaustive } from "./Utils/utils";

export type CompilerPipelineValue =
  | { kind: "ast"; name: string; value: t.FunctionDeclaration }
  | { kind: "hir"; name: string; value: HIRFunction }
  | { kind: "reactive"; name: string; value: ReactiveFunction };

export function* run(
  func: NodePath<t.FunctionDeclaration>,
  config?: EnvironmentConfig | null
): Generator<CompilerPipelineValue, t.FunctionDeclaration> {
  const env = new Environment(config ?? null);
  const hir = lower(func, env).unwrap();
  yield log({ kind: "hir", name: "HIR", value: hir });

  inlineUseMemo(hir);
  yield log({ kind: "hir", name: "RewriteUseMemo", value: hir });

  mergeConsecutiveBlocks(hir);
  yield log({ kind: "hir", name: "MergeConsecutiveBlocks", value: hir });

  validateConsistentIdentifiers(hir);
  validateTerminalSuccessors(hir);

  enterSSA(hir);
  yield log({ kind: "hir", name: "SSA", value: hir });

  validateConsistentIdentifiers(hir);

  eliminateRedundantPhi(hir);
  yield log({ kind: "hir", name: "EliminateRedundantPhi", value: hir });

  constantPropagation(hir);
  yield log({ kind: "hir", name: "ConstantPropagation", value: hir });

  inferTypes(hir);
  yield log({ kind: "hir", name: "InferTypes", value: hir });

  dropMemoCalls(hir);
  yield log({ kind: "hir", name: "DropMemoCalls", value: hir });

  analyseFunctions(hir);
  yield log({ kind: "hir", name: "AnalyseFunctions", value: hir });

  inferReferenceEffects(hir);
  yield log({ kind: "hir", name: "InferReferenceEffects", value: hir });

  // Note: Has to come after infer reference effects because "dead" code may still affect inference
  deadCodeElimination(hir);
  yield log({ kind: "hir", name: "DeadCodeElimination", value: hir });

  inferMutableRanges(hir);
  yield log({ kind: "hir", name: "InferMutableRanges", value: hir });

  leaveSSA(hir);
  yield log({ kind: "hir", name: "LeaveSSA", value: hir });

  inferReactiveScopeVariables(hir);
  yield log({ kind: "hir", name: "InferReactiveScopeVariables", value: hir });

  const reactiveFunction = buildReactiveFunction(hir);
  yield log({
    kind: "reactive",
    name: "BuildReactiveFunction",
    value: reactiveFunction,
  });

  memoizeFbtOperandsInSameScope(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "MemoizeFbtOperandsInSameScope",
    value: reactiveFunction,
  });

  alignReactiveScopesToBlockScopes(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "AlignReactiveScopesToBlockScopes",
    value: reactiveFunction,
  });

  mergeOverlappingReactiveScopes(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "MergeOverlappingReactiveScopes",
    value: reactiveFunction,
  });

  buildReactiveBlocks(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "BuildReactiveBlocks",
    value: reactiveFunction,
  });

  flattenReactiveLoops(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "FlattenReactiveLoops",
    value: reactiveFunction,
  });

  flattenScopesWithHooks(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "FlattenScopesWithHooks",
    value: reactiveFunction,
  });

  propagateScopeDependencies(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PropagateScopeDependencies",
    value: reactiveFunction,
  });

  pruneNonEscapingScopes(reactiveFunction, {
    memoizeJsxElements: config?.memoizeJsxElements ?? true,
  });
  yield log({
    kind: "reactive",
    name: "PruneNonEscapingDependencies",
    value: reactiveFunction,
  });

  pruneNonReactiveDependencies(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PruneNonReactiveDependencies",
    value: reactiveFunction,
  });

  pruneUnusedScopes(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PruneUnusedScopes",
    value: reactiveFunction,
  });

  promoteUsedTemporaries(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PromoteUsedTemporaries",
    value: reactiveFunction,
  });

  pruneUnusedLabels(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PruneUnusedLabels",
    value: reactiveFunction,
  });

  pruneUnusedLValues(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PruneUnusedLValues",
    value: reactiveFunction,
  });

  renameVariables(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "RenameVariables",
    value: reactiveFunction,
  });

  const ast = codegenReactiveFunction(reactiveFunction).unwrap();
  yield log({ kind: "ast", name: "Codegen", value: ast });

  return ast;
}

export function compile(
  func: NodePath<t.FunctionDeclaration>,
  options?: Partial<EnvironmentConfig> | null
): t.FunctionDeclaration {
  let generator = run(func, options);
  while (true) {
    const next = generator.next();
    if (next.done) {
      return next.value;
    }
  }
}

export function log(value: CompilerPipelineValue): CompilerPipelineValue {
  switch (value.kind) {
    case "ast": {
      break;
    }
    case "hir": {
      logHIRFunction(value.name, value.value);
      break;
    }
    case "reactive": {
      logReactiveFunction(value.name, value.value);
      break;
    }
    default: {
      assertExhaustive(value, "Unexpected compilation kind");
    }
  }
  return value;
}
