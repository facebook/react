/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import prettyFormat from "pretty-format";
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
  dropManualMemoization,
  inferMutableRanges,
  inferReactivePlaces,
  inferReferenceEffects,
  inlineImmediatelyInvokedFunctionExpressions,
} from "../Inference";
import {
  constantPropagation,
  deadCodeElimination,
  pruneMaybeThrows,
} from "../Optimization";
import {
  CodegenFunction,
  alignObjectMethodScopes,
  alignReactiveScopesToBlockScopes,
  assertScopeInstructionsWithinScopes,
  buildReactiveBlocks,
  buildReactiveFunction,
  codegenFunction,
  extractScopeDeclarationsFromDestructuring,
  flattenReactiveLoops,
  flattenScopesWithHooks,
  inferReactiveScopeVariables,
  memoizeFbtOperandsInSameScope,
  mergeOverlappingReactiveScopes,
  mergeReactiveScopesThatInvalidateTogether,
  promoteUsedTemporaries,
  propagateEarlyReturns,
  propagateScopeDependencies,
  pruneAllReactiveScopes,
  pruneHoistedContexts,
  pruneNonEscapingScopes,
  pruneNonReactiveDependencies,
  pruneUnusedLValues,
  pruneUnusedLabels,
  pruneUnusedScopes,
  renameVariables,
} from "../ReactiveScopes";
import { eliminateRedundantPhi, enterSSA, leaveSSA } from "../SSA";
import { inferTypes } from "../TypeInference";
import {
  logCodegenFunction,
  logDebug,
  logHIRFunction,
  logReactiveFunction,
} from "../Utils/logger";
import { assertExhaustive } from "../Utils/utils";
import {
  validateContextVariableLValues,
  validateHooksUsage,
  validateMemoizedEffectDependencies,
  validateNoCapitalizedCalls,
  validateNoRefAccessInRender,
  validateNoSetStateInRender,
  validatePreservedManualMemoization,
  validateUseMemo,
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
  config: EnvironmentConfig,
  filename: string | null
): Generator<CompilerPipelineValue, CodegenFunction> {
  const contextIdentifiers = findContextIdentifiers(func);
  const env = new Environment(config, contextIdentifiers);
  yield {
    kind: "debug",
    name: "EnvironmentConfig",
    value: prettyFormat(env.config),
  };
  const ast = yield* runWithEnvironment(func, env, filename);
  return ast;
}

/*
 * Note: this is split from run() to make `config` out of scope, so that all
 * access to feature flags has to be through the Environment for consistency.
 */
function* runWithEnvironment(
  func: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  env: Environment,
  filename: string | null
): Generator<CompilerPipelineValue, CodegenFunction> {
  const hir = lower(func, env).unwrap();
  yield log({ kind: "hir", name: "HIR", value: hir });

  pruneMaybeThrows(hir);
  yield log({ kind: "hir", name: "PruneMaybeThrows", value: hir });

  validateContextVariableLValues(hir);
  validateUseMemo(hir);

  dropManualMemoization(hir);
  yield log({ kind: "hir", name: "DropManualMemoization", value: hir });

  inlineImmediatelyInvokedFunctionExpressions(hir);
  yield log({
    kind: "hir",
    name: "InlineImmediatelyInvokedFunctionExpressions",
    value: hir,
  });

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

  if (env.config.validateHooksUsage) {
    validateHooksUsage(hir);
  }

  if (env.config.validateNoCapitalizedCalls) {
    validateNoCapitalizedCalls(hir);
  }

  analyseFunctions(hir);
  yield log({ kind: "hir", name: "AnalyseFunctions", value: hir });

  inferReferenceEffects(hir);
  yield log({ kind: "hir", name: "InferReferenceEffects", value: hir });

  // Note: Has to come after infer reference effects because "dead" code may still affect inference
  deadCodeElimination(hir);
  yield log({ kind: "hir", name: "DeadCodeElimination", value: hir });

  pruneMaybeThrows(hir);
  yield log({ kind: "hir", name: "PruneMaybeThrows", value: hir });

  inferMutableRanges(hir);
  yield log({ kind: "hir", name: "InferMutableRanges", value: hir });

  if (env.config.assertValidMutableRanges) {
    assertValidMutableRanges(hir);
  }

  if (env.config.validateRefAccessDuringRender) {
    validateNoRefAccessInRender(hir);
  }

  if (env.config.validateNoSetStateInRender) {
    validateNoSetStateInRender(hir);
  }

  inferReactivePlaces(hir);
  yield log({ kind: "hir", name: "InferReactivePlaces", value: hir });

  leaveSSA(hir);
  yield log({ kind: "hir", name: "LeaveSSA", value: hir });

  inferReactiveScopeVariables(hir);
  yield log({ kind: "hir", name: "InferReactiveScopeVariables", value: hir });

  alignObjectMethodScopes(hir);
  yield log({
    kind: "hir",
    name: "AlignObjectMethodScopes",
    value: hir,
  });

  const reactiveFunction = buildReactiveFunction(hir);
  yield log({
    kind: "reactive",
    name: "BuildReactiveFunction",
    value: reactiveFunction,
  });

  pruneUnusedLabels(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PruneUnusedLabels",
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

  if (env.config.disableAllMemoization) {
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

  assertScopeInstructionsWithinScopes(reactiveFunction);

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

  pruneNonEscapingScopes(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PruneNonEscapingScopes",
    value: reactiveFunction,
  });

  pruneNonReactiveDependencies(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PruneNonReactiveDependencies",
    value: reactiveFunction,
  });

  propagateEarlyReturns(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PropagateEarlyReturns",
    value: reactiveFunction,
  });

  pruneUnusedScopes(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PruneUnusedScopes",
    value: reactiveFunction,
  });

  mergeReactiveScopesThatInvalidateTogether(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "MergeReactiveScopesThatInvalidateTogether",
    value: reactiveFunction,
  });

  promoteUsedTemporaries(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PromoteUsedTemporaries",
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

  pruneHoistedContexts(reactiveFunction);
  yield log({
    kind: "reactive",
    name: "PruneHoistedContexts",
    value: reactiveFunction,
  });

  if (env.config.validateMemoizedEffectDependencies) {
    validateMemoizedEffectDependencies(reactiveFunction);
  }

  if (
    env.config.enablePreserveExistingMemoizationGuarantees ||
    env.config.validatePreserveExistingMemoizationGuarantees
  ) {
    validatePreservedManualMemoization(reactiveFunction);
  }

  const ast = codegenFunction(reactiveFunction, filename).unwrap();
  yield log({ kind: "ast", name: "Codegen", value: ast });

  /**
   * This flag should be only set for unit / fixture tests to check
   * that Forget correctly handles unexpected errors (e.g. exceptions
   * thrown by babel functions or other unexpected exceptions).
   */
  if (env.config.throwUnknownException__testonly) {
    throw new Error("unexpected error");
  }

  return ast;
}

export function compileFn(
  func: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  config: EnvironmentConfig,
  filename: string | null
): CodegenFunction {
  let generator = run(func, config, filename);
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
      logCodegenFunction(value.name, value.value);
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
      logDebug(value.name, value.value);
      break;
    }
    default: {
      assertExhaustive(value, "Unexpected compilation kind");
    }
  }
  return value;
}
