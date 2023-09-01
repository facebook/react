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
  ReactiveFunction,
  assertConsistentIdentifiers,
  assertTerminalSuccessorsExist,
  assertValidMutableRanges,
  lower,
  mergeConsecutiveBlocks,
} from "../HIR";
import { Environment, EnvironmentConfig } from "../HIR/Environment";
import { findContextIdentifiers } from "../HIR/FindContextIdentifiers";
import {
  analyseFunctions,
  dropMemoCalls,
  inferMutableRanges,
  inferReferenceEffects,
  inlineUseMemo,
} from "../Inference";
import { constantPropagation, deadCodeElimination } from "../Optimization";
import {
  CodegenFunction,
  alignReactiveScopesToBlockScopes,
  buildReactiveBlocks,
  buildReactiveFunction,
  codegenReactiveFunction,
  extractScopeDeclarationsFromDestructuring,
  flattenReactiveLoops,
  flattenScopesWithHooks,
  inferReactiveScopeVariables,
  memoizeFbtOperandsInSameScope,
  mergeOverlappingReactiveScopes,
  promoteUsedTemporaries,
  propagateScopeDependencies,
  pruneAllReactiveScopes,
  pruneNonEscapingScopes,
  pruneNonReactiveDependencies,
  pruneUnusedLValues,
  pruneUnusedLabels,
  pruneUnusedScopes,
  renameVariables,
} from "../ReactiveScopes";
import { eliminateRedundantPhi, enterSSA, leaveSSA } from "../SSA";
import { inferTypes } from "../TypeInference";
import { logHIRFunction, logReactiveFunction } from "../Utils/logger";
import { assertExhaustive } from "../Utils/utils";
import {
  validateFrozenLambdas,
  validateHooksUsage,
  validateNoRefAccessInRender,
  validateNoSetStateInRender,
  validateUnconditionalHooks,
} from "../Validation";

export type CompilerPipelineValue =
  | { kind: "ast"; name: string; value: CodegenFunction }
  | { kind: "hir"; name: string; value: HIRFunction }
  | { kind: "reactive"; name: string; value: ReactiveFunction }
  | { kind: "debug"; name: string; value: string };

export function* run(
  func: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  config?: EnvironmentConfig | null
): Generator<CompilerPipelineValue, CodegenFunction> {
  const contextIdentifiers = findContextIdentifiers(func);
  const env = new Environment(config ?? null, contextIdentifiers);
  const hir = lower(func, env).unwrap();
  yield log({ kind: "hir", name: "HIR", value: hir });

  if (config?.inlineUseMemo) {
    inlineUseMemo(hir);
    yield log({ kind: "hir", name: "RewriteUseMemo", value: hir });
  }

  mergeConsecutiveBlocks(hir);
  yield log({ kind: "hir", name: "MergeConsecutiveBlocks", value: hir });

  assertConsistentIdentifiers(hir);
  assertTerminalSuccessorsExist(hir);

  enterSSA(hir);
  yield log({ kind: "hir", name: "SSA", value: hir });

  eliminateRedundantPhi(hir);
  yield log({ kind: "hir", name: "EliminateRedundantPhi", value: hir });

  assertConsistentIdentifiers(hir);

  constantPropagation(hir);
  yield log({ kind: "hir", name: "ConstantPropagation", value: hir });

  inferTypes(hir);
  yield log({ kind: "hir", name: "InferTypes", value: hir });

  if (env.validateHooksUsage) {
    validateHooksUsage(hir);
    const conditionalHooksResult = validateUnconditionalHooks(hir).unwrap();
    yield log({
      kind: "debug",
      name: "ValidateUnconditionalHooks",
      value: conditionalHooksResult.debug(),
    });
  }

  dropMemoCalls(hir);
  yield log({ kind: "hir", name: "DropMemoCalls", value: hir });

  analyseFunctions(hir);
  yield log({ kind: "hir", name: "AnalyseFunctions", value: hir });

  inferReferenceEffects(hir);
  yield log({ kind: "hir", name: "InferReferenceEffects", value: hir });

  if (env.validateFrozenLambdas) {
    validateFrozenLambdas(hir);
  }

  // Note: Has to come after infer reference effects because "dead" code may still affect inference
  deadCodeElimination(hir);
  yield log({ kind: "hir", name: "DeadCodeElimination", value: hir });

  inferMutableRanges(hir);
  yield log({ kind: "hir", name: "InferMutableRanges", value: hir });

  if (env.assertValidMutableRanges) {
    assertValidMutableRanges(hir);
  }

  if (env.validateRefAccessDuringRender) {
    validateNoRefAccessInRender(hir);
  }

  if (env.validateNoSetStateInRender) {
    const noSetStateInRenderResult = validateNoSetStateInRender(hir).unwrap();
    yield log({
      kind: "debug",
      name: "ValidateNoSetStateInRender",
      value: noSetStateInRenderResult.debug(),
    });
  }

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

  if (env.disableAllMemoization) {
    pruneAllReactiveScopes(reactiveFunction);
    yield log({
      kind: "reactive",
      name: "PruneAllReactiveScopes",
      value: reactiveFunction,
    });
  }

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

  let memoizeJsxElements = config?.memoizeJsxElements ?? true;
  if (config?.enableForest) {
    memoizeJsxElements = false;
  }
  pruneNonEscapingScopes(reactiveFunction, { memoizeJsxElements });
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

  extractScopeDeclarationsFromDestructuring(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "ExtractScopeDeclarationsFromDestructuring",
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

export function compileFn(
  func: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  options?: Partial<EnvironmentConfig> | null
): CodegenFunction {
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
    case "debug": {
      break;
    }
    default: {
      assertExhaustive(value, "Unexpected compilation kind");
    }
  }
  return value;
}
