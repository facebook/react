/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from '@babel/types';
import {CompilerError, SourceLocation} from '..';
import {
  ArrayExpression,
  Effect,
  Environment,
  FunctionExpression,
  GeneratedSource,
  HIRFunction,
  IdentifierId,
  Instruction,
  makeInstructionId,
  TInstruction,
  InstructionId,
  ScopeId,
  ReactiveScopeDependency,
  Place,
  ReactiveScope,
  ReactiveScopeDependencies,
  Terminal,
  isUseRefType,
  isSetStateType,
  isFireFunctionType,
  makeScopeId,
} from '../HIR';
import {collectHoistablePropertyLoadsInInnerFn} from '../HIR/CollectHoistablePropertyLoads';
import {collectOptionalChainSidemap} from '../HIR/CollectOptionalChainDependencies';
import {ReactiveScopeDependencyTreeHIR} from '../HIR/DeriveMinimalDependenciesHIR';
import {DEFAULT_EXPORT} from '../HIR/Environment';
import {
  createTemporaryPlace,
  fixScopeAndIdentifierRanges,
  markInstructionIds,
} from '../HIR/HIRBuilder';
import {
  collectTemporariesSidemap,
  DependencyCollectionContext,
  handleInstruction,
} from '../HIR/PropagateScopeDependenciesHIR';
import {eachInstructionOperand, eachTerminalOperand} from '../HIR/visitors';
import {empty} from '../Utils/Stack';
import {getOrInsertWith} from '../Utils/utils';

/**
 * Infers reactive dependencies captured by useEffect lambdas and adds them as
 * a second argument to the useEffect call if no dependency array is provided.
 */
export function inferEffectDependencies(fn: HIRFunction): void {
  let hasRewrite = false;
  const fnExpressions = new Map<
    IdentifierId,
    TInstruction<FunctionExpression>
  >();

  const autodepFnConfigs = new Map<string, Map<string, number>>();
  for (const effectTarget of fn.env.config.inferEffectDependencies!) {
    const moduleTargets = getOrInsertWith(
      autodepFnConfigs,
      effectTarget.function.source,
      () => new Map<string, number>(),
    );
    moduleTargets.set(
      effectTarget.function.importSpecifierName,
      effectTarget.numRequiredArgs,
    );
  }
  const autodepFnLoads = new Map<IdentifierId, number>();
  const autodepModuleLoads = new Map<IdentifierId, Map<string, number>>();

  const scopeInfos = new Map<ScopeId, ReactiveScopeDependencies>();

  const loadGlobals = new Set<IdentifierId>();

  /**
   * When inserting LoadLocals, we need to retain the reactivity of the base
   * identifier, as later passes e.g. PruneNonReactiveDeps take the reactivity of
   * a base identifier as the "maximal" reactivity of all its references.
   * Concretely,
   * reactive(Identifier i) = Union_{reference of i}(reactive(reference))
   */
  const reactiveIds = inferReactiveIdentifiers(fn);

  for (const [, block] of fn.body.blocks) {
    if (block.terminal.kind === 'scope') {
      const scopeBlock = fn.body.blocks.get(block.terminal.block)!;
      if (
        scopeBlock.instructions.length === 1 &&
        scopeBlock.terminal.kind === 'goto' &&
        scopeBlock.terminal.block === block.terminal.fallthrough
      ) {
        scopeInfos.set(
          block.terminal.scope.id,
          block.terminal.scope.dependencies,
        );
      }
    }
    const rewriteInstrs = new Map<InstructionId, Array<Instruction>>();
    for (const instr of block.instructions) {
      const {value, lvalue} = instr;
      if (value.kind === 'FunctionExpression') {
        fnExpressions.set(
          lvalue.identifier.id,
          instr as TInstruction<FunctionExpression>,
        );
      } else if (value.kind === 'PropertyLoad') {
        if (
          typeof value.property === 'string' &&
          autodepModuleLoads.has(value.object.identifier.id)
        ) {
          const moduleTargets = autodepModuleLoads.get(
            value.object.identifier.id,
          )!;
          const propertyName = value.property;
          const numRequiredArgs = moduleTargets.get(propertyName);
          if (numRequiredArgs != null) {
            autodepFnLoads.set(lvalue.identifier.id, numRequiredArgs);
          }
        }
      } else if (value.kind === 'LoadGlobal') {
        loadGlobals.add(lvalue.identifier.id);

        /*
         * TODO: Handle properties on default exports, like
         * import React from 'react';
         * React.useEffect(...);
         */
        if (value.binding.kind === 'ImportNamespace') {
          const moduleTargets = autodepFnConfigs.get(value.binding.module);
          if (moduleTargets != null) {
            autodepModuleLoads.set(lvalue.identifier.id, moduleTargets);
          }
        }
        if (
          value.binding.kind === 'ImportSpecifier' ||
          value.binding.kind === 'ImportDefault'
        ) {
          const moduleTargets = autodepFnConfigs.get(value.binding.module);
          if (moduleTargets != null) {
            const importSpecifierName =
              value.binding.kind === 'ImportSpecifier'
                ? value.binding.imported
                : DEFAULT_EXPORT;
            const numRequiredArgs = moduleTargets.get(importSpecifierName);
            if (numRequiredArgs != null) {
              autodepFnLoads.set(lvalue.identifier.id, numRequiredArgs);
            }
          }
        }
      } else if (
        value.kind === 'CallExpression' ||
        value.kind === 'MethodCall'
      ) {
        const callee =
          value.kind === 'CallExpression' ? value.callee : value.property;
        if (
          value.args.length === autodepFnLoads.get(callee.identifier.id) &&
          value.args[0].kind === 'Identifier'
        ) {
          // We have a useEffect call with no deps array, so we need to infer the deps
          const effectDeps: Array<Place> = [];
          const newInstructions: Array<Instruction> = [];
          const deps: ArrayExpression = {
            kind: 'ArrayExpression',
            elements: effectDeps,
            loc: GeneratedSource,
          };
          const depsPlace = createTemporaryPlace(fn.env, GeneratedSource);
          depsPlace.effect = Effect.Read;

          const fnExpr = fnExpressions.get(value.args[0].identifier.id);
          if (fnExpr != null) {
            // We have a function expression, so we can infer its dependencies
            const scopeInfo =
              fnExpr.lvalue.identifier.scope != null
                ? scopeInfos.get(fnExpr.lvalue.identifier.scope.id)
                : null;
            let minimalDeps: Set<ReactiveScopeDependency>;
            if (scopeInfo != null) {
              minimalDeps = new Set(scopeInfo);
            } else {
              minimalDeps = inferMinimalDependencies(fnExpr);
            }
            /**
             * Step 1: push dependencies to the effect deps array
             *
             * Note that it's invalid to prune all non-reactive deps in this pass, see
             * the `infer-effect-deps/pruned-nonreactive-obj` fixture for an
             * explanation.
             */

            const usedDeps = [];
            for (const dep of minimalDeps) {
              if (
                ((isUseRefType(dep.identifier) ||
                  isSetStateType(dep.identifier)) &&
                  !reactiveIds.has(dep.identifier.id)) ||
                isFireFunctionType(dep.identifier)
              ) {
                // exclude non-reactive hook results, which will never be in a memo block
                continue;
              }

              const {place, instructions} = writeDependencyToInstructions(
                dep,
                reactiveIds.has(dep.identifier.id),
                fn.env,
                fnExpr.loc,
              );
              newInstructions.push(...instructions);
              effectDeps.push(place);
              usedDeps.push(dep);
            }

            // For LSP autodeps feature.
            const decorations: Array<t.SourceLocation> = [];
            for (const loc of collectDepUsages(usedDeps, fnExpr.value)) {
              if (typeof loc === 'symbol') {
                continue;
              }
              decorations.push(loc);
            }
            if (typeof value.loc !== 'symbol') {
              fn.env.logger?.logEvent(fn.env.filename, {
                kind: 'AutoDepsDecorations',
                fnLoc: value.loc,
                decorations,
              });
            }

            newInstructions.push({
              id: makeInstructionId(0),
              loc: GeneratedSource,
              lvalue: {...depsPlace, effect: Effect.Mutate},
              value: deps,
            });

            // Step 2: push the inferred deps array as an argument of the useEffect
            value.args.push({...depsPlace, effect: Effect.Freeze});
            rewriteInstrs.set(instr.id, newInstructions);
            fn.env.inferredEffectLocations.add(callee.loc);
          } else if (loadGlobals.has(value.args[0].identifier.id)) {
            // Global functions have no reactive dependencies, so we can insert an empty array
            newInstructions.push({
              id: makeInstructionId(0),
              loc: GeneratedSource,
              lvalue: {...depsPlace, effect: Effect.Mutate},
              value: deps,
            });
            value.args.push({...depsPlace, effect: Effect.Freeze});
            rewriteInstrs.set(instr.id, newInstructions);
            fn.env.inferredEffectLocations.add(callee.loc);
          }
        } else if (
          value.args.length >= 2 &&
          value.args.length - 1 === autodepFnLoads.get(callee.identifier.id) &&
          value.args[0] != null &&
          value.args[0].kind === 'Identifier'
        ) {
          const penultimateArg = value.args[value.args.length - 2];
          const depArrayArg = value.args[value.args.length - 1];
          if (
            depArrayArg.kind !== 'Spread' &&
            penultimateArg.kind !== 'Spread' &&
            typeof depArrayArg.loc !== 'symbol' &&
            typeof penultimateArg.loc !== 'symbol' &&
            typeof value.loc !== 'symbol'
          ) {
            fn.env.logger?.logEvent(fn.env.filename, {
              kind: 'AutoDepsEligible',
              fnLoc: value.loc,
              depArrayLoc: {
                ...depArrayArg.loc,
                start: penultimateArg.loc.end,
                end: depArrayArg.loc.end,
              },
            });
          }
        }
      }
    }
    if (rewriteInstrs.size > 0) {
      hasRewrite = true;
      const newInstrs = [];
      for (const instr of block.instructions) {
        const newInstr = rewriteInstrs.get(instr.id);
        if (newInstr != null) {
          newInstrs.push(...newInstr, instr);
        } else {
          newInstrs.push(instr);
        }
      }
      block.instructions = newInstrs;
    }
  }
  if (hasRewrite) {
    // Renumber instructions and fix scope ranges
    markInstructionIds(fn.body);
    fixScopeAndIdentifierRanges(fn.body);
    fn.env.hasInferredEffect = true;
  }
}

function writeDependencyToInstructions(
  dep: ReactiveScopeDependency,
  reactive: boolean,
  env: Environment,
  loc: SourceLocation,
): {place: Place; instructions: Array<Instruction>} {
  const instructions: Array<Instruction> = [];
  let currValue = createTemporaryPlace(env, GeneratedSource);
  currValue.reactive = reactive;
  instructions.push({
    id: makeInstructionId(0),
    loc: GeneratedSource,
    lvalue: {...currValue, effect: Effect.Mutate},
    value: {
      kind: 'LoadLocal',
      place: {
        kind: 'Identifier',
        identifier: dep.identifier,
        effect: Effect.Capture,
        reactive,
        loc: loc,
      },
      loc: loc,
    },
  });
  for (const path of dep.path) {
    if (path.optional) {
      /**
       * TODO: instead of truncating optional paths, reuse
       * instructions from hoisted dependencies block(s)
       */
      break;
    }
    if (path.property === 'current') {
      /*
       * Prune ref.current accesses. This may over-capture for non-ref values with
       * a current property, but that's fine.
       */
      break;
    }
    const nextValue = createTemporaryPlace(env, GeneratedSource);
    nextValue.reactive = reactive;
    instructions.push({
      id: makeInstructionId(0),
      loc: GeneratedSource,
      lvalue: {...nextValue, effect: Effect.Mutate},
      value: {
        kind: 'PropertyLoad',
        object: {...currValue, effect: Effect.Capture},
        property: path.property,
        loc: loc,
      },
    });
    currValue = nextValue;
  }
  currValue.effect = Effect.Freeze;
  return {place: currValue, instructions};
}

function inferReactiveIdentifiers(fn: HIRFunction): Set<IdentifierId> {
  const reactiveIds: Set<IdentifierId> = new Set();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      /**
       * No need to traverse into nested functions as
       * 1. their effects are recorded in `LoweredFunction.dependencies`
       * 2. we don't mark `reactive` in these anyways
       */
      for (const place of eachInstructionOperand(instr)) {
        if (place.reactive) {
          reactiveIds.add(place.identifier.id);
        }
      }
    }

    for (const place of eachTerminalOperand(block.terminal)) {
      if (place.reactive) {
        reactiveIds.add(place.identifier.id);
      }
    }
  }
  return reactiveIds;
}

function collectDepUsages(
  deps: Array<ReactiveScopeDependency>,
  fnExpr: FunctionExpression,
): Array<SourceLocation> {
  const identifiers: Map<IdentifierId, ReactiveScopeDependency> = new Map();
  const loadedDeps: Set<IdentifierId> = new Set();
  const sourceLocations = [];
  for (const dep of deps) {
    identifiers.set(dep.identifier.id, dep);
  }

  for (const [, block] of fnExpr.loweredFunc.func.body.blocks) {
    for (const instr of block.instructions) {
      if (
        instr.value.kind === 'LoadLocal' &&
        identifiers.has(instr.value.place.identifier.id)
      ) {
        loadedDeps.add(instr.lvalue.identifier.id);
      }
      for (const place of eachInstructionOperand(instr)) {
        if (loadedDeps.has(place.identifier.id)) {
          // TODO(@jbrown215): handle member exprs!!
          sourceLocations.push(place.identifier.loc);
        }
      }
    }
  }

  return sourceLocations;
}

function inferMinimalDependencies(
  fnInstr: TInstruction<FunctionExpression>,
): Set<ReactiveScopeDependency> {
  const fn = fnInstr.value.loweredFunc.func;

  const temporaries = collectTemporariesSidemap(fn, new Set());
  const {
    hoistableObjects,
    processedInstrsInOptional,
    temporariesReadInOptional,
  } = collectOptionalChainSidemap(fn);

  const hoistablePropertyLoads = collectHoistablePropertyLoadsInInnerFn(
    fnInstr,
    temporaries,
    hoistableObjects,
  );
  const hoistableToFnEntry = hoistablePropertyLoads.get(fn.body.entry);
  CompilerError.invariant(hoistableToFnEntry != null, {
    reason:
      '[InferEffectDependencies] Internal invariant broken: missing entry block',
    loc: fnInstr.loc,
  });

  const dependencies = inferDependencies(
    fnInstr,
    new Map([...temporaries, ...temporariesReadInOptional]),
    processedInstrsInOptional,
  );

  const tree = new ReactiveScopeDependencyTreeHIR(
    [...hoistableToFnEntry.assumedNonNullObjects].map(o => o.fullPath),
  );
  for (const dep of dependencies) {
    tree.addDependency({...dep});
  }

  return tree.deriveMinimalDependencies();
}

function inferDependencies(
  fnInstr: TInstruction<FunctionExpression>,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
  processedInstrsInOptional: ReadonlySet<Instruction | Terminal>,
): Set<ReactiveScopeDependency> {
  const fn = fnInstr.value.loweredFunc.func;
  const context = new DependencyCollectionContext(
    new Set(),
    temporaries,
    processedInstrsInOptional,
  );
  for (const dep of fn.context) {
    context.declare(dep.identifier, {
      id: makeInstructionId(0),
      scope: empty(),
    });
  }
  const placeholderScope: ReactiveScope = {
    id: makeScopeId(0),
    range: {
      start: fnInstr.id,
      end: makeInstructionId(fnInstr.id + 1),
    },
    dependencies: new Set(),
    reassignments: new Set(),
    declarations: new Map(),
    earlyReturnValue: null,
    merged: new Set(),
    loc: GeneratedSource,
  };
  context.enterScope(placeholderScope);
  inferDependenciesInFn(fn, context, temporaries);
  context.exitScope(placeholderScope, false);
  const resultUnfiltered = context.deps.get(placeholderScope);
  CompilerError.invariant(resultUnfiltered != null, {
    reason:
      '[InferEffectDependencies] Internal invariant broken: missing scope dependencies',
    loc: fn.loc,
  });

  const fnContext = new Set(fn.context.map(dep => dep.identifier.id));
  const result = new Set<ReactiveScopeDependency>();
  for (const dep of resultUnfiltered) {
    if (fnContext.has(dep.identifier.id)) {
      result.add(dep);
    }
  }

  return result;
}

function inferDependenciesInFn(
  fn: HIRFunction,
  context: DependencyCollectionContext,
  temporaries: ReadonlyMap<IdentifierId, ReactiveScopeDependency>,
): void {
  for (const [, block] of fn.body.blocks) {
    // Record referenced optional chains in phis
    for (const phi of block.phis) {
      for (const operand of phi.operands) {
        const maybeOptionalChain = temporaries.get(operand[1].identifier.id);
        if (maybeOptionalChain) {
          context.visitDependency(maybeOptionalChain);
        }
      }
    }
    for (const instr of block.instructions) {
      if (
        instr.value.kind === 'FunctionExpression' ||
        instr.value.kind === 'ObjectMethod'
      ) {
        context.declare(instr.lvalue.identifier, {
          id: instr.id,
          scope: context.currentScope,
        });
        /**
         * Recursively visit the inner function to extract dependencies
         */
        const innerFn = instr.value.loweredFunc.func;
        context.enterInnerFn(instr as TInstruction<FunctionExpression>, () => {
          inferDependenciesInFn(innerFn, context, temporaries);
        });
      } else {
        handleInstruction(instr, context);
      }
    }
  }
}
