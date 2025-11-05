/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {NodePath} from '@babel/traverse';
import * as t from '@babel/types';
import prettyFormat from 'pretty-format';
import {Logger, ProgramContext} from '.';
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
  CompilerMode,
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
  mode: CompilerMode,
  programContext: ProgramContext,
  logger: Logger | null,
  filename: string | null,
  code: string | null,
): CodegenFunction {
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
): CodegenFunction {
  const log = (value: CompilerPipelineValue): void => {
    env.logger?.debugLogIRs?.(value);
  };
  const hir = lower(func, env).unwrap();
  log({kind: 'hir', name: 'HIR', value: hir});

  pruneMaybeThrows(hir);
  log({kind: 'hir', name: 'PruneMaybeThrows', value: hir});

  validateContextVariableLValues(hir);
  validateUseMemo(hir).unwrap();

  if (
    env.isInferredMemoEnabled &&
    !env.config.enablePreserveExistingManualUseMemo &&
    !env.config.disableMemoizationForDebugging &&
    !env.config.enableChangeDetectionForDebugging
  ) {
    dropManualMemoization(hir).unwrap();
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

  if (env.isInferredMemoEnabled) {
    if (env.config.validateHooksUsage) {
      validateHooksUsage(hir).unwrap();
    }
    if (env.config.validateNoCapitalizedCalls) {
      validateNoCapitalizedCalls(hir).unwrap();
    }
  }

  if (env.config.enableFire) {
    transformFire(hir);
    log({kind: 'hir', name: 'TransformFire', value: hir});
  }

  if (env.config.lowerContextAccess) {
    lowerContextAccess(hir, env.config.lowerContextAccess);
  }

  optimizePropsMethodCalls(hir);
  log({kind: 'hir', name: 'OptimizePropsMethodCalls', value: hir});

  analyseFunctions(hir);
  log({kind: 'hir', name: 'AnalyseFunctions', value: hir});

  const mutabilityAliasingErrors = inferMutationAliasingEffects(hir);
  log({kind: 'hir', name: 'InferMutationAliasingEffects', value: hir});
  if (env.isInferredMemoEnabled) {
    if (mutabilityAliasingErrors.isErr()) {
      throw mutabilityAliasingErrors.unwrapErr();
    }
  }

  // Note: Has to come after infer reference effects because "dead" code may still affect inference
  deadCodeElimination(hir);
  log({kind: 'hir', name: 'DeadCodeElimination', value: hir});

  if (env.config.enableInstructionReordering) {
    instructionReordering(hir);
    log({kind: 'hir', name: 'InstructionReordering', value: hir});
  }

  pruneMaybeThrows(hir);
  log({kind: 'hir', name: 'PruneMaybeThrows', value: hir});

  const mutabilityAliasingRangeErrors = inferMutationAliasingRanges(hir, {
    isFunctionExpression: false,
  });
  log({kind: 'hir', name: 'InferMutationAliasingRanges', value: hir});
  if (env.isInferredMemoEnabled) {
    if (mutabilityAliasingRangeErrors.isErr()) {
      throw mutabilityAliasingRangeErrors.unwrapErr();
    }
    validateLocalsNotReassignedAfterRender(hir);
  }

  if (env.isInferredMemoEnabled) {
    if (env.config.assertValidMutableRanges) {
      assertValidMutableRanges(hir);
    }

    if (env.config.validateRefAccessDuringRender) {
      validateNoRefAccessInRender(hir).unwrap();
    }

    if (env.config.validateNoSetStateInRender) {
      validateNoSetStateInRender(hir).unwrap();
    }

    if (env.config.validateNoDerivedComputationsInEffects) {
      validateNoDerivedComputationsInEffects(hir);
    }

    if (env.config.validateNoDerivedComputationsInEffects_exp) {
      validateNoDerivedComputationsInEffects_exp(hir);
    }

    if (env.config.validateNoSetStateInEffects) {
      env.logErrors(validateNoSetStateInEffects(hir, env));
    }

    if (env.config.validateNoJSXInTryStatements) {
      env.logErrors(validateNoJSXInTryStatement(hir));
    }

    if (env.config.validateNoImpureFunctionsInRender) {
      validateNoImpureFunctionsInRender(hir).unwrap();
    }

    validateNoFreezingKnownMutableFunctions(hir).unwrap();
  }

  inferReactivePlaces(hir);
  log({kind: 'hir', name: 'InferReactivePlaces', value: hir});

  rewriteInstructionKindsBasedOnReassignment(hir);
  log({
    kind: 'hir',
    name: 'RewriteInstructionKindsBasedOnReassignment',
    value: hir,
  });

  if (env.isInferredMemoEnabled) {
    if (env.config.validateStaticComponents) {
      env.logErrors(validateStaticComponents(hir));
    }

    /**
     * Only create reactive scopes (which directly map to generated memo blocks)
     * if inferred memoization is enabled. This makes all later passes which
     * transform reactive-scope labeled instructions no-ops.
     */
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

  if (env.config.enableNameAnonymousFunctions) {
    nameAnonymousFunctions(hir);
    log({
      kind: 'hir',
      name: 'NameAnonymousFunctions',
      value: hir,
    });
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
    log({
      kind: 'hir',
      name: 'InferEffectDependencies',
      value: hir,
    });
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
    validateMemoizedEffectDependencies(reactiveFunction).unwrap();
  }

  if (
    env.config.enablePreserveExistingMemoizationGuarantees ||
    env.config.validatePreserveExistingMemoizationGuarantees
  ) {
    validatePreservedManualMemoization(reactiveFunction).unwrap();
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
  mode: CompilerMode,
  programContext: ProgramContext,
  logger: Logger | null,
  filename: string | null,
  code: string | null,
): CodegenFunction {
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
