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
} from '../Inference';
import {
  constantPropagation,
  deadCodeElimination,
  pruneMaybeThrows,
} from '../Optimization';
import {instructionReordering} from '../Optimization/InstructionReordering';
import {
  CodegenFunction,
  alignObjectMethodScopes,
  alignReactiveScopesToBlockScopes,
  assertScopeInstructionsWithinScopes,
  assertWellFormedBreakTargets,
  buildReactiveBlocks,
  buildReactiveFunction,
  codegenFunction,
  extractScopeDeclarationsFromDestructuring,
  flattenReactiveLoops,
  flattenScopesWithHooksOrUse,
  inferReactiveScopeVariables,
  memoizeFbtAndMacroOperandsInSameScope,
  mergeOverlappingReactiveScopes,
  mergeReactiveScopesThatInvalidateTogether,
  promoteUsedTemporaries,
  propagateEarlyReturns,
  propagateScopeDependencies,
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
  logCodegenFunction,
  logDebug,
  logHIRFunction,
  logReactiveFunction,
} from '../Utils/logger';
import {assertExhaustive} from '../Utils/utils';
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

export type CompilerPipelineValue =
  | {kind: 'ast'; name: string; value: CodegenFunction}
  | {kind: 'hir'; name: string; value: HIRFunction}
  | {kind: 'reactive'; name: string; value: ReactiveFunction}
  | {kind: 'debug'; name: string; value: string};

export function* run(
  func: NodePath<
    t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression
  >,
  config: EnvironmentConfig,
  fnType: ReactFunctionType,
  useMemoCacheIdentifier: string,
  logger: Logger | null,
  filename: string | null,
  code: string | null,
): Generator<CompilerPipelineValue, CodegenFunction> {
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
  yield log({
    kind: 'debug',
    name: 'EnvironmentConfig',
    value: prettyFormat(env.config),
  });
  const ast = yield* runWithEnvironment(func, env);
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
): Generator<CompilerPipelineValue, CodegenFunction> {
  const hir = lower(func, env).unwrap();
  yield log({kind: 'hir', name: 'HIR', value: hir});

  pruneMaybeThrows(hir);
  yield log({kind: 'hir', name: 'PruneMaybeThrows', value: hir});

  validateContextVariableLValues(hir);
  validateUseMemo(hir);

  if (
    !env.config.enablePreserveExistingManualUseMemo &&
    !env.config.disableMemoizationForDebugging &&
    !env.config.enableChangeDetectionForDebugging
  ) {
    dropManualMemoization(hir);
    yield log({kind: 'hir', name: 'DropManualMemoization', value: hir});
  }

  inlineImmediatelyInvokedFunctionExpressions(hir);
  yield log({
    kind: 'hir',
    name: 'InlineImmediatelyInvokedFunctionExpressions',
    value: hir,
  });

  mergeConsecutiveBlocks(hir);
  yield log({kind: 'hir', name: 'MergeConsecutiveBlocks', value: hir});

  assertConsistentIdentifiers(hir);
  assertTerminalSuccessorsExist(hir);

  enterSSA(hir);
  yield log({kind: 'hir', name: 'SSA', value: hir});

  eliminateRedundantPhi(hir);
  yield log({kind: 'hir', name: 'EliminateRedundantPhi', value: hir});

  assertConsistentIdentifiers(hir);

  constantPropagation(hir);
  yield log({kind: 'hir', name: 'ConstantPropagation', value: hir});

  inferTypes(hir);
  yield log({kind: 'hir', name: 'InferTypes', value: hir});

  if (env.config.validateHooksUsage) {
    validateHooksUsage(hir);
  }

  if (env.config.validateNoCapitalizedCalls) {
    validateNoCapitalizedCalls(hir);
  }

  if (env.config.lowerContextAccess) {
    lowerContextAccess(hir, env.config.lowerContextAccess);
  }

  analyseFunctions(hir);
  yield log({kind: 'hir', name: 'AnalyseFunctions', value: hir});

  inferReferenceEffects(hir);
  yield log({kind: 'hir', name: 'InferReferenceEffects', value: hir});

  validateLocalsNotReassignedAfterRender(hir);

  // Note: Has to come after infer reference effects because "dead" code may still affect inference
  deadCodeElimination(hir);
  yield log({kind: 'hir', name: 'DeadCodeElimination', value: hir});

  if (env.config.enableInstructionReordering) {
    instructionReordering(hir);
    yield log({kind: 'hir', name: 'InstructionReordering', value: hir});
  }

  pruneMaybeThrows(hir);
  yield log({kind: 'hir', name: 'PruneMaybeThrows', value: hir});

  inferMutableRanges(hir);
  yield log({kind: 'hir', name: 'InferMutableRanges', value: hir});

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

  inferReactivePlaces(hir);
  yield log({kind: 'hir', name: 'InferReactivePlaces', value: hir});

  rewriteInstructionKindsBasedOnReassignment(hir);
  yield log({
    kind: 'hir',
    name: 'RewriteInstructionKindsBasedOnReassignment',
    value: hir,
  });

  propagatePhiTypes(hir);
  yield log({
    kind: 'hir',
    name: 'PropagatePhiTypes',
    value: hir,
  });

  inferReactiveScopeVariables(hir);
  yield log({kind: 'hir', name: 'InferReactiveScopeVariables', value: hir});

  const fbtOperands = memoizeFbtAndMacroOperandsInSameScope(hir);
  yield log({
    kind: 'hir',
    name: 'MemoizeFbtAndMacroOperandsInSameScope',
    value: hir,
  });

  if (env.config.enableFunctionOutlining) {
    outlineFunctions(hir, fbtOperands);
    yield log({kind: 'hir', name: 'OutlineFunctions', value: hir});
  }

  alignMethodCallScopes(hir);
  yield log({
    kind: 'hir',
    name: 'AlignMethodCallScopes',
    value: hir,
  });

  alignObjectMethodScopes(hir);
  yield log({
    kind: 'hir',
    name: 'AlignObjectMethodScopes',
    value: hir,
  });

  if (env.config.enableReactiveScopesInHIR) {
    pruneUnusedLabelsHIR(hir);
    yield log({
      kind: 'hir',
      name: 'PruneUnusedLabelsHIR',
      value: hir,
    });

    alignReactiveScopesToBlockScopesHIR(hir);
    yield log({
      kind: 'hir',
      name: 'AlignReactiveScopesToBlockScopesHIR',
      value: hir,
    });

    mergeOverlappingReactiveScopesHIR(hir);
    yield log({
      kind: 'hir',
      name: 'MergeOverlappingReactiveScopesHIR',
      value: hir,
    });
    assertValidBlockNesting(hir);

    buildReactiveScopeTerminalsHIR(hir);
    yield log({
      kind: 'hir',
      name: 'BuildReactiveScopeTerminalsHIR',
      value: hir,
    });

    assertValidBlockNesting(hir);

    flattenReactiveLoopsHIR(hir);
    yield log({
      kind: 'hir',
      name: 'FlattenReactiveLoopsHIR',
      value: hir,
    });

    flattenScopesWithHooksOrUseHIR(hir);
    yield log({
      kind: 'hir',
      name: 'FlattenScopesWithHooksOrUseHIR',
      value: hir,
    });
    assertTerminalSuccessorsExist(hir);
    assertTerminalPredsExist(hir);
  }

  const reactiveFunction = buildReactiveFunction(hir);
  yield log({
    kind: 'reactive',
    name: 'BuildReactiveFunction',
    value: reactiveFunction,
  });

  assertWellFormedBreakTargets(reactiveFunction);

  pruneUnusedLabels(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'PruneUnusedLabels',
    value: reactiveFunction,
  });

  if (!env.config.enableReactiveScopesInHIR) {
    alignReactiveScopesToBlockScopes(reactiveFunction);
    yield log({
      kind: 'reactive',
      name: 'AlignReactiveScopesToBlockScopes',
      value: reactiveFunction,
    });

    mergeOverlappingReactiveScopes(reactiveFunction);
    yield log({
      kind: 'reactive',
      name: 'MergeOverlappingReactiveScopes',
      value: reactiveFunction,
    });

    buildReactiveBlocks(reactiveFunction);
    yield log({
      kind: 'reactive',
      name: 'BuildReactiveBlocks',
      value: reactiveFunction,
    });

    flattenReactiveLoops(reactiveFunction);
    yield log({
      kind: 'reactive',
      name: 'FlattenReactiveLoops',
      value: reactiveFunction,
    });

    flattenScopesWithHooksOrUse(reactiveFunction);
    yield log({
      kind: 'reactive',
      name: 'FlattenScopesWithHooks',
      value: reactiveFunction,
    });
  }

  assertScopeInstructionsWithinScopes(reactiveFunction);

  propagateScopeDependencies(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'PropagateScopeDependencies',
    value: reactiveFunction,
  });

  pruneNonEscapingScopes(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'PruneNonEscapingScopes',
    value: reactiveFunction,
  });

  pruneNonReactiveDependencies(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'PruneNonReactiveDependencies',
    value: reactiveFunction,
  });

  pruneUnusedScopes(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'PruneUnusedScopes',
    value: reactiveFunction,
  });

  mergeReactiveScopesThatInvalidateTogether(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'MergeReactiveScopesThatInvalidateTogether',
    value: reactiveFunction,
  });

  pruneAlwaysInvalidatingScopes(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'PruneAlwaysInvalidatingScopes',
    value: reactiveFunction,
  });

  if (env.config.enableChangeDetectionForDebugging != null) {
    pruneInitializationDependencies(reactiveFunction);
    yield log({
      kind: 'reactive',
      name: 'PruneInitializationDependencies',
      value: reactiveFunction,
    });
  }

  propagateEarlyReturns(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'PropagateEarlyReturns',
    value: reactiveFunction,
  });

  pruneUnusedLValues(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'PruneUnusedLValues',
    value: reactiveFunction,
  });

  promoteUsedTemporaries(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'PromoteUsedTemporaries',
    value: reactiveFunction,
  });

  extractScopeDeclarationsFromDestructuring(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'ExtractScopeDeclarationsFromDestructuring',
    value: reactiveFunction,
  });

  stabilizeBlockIds(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'StabilizeBlockIds',
    value: reactiveFunction,
  });

  const uniqueIdentifiers = renameVariables(reactiveFunction);
  yield log({
    kind: 'reactive',
    name: 'RenameVariables',
    value: reactiveFunction,
  });

  pruneHoistedContexts(reactiveFunction);
  yield log({
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
  yield log({kind: 'ast', name: 'Codegen', value: ast});
  for (const outlined of ast.outlined) {
    yield log({kind: 'ast', name: 'Codegen (outlined)', value: outlined.fn});
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
  let generator = run(
    func,
    config,
    fnType,
    useMemoCacheIdentifier,
    logger,
    filename,
    code,
  );
  while (true) {
    const next = generator.next();
    if (next.done) {
      return next.value;
    }
  }
}

export function log(value: CompilerPipelineValue): CompilerPipelineValue {
  switch (value.kind) {
    case 'ast': {
      logCodegenFunction(value.name, value.value);
      break;
    }
    case 'hir': {
      logHIRFunction(value.name, value.value);
      break;
    }
    case 'reactive': {
      logReactiveFunction(value.name, value.value);
      break;
    }
    case 'debug': {
      logDebug(value.name, value.value);
      break;
    }
    default: {
      assertExhaustive(value, 'Unexpected compilation kind');
    }
  }
  return value;
}
