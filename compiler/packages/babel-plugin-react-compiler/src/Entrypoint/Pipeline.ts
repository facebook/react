/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/traverse';
import * as t from '@babel/types';
import prettyFormat from 'pretty-format';
import {Logger} from '.';
import {
  HIRFunction,
  ReactiveFunction,
  assertConsistentIdentifiers,
  assertTerminalPredsExist,
  assertTerminalSuccessorsExist,
  assertValidBlockNesting,
  assertValidMutableRanges,
  buildReactiveScopeTerminalsHIR,
  lower,
  mergeConsecutiveBlocks,
  mergeOverlappingReactiveScopesHIR,
  pruneUnusedLabelsHIR,
} from '../HIR';
import {
  Environment,
  EnvironmentConfig,
  ReactFunctionType,
} from '../HIR/Environment';
import {findContextIdentifiers} from '../HIR/FindContextIdentifiers';
import {
  analyseFunctions,
  dropManualMemoization,
  inferMutableRanges,
  inferReactivePlaces,
  inferReferenceEffects,
  inlineImmediatelyInvokedFunctionExpressions,
  inferEffectDependencies,
} from '../Inference';
import {
  constantPropagation,
  deadCodeElimination,
  pruneMaybeThrows,
  inlineJsxTransform,
} from '../Optimization';
import {instructionReordering} from '../Optimization/InstructionReordering';
import {
  CodegenFunction,
  alignObjectMethodScopes,
  assertScopeInstructionsWithinScopes,
  assertWellFormedBreakTargets,
  buildReactiveFunction,
  codegenFunction,
  extractScopeDeclarationsFromDestructuring,
  inferReactiveScopeVariables,
  memoizeFbtAndMacroOperandsInSameScope,
  mergeReactiveScopesThatInvalidateTogether,
  promoteUsedTemporaries,
  propagateEarlyReturns,
  pruneHoistedContexts,
  pruneNonEscapingScopes,
  pruneNonReactiveDependencies,
  pruneUnusedLValues,
  pruneUnusedLabels,
  pruneUnusedScopes,
  renameVariables,
} from '../ReactiveScopes';
import {alignMethodCallScopes} from '../ReactiveScopes/AlignMethodCallScopes';
import {alignReactiveScopesToBlockScopesHIR} from '../ReactiveScopes/AlignReactiveScopesToBlockScopesHIR';
import {flattenReactiveLoopsHIR} from '../ReactiveScopes/FlattenReactiveLoopsHIR';
import {flattenScopesWithHooksOrUseHIR} from '../ReactiveScopes/FlattenScopesWithHooksOrUseHIR';
import {pruneAlwaysInvalidatingScopes} from '../ReactiveScopes/PruneAlwaysInvalidatingScopes';
import pruneInitializationDependencies from '../ReactiveScopes/PruneInitializationDependencies';
import {stabilizeBlockIds} from '../ReactiveScopes/StabilizeBlockIds';
import {
  eliminateRedundantPhi,
  enterSSA,
  rewriteInstructionKindsBasedOnReassignment,
} from '../SSA';
import {inferTypes} from '../TypeInference';
import {
  validateContextVariableLValues,
  validateHooksUsage,
  validateMemoizedEffectDependencies,
  validateNoCapitalizedCalls,
  validateNoRefAccessInRender,
  validateNoSetStateInRender,
  validatePreservedManualMemoization,
  validateUseMemo,
} from '../Validation';
import {validateLocalsNotReassignedAfterRender} from '../Validation/ValidateLocalsNotReassignedAfterRender';
import {outlineFunctions} from '../Optimization/OutlineFunctions';
import {propagatePhiTypes} from '../TypeInference/PropagatePhiTypes';
import {lowerContextAccess} from '../Optimization/LowerContextAccess';
import {validateNoSetStateInPassiveEffects} from '../Validation/ValidateNoSetStateInPassiveEffects';
import {validateNoJSXInTryStatement} from '../Validation/ValidateNoJSXInTryStatement';
import {propagateScopeDependenciesHIR} from '../HIR/PropagateScopeDependenciesHIR';
import {outlineJSX} from '../Optimization/OutlineJsx';
import {optimizePropsMethodCalls} from '../Optimization/OptimizePropsMethodCalls';
import {transformFire} from '../Transform';
import {validateNoImpureFunctionsInRender} from '../Validation/ValiateNoImpureFunctionsInRender';

export type CompilerPipelineValue =
  | {kind: 'ast'; name: string; value: CodegenFunction}
  | {kind: 'hir'; name: string; value: HIRFunction}
  | {kind: 'reactive'; name: string; value: ReactiveFunction}
  | {kind: 'debug'; name: string; value: string};

function run(
  func: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  config: EnvironmentConfig,
  fnType: ReactFunctionType,
  useMemoCacheIdentifier: string,
  logger: Logger | null,
  filename: string | null,
  code: string | null,
): CodegenFunction {
  const contextIdentifiers = findContextIdentifiers(func);
  const env = new Environment(
    func.scope,
    fnType,
    config,
    contextIdentifiers,
    logger,
    filename,
    code,
    useMemoCacheIdentifier,
  );
  env.logger?.debugLogIRs?.({
    kind: 'debug',
    name: 'EnvironmentConfig',
    value: prettyFormat(env.config),
  });
  return runWithEnvironment(func, env);
}

/*
 * Note: this is split from run() to make `config` out of scope, so that all
 * access to feature flags has to be through the Environment for consistency.
 */
function runWithEnvironment(
  func: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  env: Environment,
): CodegenFunction {
  const log = (value: CompilerPipelineValue): void => {
    env.logger?.debugLogIRs?.(value);
  };
  const hir = lower(func, env).unwrap();
  log({kind: 'hir', name: 'HIR', value: hir});

  pruneMaybeThrows(hir);
  log({kind: 'hir', name: 'PruneMaybeThrows', value: hir});

  validateContextVariableLValues(hir);
  validateUseMemo(hir);

  if (
    !env.config.enablePreserveExistingManualUseMemo &&
    !env.config.disableMemoizationForDebugging &&
    !env.config.enableChangeDetectionForDebugging &&
    !env.config.enableMinimalTransformsForRetry
  ) {
    dropManualMemoization(hir);
    log({kind: 'hir', name: 'DropManualMemoization', value: hir});
  }

  inlineImmediatelyInvokedFunctionExpressions(hir);
  log({
    kind: 'hir',
    name: 'InlineImmediatelyInvokedFunctionExpressions',
    value: hir,
  });

  mergeConsecutiveBlocks(hir);
  log({kind: 'hir', name: 'MergeConsecutiveBlocks', value: hir});

  assertConsistentIdentifiers(hir);
  assertTerminalSuccessorsExist(hir);

  enterSSA(hir);
  log({kind: 'hir', name: 'SSA', value: hir});

  eliminateRedundantPhi(hir);
  log({kind: 'hir', name: 'EliminateRedundantPhi', value: hir});

  assertConsistentIdentifiers(hir);

  constantPropagation(hir);
  log({kind: 'hir', name: 'ConstantPropagation', value: hir});

  inferTypes(hir);
  log({kind: 'hir', name: 'InferTypes', value: hir});

  if (env.config.validateHooksUsage) {
    validateHooksUsage(hir);
  }

  if (env.config.enableFire) {
    transformFire(hir);
    log({kind: 'hir', name: 'TransformFire', value: hir});
  }

  if (env.config.validateNoCapitalizedCalls) {
    validateNoCapitalizedCalls(hir);
  }

  if (env.config.lowerContextAccess) {
    lowerContextAccess(hir, env.config.lowerContextAccess);
  }

  optimizePropsMethodCalls(hir);
  log({kind: 'hir', name: 'OptimizePropsMethodCalls', value: hir});

  analyseFunctions(hir);
  log({kind: 'hir', name: 'AnalyseFunctions', value: hir});

  inferReferenceEffects(hir);
  log({kind: 'hir', name: 'InferReferenceEffects', value: hir});

  validateLocalsNotReassignedAfterRender(hir);

  // Note: Has to come after infer reference effects because "dead" code may still affect inference
  deadCodeElimination(hir);
  log({kind: 'hir', name: 'DeadCodeElimination', value: hir});

  if (env.config.enableInstructionReordering) {
    instructionReordering(hir);
    log({kind: 'hir', name: 'InstructionReordering', value: hir});
  }

  pruneMaybeThrows(hir);
  log({kind: 'hir', name: 'PruneMaybeThrows', value: hir});

  inferMutableRanges(hir);
  log({kind: 'hir', name: 'InferMutableRanges', value: hir});

  if (env.config.assertValidMutableRanges) {
    assertValidMutableRanges(hir);
  }

  if (env.config.validateRefAccessDuringRender) {
    validateNoRefAccessInRender(hir);
  }

  if (env.config.validateNoSetStateInRender) {
    validateNoSetStateInRender(hir);
  }

  if (env.config.validateNoSetStateInPassiveEffects) {
    validateNoSetStateInPassiveEffects(hir);
  }

  if (env.config.validateNoJSXInTryStatements) {
    validateNoJSXInTryStatement(hir);
  }

  if (env.config.validateNoImpureFunctionsInRender) {
    validateNoImpureFunctionsInRender(hir);
  }

  inferReactivePlaces(hir);
  log({kind: 'hir', name: 'InferReactivePlaces', value: hir});

  rewriteInstructionKindsBasedOnReassignment(hir);
  log({
    kind: 'hir',
    name: 'RewriteInstructionKindsBasedOnReassignment',
    value: hir,
  });

  propagatePhiTypes(hir);
  log({
    kind: 'hir',
    name: 'PropagatePhiTypes',
    value: hir,
  });

  if (!env.config.enableMinimalTransformsForRetry) {
    inferReactiveScopeVariables(hir);
    log({kind: 'hir', name: 'InferReactiveScopeVariables', value: hir});
  }

  const fbtOperands = memoizeFbtAndMacroOperandsInSameScope(hir);
  log({
    kind: 'hir',
    name: 'MemoizeFbtAndMacroOperandsInSameScope',
    value: hir,
  });

  if (env.config.enableJsxOutlining) {
    outlineJSX(hir);
  }

  if (env.config.enableFunctionOutlining) {
    outlineFunctions(hir, fbtOperands);
    log({kind: 'hir', name: 'OutlineFunctions', value: hir});
  }

  alignMethodCallScopes(hir);
  log({
    kind: 'hir',
    name: 'AlignMethodCallScopes',
    value: hir,
  });

  alignObjectMethodScopes(hir);
  log({
    kind: 'hir',
    name: 'AlignObjectMethodScopes',
    value: hir,
  });

  pruneUnusedLabelsHIR(hir);
  log({
    kind: 'hir',
    name: 'PruneUnusedLabelsHIR',
    value: hir,
  });

  alignReactiveScopesToBlockScopesHIR(hir);
  log({
    kind: 'hir',
    name: 'AlignReactiveScopesToBlockScopesHIR',
    value: hir,
  });

  mergeOverlappingReactiveScopesHIR(hir);
  log({
    kind: 'hir',
    name: 'MergeOverlappingReactiveScopesHIR',
    value: hir,
  });
  assertValidBlockNesting(hir);

  buildReactiveScopeTerminalsHIR(hir);
  log({
    kind: 'hir',
    name: 'BuildReactiveScopeTerminalsHIR',
    value: hir,
  });

  assertValidBlockNesting(hir);

  flattenReactiveLoopsHIR(hir);
  log({
    kind: 'hir',
    name: 'FlattenReactiveLoopsHIR',
    value: hir,
  });

  flattenScopesWithHooksOrUseHIR(hir);
  log({
    kind: 'hir',
    name: 'FlattenScopesWithHooksOrUseHIR',
    value: hir,
  });
  assertTerminalSuccessorsExist(hir);
  assertTerminalPredsExist(hir);
  propagateScopeDependenciesHIR(hir);
  log({
    kind: 'hir',
    name: 'PropagateScopeDependenciesHIR',
    value: hir,
  });

  if (env.config.inferEffectDependencies) {
    inferEffectDependencies(hir);
  }

  if (env.config.inlineJsxTransform) {
    inlineJsxTransform(hir, env.config.inlineJsxTransform);
    log({
      kind: 'hir',
      name: 'inlineJsxTransform',
      value: hir,
    });
  }

  const reactiveFunction = buildReactiveFunction(hir);
  log({
    kind: 'reactive',
    name: 'BuildReactiveFunction',
    value: reactiveFunction,
  });

  assertWellFormedBreakTargets(reactiveFunction);

  pruneUnusedLabels(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'PruneUnusedLabels',
    value: reactiveFunction,
  });
  assertScopeInstructionsWithinScopes(reactiveFunction);

  pruneNonEscapingScopes(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'PruneNonEscapingScopes',
    value: reactiveFunction,
  });

  pruneNonReactiveDependencies(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'PruneNonReactiveDependencies',
    value: reactiveFunction,
  });

  pruneUnusedScopes(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'PruneUnusedScopes',
    value: reactiveFunction,
  });

  mergeReactiveScopesThatInvalidateTogether(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'MergeReactiveScopesThatInvalidateTogether',
    value: reactiveFunction,
  });

  pruneAlwaysInvalidatingScopes(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'PruneAlwaysInvalidatingScopes',
    value: reactiveFunction,
  });

  if (env.config.enableChangeDetectionForDebugging != null) {
    pruneInitializationDependencies(reactiveFunction);
    log({
      kind: 'reactive',
      name: 'PruneInitializationDependencies',
      value: reactiveFunction,
    });
  }

  propagateEarlyReturns(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'PropagateEarlyReturns',
    value: reactiveFunction,
  });

  pruneUnusedLValues(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'PruneUnusedLValues',
    value: reactiveFunction,
  });

  promoteUsedTemporaries(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'PromoteUsedTemporaries',
    value: reactiveFunction,
  });

  extractScopeDeclarationsFromDestructuring(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'ExtractScopeDeclarationsFromDestructuring',
    value: reactiveFunction,
  });

  stabilizeBlockIds(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'StabilizeBlockIds',
    value: reactiveFunction,
  });

  const uniqueIdentifiers = renameVariables(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'RenameVariables',
    value: reactiveFunction,
  });

  pruneHoistedContexts(reactiveFunction);
  log({
    kind: 'reactive',
    name: 'PruneHoistedContexts',
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

  const ast = codegenFunction(reactiveFunction, {
    uniqueIdentifiers,
    fbtOperands,
  }).unwrap();
  log({kind: 'ast', name: 'Codegen', value: ast});
  for (const outlined of ast.outlined) {
    log({kind: 'ast', name: 'Codegen (outlined)', value: outlined.fn});
  }

  /**
   * This flag should be only set for unit / fixture tests to check
   * that Forget correctly handles unexpected errors (e.g. exceptions
   * thrown by babel functions or other unexpected exceptions).
   */
  if (env.config.throwUnknownException__testonly) {
    throw new Error('unexpected error');
  }

  return ast;
}

export function compileFn(
  func: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  config: EnvironmentConfig,
  fnType: ReactFunctionType,
  useMemoCacheIdentifier: string,
  logger: Logger | null,
  filename: string | null,
  code: string | null,
): CodegenFunction {
  return run(
    func,
    config,
    fnType,
    useMemoCacheIdentifier,
    logger,
    filename,
    code,
  );
}
