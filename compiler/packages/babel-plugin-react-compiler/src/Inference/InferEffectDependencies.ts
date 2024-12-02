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
  ReactiveScopeDependencies,
} from '../HIR';
import {DEFAULT_EXPORT} from '../HIR/Environment';
import {
  createTemporaryPlace,
  fixScopeAndIdentifierRanges,
  markInstructionIds,
} from '../HIR/HIRBuilder';
import {eachInstructionOperand, eachTerminalOperand} from '../HIR/visitors';
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

  const scopeInfos = new Map<
    ScopeId,
    {pruned: boolean; deps: ReactiveScopeDependencies; hasSingleInstr: boolean}
  >();

  /**
   * When inserting LoadLocals, we need to retain the reactivity of the base
   * identifier, as later passes e.g. PruneNonReactiveDeps take the reactivity of
   * a base identifier as the "maximal" reactivity of all its references.
   * Concretely,
   * reactive(Identifier i) = Union_{reference of i}(reactive(reference))
   */
  const reactiveIds = inferReactiveIdentifiers(fn);

  for (const [, block] of fn.body.blocks) {
    if (
      block.terminal.kind === 'scope' ||
      block.terminal.kind === 'pruned-scope'
    ) {
      const scopeBlock = fn.body.blocks.get(block.terminal.block)!;
      scopeInfos.set(block.terminal.scope.id, {
        pruned: block.terminal.kind === 'pruned-scope',
        deps: block.terminal.scope.dependencies,
        hasSingleInstr:
          scopeBlock.instructions.length === 1 &&
          scopeBlock.terminal.kind === 'goto' &&
          scopeBlock.terminal.block === block.terminal.fallthrough,
      });
    }
    const rewriteInstrs = new Map<InstructionId, Array<Instruction>>();
    for (const instr of block.instructions) {
      const {value, lvalue} = instr;
      if (value.kind === 'FunctionExpression') {
        fnExpressions.set(
          lvalue.identifier.id,
          instr as TInstruction<FunctionExpression>,
        );
      } else if (
        value.kind === 'LoadGlobal' &&
        value.binding.kind === 'ImportSpecifier'
      ) {
        const moduleTargets = autodepFnConfigs.get(value.binding.module);
        if (moduleTargets != null) {
          const numRequiredArgs = moduleTargets.get(value.binding.imported);
          if (numRequiredArgs != null) {
            autodepFnLoads.set(lvalue.identifier.id, numRequiredArgs);
          }
        }
      } else if (
        value.kind === 'LoadGlobal' &&
        value.binding.kind === 'ImportDefault'
      ) {
        const moduleTargets = autodepFnConfigs.get(value.binding.module);
        if (moduleTargets != null) {
          const numRequiredArgs = moduleTargets.get(DEFAULT_EXPORT);
          if (numRequiredArgs != null) {
            autodepFnLoads.set(lvalue.identifier.id, numRequiredArgs);
          }
        }
      } else if (
        /*
         * TODO: Handle method calls
         */
        value.kind === 'CallExpression' &&
        autodepFnLoads.get(value.callee.identifier.id) === value.args.length &&
        value.args[0].kind === 'Identifier'
      ) {
        const fnExpr = fnExpressions.get(value.args[0].identifier.id);
        if (fnExpr != null) {
          const scopeInfo =
            fnExpr.lvalue.identifier.scope != null
              ? scopeInfos.get(fnExpr.lvalue.identifier.scope.id)
              : null;
          CompilerError.invariant(scopeInfo != null, {
            reason: 'Expected function expression scope to exist',
            loc: value.loc,
          });
          if (scopeInfo.pruned || !scopeInfo.hasSingleInstr) {
            /**
             * TODO: retry pipeline that ensures effect function expressions
             * are placed into their own scope
             */
            CompilerError.throwTodo({
              reason:
                '[InferEffectDependencies] Expected effect function to have non-pruned scope and its scope to have exactly one instruction',
              loc: fnExpr.loc,
            });
          }

          /**
           * Step 1: write new instructions to insert a dependency array
           *
           * Note that it's invalid to prune non-reactive deps in this pass, see
           * the `infer-effect-deps/pruned-nonreactive-obj` fixture for an
           * explanation.
           */
          const effectDeps: Array<Place> = [];
          const newInstructions: Array<Instruction> = [];
          for (const dep of scopeInfo.deps) {
            const {place, instructions} = writeDependencyToInstructions(
              dep,
              reactiveIds.has(dep.identifier.id),
              fn.env,
              fnExpr.loc,
            );
            newInstructions.push(...instructions);
            effectDeps.push(place);
          }
          const deps: ArrayExpression = {
            kind: 'ArrayExpression',
            elements: effectDeps,
            loc: GeneratedSource,
          };

          const depsPlace = createTemporaryPlace(fn.env, GeneratedSource);
          depsPlace.effect = Effect.Read;

          newInstructions.push({
            id: makeInstructionId(0),
            loc: GeneratedSource,
            lvalue: {...depsPlace, effect: Effect.Mutate},
            value: deps,
          });

          // Step 2: push the inferred deps array as an argument of the useEffect
          value.args.push({...depsPlace, effect: Effect.Freeze});
          rewriteInstrs.set(instr.id, newInstructions);
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
