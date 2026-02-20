/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/traverse';
import * as t from '@babel/types';
import prettyFormat from 'pretty-format';
import {CompilerOutputMode, Logger, ProgramContext} from '.';
import {CompilerError} from '../CompilerError';
import {Err, Ok, Result} from '../Utils/Result';
import {
  HIRFunction,
  IdentifierId,
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
  inferReactivePlaces,
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
import {lowerContextAccess} from '../Optimization/LowerContextAccess';
import {validateNoSetStateInEffects} from '../Validation/ValidateNoSetStateInEffects';
import {validateNoJSXInTryStatement} from '../Validation/ValidateNoJSXInTryStatement';
import {propagateScopeDependenciesHIR} from '../HIR/PropagateScopeDependenciesHIR';
import {outlineJSX} from '../Optimization/OutlineJsx';
import {optimizePropsMethodCalls} from '../Optimization/OptimizePropsMethodCalls';
import {transformFire} from '../Transform';
import {validateNoImpureFunctionsInRender} from '../Validation/ValidateNoImpureFunctionsInRender';
import {validateStaticComponents} from '../Validation/ValidateStaticComponents';
import {validateNoFreezingKnownMutableFunctions} from '../Validation/ValidateNoFreezingKnownMutableFunctions';
import {inferMutationAliasingEffects} from '../Inference/InferMutationAliasingEffects';
import {inferMutationAliasingRanges} from '../Inference/InferMutationAliasingRanges';
import {validateNoDerivedComputationsInEffects} from '../Validation/ValidateNoDerivedComputationsInEffects';
import {validateNoDerivedComputationsInEffects_exp} from '../Validation/ValidateNoDerivedComputationsInEffects_exp';
import {nameAnonymousFunctions} from '../Transform/NameAnonymousFunctions';
import {optimizeForSSR} from '../Optimization/OptimizeForSSR';
import {validateExhaustiveDependencies} from '../Validation/ValidateExhaustiveDependencies';
import {validateSourceLocations} from '../Validation/ValidateSourceLocations';

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
  mode: CompilerOutputMode,
  programContext: ProgramContext,
  logger: Logger | null,
  filename: string | null,
  code: string | null,
): Result<CodegenFunction, CompilerError> {
  const contextIdentifiers = findContextIdentifiers(func);
  const env = new Environment(
    func.scope,
    fnType,
    mode,
    config,
    contextIdentifiers,
    func,
    logger,
    filename,
    code,
    programContext,
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
): Result<CodegenFunction, CompilerError> {
  const log = (value: CompilerPipelineValue): void => {
    env.logger?.debugLogIRs?.(value);
  };
  const hir = lower(func, env).unwrap();
  log({kind: 'hir', name: 'HIR', value: hir});

  env.tryRecord(() => {
    pruneMaybeThrows(hir);
  });
  log({kind: 'hir', name: 'PruneMaybeThrows', value: hir});

  validateContextVariableLValues(hir);
  validateUseMemo(hir);

  if (
    env.enableDropManualMemoization &&
    !env.config.enablePreserveExistingManualUseMemo &&
    !env.config.disableMemoizationForDebugging &&
    !env.config.enableChangeDetectionForDebugging
  ) {
    dropManualMemoization(hir);
    log({kind: 'hir', name: 'DropManualMemoization', value: hir});
  }

  env.tryRecord(() => {
    inlineImmediatelyInvokedFunctionExpressions(hir);
  });
  log({
    kind: 'hir',
    name: 'InlineImmediatelyInvokedFunctionExpressions',
    value: hir,
  });

  env.tryRecord(() => {
    mergeConsecutiveBlocks(hir);
  });
  log({kind: 'hir', name: 'MergeConsecutiveBlocks', value: hir});

  assertConsistentIdentifiers(hir);
  assertTerminalSuccessorsExist(hir);

  env.tryRecord(() => {
    enterSSA(hir);
  });
  log({kind: 'hir', name: 'SSA', value: hir});

  env.tryRecord(() => {
    eliminateRedundantPhi(hir);
  });
  log({kind: 'hir', name: 'EliminateRedundantPhi', value: hir});

  assertConsistentIdentifiers(hir);

  env.tryRecord(() => {
    constantPropagation(hir);
  });
  log({kind: 'hir', name: 'ConstantPropagation', value: hir});

  env.tryRecord(() => {
    inferTypes(hir);
  });
  log({kind: 'hir', name: 'InferTypes', value: hir});

  if (env.enableValidations) {
    if (env.config.validateHooksUsage) {
      validateHooksUsage(hir);
    }
    if (env.config.validateNoCapitalizedCalls) {
      validateNoCapitalizedCalls(hir);
    }
  }

  if (env.config.enableFire) {
    env.tryRecord(() => {
      transformFire(hir);
    });
    log({kind: 'hir', name: 'TransformFire', value: hir});
  }

  if (env.config.lowerContextAccess) {
    env.tryRecord(() => {
      lowerContextAccess(hir, env.config.lowerContextAccess!);
    });
  }

  env.tryRecord(() => {
    optimizePropsMethodCalls(hir);
  });
  log({kind: 'hir', name: 'OptimizePropsMethodCalls', value: hir});

  env.tryRecord(() => {
    analyseFunctions(hir);
  });
  log({kind: 'hir', name: 'AnalyseFunctions', value: hir});

  inferMutationAliasingEffects(hir);
  log({kind: 'hir', name: 'InferMutationAliasingEffects', value: hir});

  if (env.outputMode === 'ssr') {
    env.tryRecord(() => {
      optimizeForSSR(hir);
    });
    log({kind: 'hir', name: 'OptimizeForSSR', value: hir});
  }

  // Note: Has to come after infer reference effects because "dead" code may still affect inference
  env.tryRecord(() => {
    deadCodeElimination(hir);
  });
  log({kind: 'hir', name: 'DeadCodeElimination', value: hir});

  if (env.config.enableInstructionReordering) {
    env.tryRecord(() => {
      instructionReordering(hir);
    });
    log({kind: 'hir', name: 'InstructionReordering', value: hir});
  }

  env.tryRecord(() => {
    pruneMaybeThrows(hir);
  });
  log({kind: 'hir', name: 'PruneMaybeThrows', value: hir});

  inferMutationAliasingRanges(hir, {
    isFunctionExpression: false,
  });
  log({kind: 'hir', name: 'InferMutationAliasingRanges', value: hir});
  if (env.enableValidations) {
    validateLocalsNotReassignedAfterRender(hir);
  }

  if (env.enableValidations) {
    if (env.config.assertValidMutableRanges) {
      assertValidMutableRanges(hir);
    }

    if (env.config.validateRefAccessDuringRender) {
      validateNoRefAccessInRender(hir);
    }

    if (env.config.validateNoSetStateInRender) {
      validateNoSetStateInRender(hir);
    }

    if (
      env.config.validateNoDerivedComputationsInEffects_exp &&
      env.outputMode === 'lint'
    ) {
      env.logErrors(validateNoDerivedComputationsInEffects_exp(hir));
    } else if (env.config.validateNoDerivedComputationsInEffects) {
      validateNoDerivedComputationsInEffects(hir);
    }

    if (env.config.validateNoSetStateInEffects && env.outputMode === 'lint') {
      env.logErrors(validateNoSetStateInEffects(hir, env));
    }

    if (env.config.validateNoJSXInTryStatements && env.outputMode === 'lint') {
      env.logErrors(validateNoJSXInTryStatement(hir));
    }

    if (env.config.validateNoImpureFunctionsInRender) {
      validateNoImpureFunctionsInRender(hir);
    }

    validateNoFreezingKnownMutableFunctions(hir);
  }

  env.tryRecord(() => {
    inferReactivePlaces(hir);
  });
  log({kind: 'hir', name: 'InferReactivePlaces', value: hir});

  if (env.enableValidations) {
    if (
      env.config.validateExhaustiveMemoizationDependencies ||
      env.config.validateExhaustiveEffectDependencies
    ) {
      // NOTE: this relies on reactivity inference running first
      validateExhaustiveDependencies(hir);
    }
  }

  env.tryRecord(() => {
    rewriteInstructionKindsBasedOnReassignment(hir);
  });
  log({
    kind: 'hir',
    name: 'RewriteInstructionKindsBasedOnReassignment',
    value: hir,
  });

  if (
    env.enableValidations &&
    env.config.validateStaticComponents &&
    env.outputMode === 'lint'
  ) {
    env.logErrors(validateStaticComponents(hir));
  }

  if (env.enableMemoization) {
    /**
     * Only create reactive scopes (which directly map to generated memo blocks)
     * if inferred memoization is enabled. This makes all later passes which
     * transform reactive-scope labeled instructions no-ops.
     */
    env.tryRecord(() => {
      inferReactiveScopeVariables(hir);
    });
    log({kind: 'hir', name: 'InferReactiveScopeVariables', value: hir});
  }

  let fbtOperands: Set<IdentifierId> = new Set();
  env.tryRecord(() => {
    fbtOperands = memoizeFbtAndMacroOperandsInSameScope(hir);
  });
  log({
    kind: 'hir',
    name: 'MemoizeFbtAndMacroOperandsInSameScope',
    value: hir,
  });

  if (env.config.enableJsxOutlining) {
    env.tryRecord(() => {
      outlineJSX(hir);
    });
  }

  if (env.config.enableNameAnonymousFunctions) {
    env.tryRecord(() => {
      nameAnonymousFunctions(hir);
    });
    log({
      kind: 'hir',
      name: 'NameAnonymousFunctions',
      value: hir,
    });
  }

  if (env.config.enableFunctionOutlining) {
    env.tryRecord(() => {
      outlineFunctions(hir, fbtOperands);
    });
    log({kind: 'hir', name: 'OutlineFunctions', value: hir});
  }

  env.tryRecord(() => {
    alignMethodCallScopes(hir);
  });
  log({
    kind: 'hir',
    name: 'AlignMethodCallScopes',
    value: hir,
  });

  env.tryRecord(() => {
    alignObjectMethodScopes(hir);
  });
  log({
    kind: 'hir',
    name: 'AlignObjectMethodScopes',
    value: hir,
  });

  env.tryRecord(() => {
    pruneUnusedLabelsHIR(hir);
  });
  log({
    kind: 'hir',
    name: 'PruneUnusedLabelsHIR',
    value: hir,
  });

  env.tryRecord(() => {
    alignReactiveScopesToBlockScopesHIR(hir);
  });
  log({
    kind: 'hir',
    name: 'AlignReactiveScopesToBlockScopesHIR',
    value: hir,
  });

  env.tryRecord(() => {
    mergeOverlappingReactiveScopesHIR(hir);
  });
  log({
    kind: 'hir',
    name: 'MergeOverlappingReactiveScopesHIR',
    value: hir,
  });
  assertValidBlockNesting(hir);

  env.tryRecord(() => {
    buildReactiveScopeTerminalsHIR(hir);
  });
  log({
    kind: 'hir',
    name: 'BuildReactiveScopeTerminalsHIR',
    value: hir,
  });

  assertValidBlockNesting(hir);

  env.tryRecord(() => {
    flattenReactiveLoopsHIR(hir);
  });
  log({
    kind: 'hir',
    name: 'FlattenReactiveLoopsHIR',
    value: hir,
  });

  env.tryRecord(() => {
    flattenScopesWithHooksOrUseHIR(hir);
  });
  log({
    kind: 'hir',
    name: 'FlattenScopesWithHooksOrUseHIR',
    value: hir,
  });
  assertTerminalSuccessorsExist(hir);
  assertTerminalPredsExist(hir);
  env.tryRecord(() => {
    propagateScopeDependenciesHIR(hir);
  });
  log({
    kind: 'hir',
    name: 'PropagateScopeDependenciesHIR',
    value: hir,
  });

  if (env.config.inferEffectDependencies) {
    env.tryRecord(() => {
      inferEffectDependencies(hir);
    });
    log({
      kind: 'hir',
      name: 'InferEffectDependencies',
      value: hir,
    });
  }

  if (env.config.inlineJsxTransform) {
    env.tryRecord(() => {
      inlineJsxTransform(hir, env.config.inlineJsxTransform!);
    });
    log({
      kind: 'hir',
      name: 'inlineJsxTransform',
      value: hir,
    });
  }

  let reactiveFunction!: ReactiveFunction;
  env.tryRecord(() => {
    reactiveFunction = buildReactiveFunction(hir);
  });
  log({
    kind: 'reactive',
    name: 'BuildReactiveFunction',
    value: reactiveFunction,
  });

  assertWellFormedBreakTargets(reactiveFunction);

  env.tryRecord(() => {
    pruneUnusedLabels(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'PruneUnusedLabels',
    value: reactiveFunction,
  });
  assertScopeInstructionsWithinScopes(reactiveFunction);

  env.tryRecord(() => {
    pruneNonEscapingScopes(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'PruneNonEscapingScopes',
    value: reactiveFunction,
  });

  env.tryRecord(() => {
    pruneNonReactiveDependencies(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'PruneNonReactiveDependencies',
    value: reactiveFunction,
  });

  env.tryRecord(() => {
    pruneUnusedScopes(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'PruneUnusedScopes',
    value: reactiveFunction,
  });

  env.tryRecord(() => {
    mergeReactiveScopesThatInvalidateTogether(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'MergeReactiveScopesThatInvalidateTogether',
    value: reactiveFunction,
  });

  env.tryRecord(() => {
    pruneAlwaysInvalidatingScopes(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'PruneAlwaysInvalidatingScopes',
    value: reactiveFunction,
  });

  if (env.config.enableChangeDetectionForDebugging != null) {
    env.tryRecord(() => {
      pruneInitializationDependencies(reactiveFunction);
    });
    log({
      kind: 'reactive',
      name: 'PruneInitializationDependencies',
      value: reactiveFunction,
    });
  }

  env.tryRecord(() => {
    propagateEarlyReturns(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'PropagateEarlyReturns',
    value: reactiveFunction,
  });

  env.tryRecord(() => {
    pruneUnusedLValues(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'PruneUnusedLValues',
    value: reactiveFunction,
  });

  env.tryRecord(() => {
    promoteUsedTemporaries(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'PromoteUsedTemporaries',
    value: reactiveFunction,
  });

  env.tryRecord(() => {
    extractScopeDeclarationsFromDestructuring(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'ExtractScopeDeclarationsFromDestructuring',
    value: reactiveFunction,
  });

  env.tryRecord(() => {
    stabilizeBlockIds(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'StabilizeBlockIds',
    value: reactiveFunction,
  });

  let uniqueIdentifiers: Set<string> = new Set();
  env.tryRecord(() => {
    uniqueIdentifiers = renameVariables(reactiveFunction);
  });
  log({
    kind: 'reactive',
    name: 'RenameVariables',
    value: reactiveFunction,
  });

  env.tryRecord(() => {
    pruneHoistedContexts(reactiveFunction);
  });
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
  });
  log({kind: 'ast', name: 'Codegen', value: ast});
  for (const outlined of ast.outlined) {
    log({kind: 'ast', name: 'Codegen (outlined)', value: outlined.fn});
  }

  if (env.config.validateSourceLocations) {
    validateSourceLocations(func, ast, env);
  }

  /**
   * This flag should be only set for unit / fixture tests to check
   * that Forget correctly handles unexpected errors (e.g. exceptions
   * thrown by babel functions or other unexpected exceptions).
   */
  if (env.config.throwUnknownException__testonly) {
    throw new Error('unexpected error');
  }

  if (env.hasErrors()) {
    return Err(env.aggregateErrors());
  }
  return Ok(ast);
}

export function compileFn(
  func: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  config: EnvironmentConfig,
  fnType: ReactFunctionType,
  mode: CompilerOutputMode,
  programContext: ProgramContext,
  logger: Logger | null,
  filename: string | null,
  code: string | null,
): Result<CodegenFunction, CompilerError> {
  return run(
    func,
    config,
    fnType,
    mode,
    programContext,
    logger,
    filename,
    code,
  );
}
