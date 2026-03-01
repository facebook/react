/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, SourceLocation} from '..';
import {
  BlockId,
  Effect,
  HIRFunction,
  Identifier,
  IdentifierId,
  InstructionId,
  isJsxType,
  makeInstructionId,
  ValueKind,
  ValueReason,
  Place,
  isPrimitiveType,
} from '../HIR/HIR';
import {Environment} from '../HIR/Environment';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {assertExhaustive, getOrInsertWith} from '../Utils/utils';

import {AliasingEffect, MutationReason} from './AliasingEffects';

/**
 * This pass builds an abstract model of the heap and interprets the effects of the
 * given function in order to determine the following:
 * - The mutable ranges of all identifiers in the function
 * - The externally-visible effects of the function, such as mutations of params and
 *   context-vars, aliasing between params/context-vars/return-value, and impure side
 *   effects.
 * - The legacy `Effect` to store on each Place.
 *
 * This pass builds a data flow graph using the effects, tracking an abstract notion
 * of "when" each effect occurs relative to the others. It then walks each mutation
 * effect against the graph, updating the range of each node that would be reachable
 * at the "time" that the effect occurred.
 *
 * This pass also validates against invalid effects: any function that is reachable
 * by being called, or via a Render effect, is validated against mutating globals
 * or calling impure code.
 *
 * Note that this function also populates the outer function's aliasing effects with
 * any mutations that apply to its params or context variables.
 *
 * ## Example
 * A function expression such as the following:
 *
 * ```
 * (x) => { x.y = true }
 * ```
 *
 * Would populate a `Mutate x` aliasing effect on the outer function.
 *
 * ## Returned Function Effects
 *
 * The function returns (if successful) a list of externally-visible effects.
 * This is determined by simulating a conditional, transitive mutation against
 * each param, context variable, and return value in turn, and seeing which other
 * such values are affected. If they're affected, they must be captured, so we
 * record a Capture.
 *
 * The only tricky bit is the return value, which could _alias_ (or even assign)
 * one or more of the params/context-vars rather than just capturing. So we have
 * to do a bit more tracking for returns.
 */
export function inferMutationAliasingRanges(
  fn: HIRFunction,
  {isFunctionExpression}: {isFunctionExpression: boolean},
): Array<AliasingEffect> {
  // The set of externally-visible effects
  const functionEffects: Array<AliasingEffect> = [];

  /**
   * Part 1: Infer mutable ranges for values. We build an abstract model of
   * values, the alias/capture edges between them, and the set of mutations.
   * Edges and mutations are ordered, with mutations processed against the
   * abstract model only after it is fully constructed by visiting all blocks
   * _and_ connecting phis. Phis are considered ordered at the time of the
   * phi node.
   *
   * This should (may?) mean that mutations are able to see the full state
   * of the graph and mark all the appropriate identifiers as mutated at
   * the correct point, accounting for both backward and forward edges.
   * Ie a mutation of x accounts for both values that flowed into x,
   * and values that x flowed into.
   */
  const state = new AliasingState();
  type PendingPhiOperand = {from: Place; into: Place; index: number};
  const pendingPhis = new Map<BlockId, Array<PendingPhiOperand>>();
  const mutations: Array<{
    index: number;
    id: InstructionId;
    transitive: boolean;
    kind: MutationKind;
    place: Place;
    reason: MutationReason | null;
    noBackwardRangeExtension: boolean;
  }> = [];
  const renders: Array<{index: number; place: Place}> = [];

  let index = 0;

  const shouldRecordErrors = !isFunctionExpression && fn.env.enableValidations;

  for (const param of [...fn.params, ...fn.context, fn.returns]) {
    const place = param.kind === 'Identifier' ? param : param.place;
    state.create(place, {kind: 'Object'});
  }
  const seenBlocks = new Set<BlockId>();
  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      state.create(phi.place, {kind: 'Phi'});
      for (const [pred, operand] of phi.operands) {
        if (!seenBlocks.has(pred)) {
          // NOTE: annotation required to actually typecheck and not silently infer `any`
          const blockPhis = getOrInsertWith<BlockId, Array<PendingPhiOperand>>(
            pendingPhis,
            pred,
            () => [],
          );
          blockPhis.push({from: operand, into: phi.place, index: index++});
        } else {
          state.assign(index++, operand, phi.place);
        }
      }
    }
    seenBlocks.add(block.id);

    for (const instr of block.instructions) {
      if (instr.effects == null) continue;
      for (const effect of instr.effects) {
        if (effect.kind === 'Create') {
          state.create(effect.into, {kind: 'Object'});
        } else if (effect.kind === 'CreateFunction') {
          state.create(effect.into, {
            kind: 'Function',
            function: effect.function.loweredFunc.func,
          });
        } else if (effect.kind === 'CreateFrom') {
          state.createFrom(index++, effect.from, effect.into);
        } else if (effect.kind === 'Assign') {
          /**
           * TODO: Invariant that the node is not initialized yet
           *
           * InferFunctionExpressionAliasingEffectSignatures currently infers
           * Assign effects in some places that should be Alias, leading to
           * Assign effects that reinitialize a value. The end result appears to
           * be fine, but we should fix that inference pass so that we add the
           * invariant here.
           */
          if (!state.nodes.has(effect.into.identifier)) {
            state.create(effect.into, {kind: 'Object'});
          }
          state.assign(index++, effect.from, effect.into);
        } else if (effect.kind === 'Alias') {
          state.assign(index++, effect.from, effect.into);
        } else if (effect.kind === 'MaybeAlias') {
          state.maybeAlias(index++, effect.from, effect.into);
        } else if (effect.kind === 'Capture') {
          state.capture(index++, effect.from, effect.into);
        } else if (
          effect.kind === 'MutateTransitive' ||
          effect.kind === 'MutateTransitiveConditionally'
        ) {
          mutations.push({
            index: index++,
            id: instr.id,
            transitive: true,
            kind:
              effect.kind === 'MutateTransitive'
                ? MutationKind.Definite
                : MutationKind.Conditional,
            reason: null,
            place: effect.value,
            noBackwardRangeExtension:
              effect.kind === 'MutateTransitiveConditionally' &&
              (effect.noBackwardRangeExtension ?? false),
          });
        } else if (
          effect.kind === 'Mutate' ||
          effect.kind === 'MutateConditionally'
        ) {
          mutations.push({
            index: index++,
            id: instr.id,
            transitive: false,
            kind:
              effect.kind === 'Mutate'
                ? MutationKind.Definite
                : MutationKind.Conditional,
            reason: effect.kind === 'Mutate' ? (effect.reason ?? null) : null,
            place: effect.value,
            noBackwardRangeExtension: false,
          });
        } else if (
          effect.kind === 'MutateFrozen' ||
          effect.kind === 'MutateGlobal' ||
          effect.kind === 'Impure'
        ) {
          if (shouldRecordErrors) {
            fn.env.recordError(effect.error);
          }
          functionEffects.push(effect);
        } else if (effect.kind === 'Render') {
          renders.push({index: index++, place: effect.place});
          functionEffects.push(effect);
        }
      }
    }
    const blockPhis = pendingPhis.get(block.id);
    if (blockPhis != null) {
      for (const {from, into, index} of blockPhis) {
        state.assign(index, from, into);
      }
    }
    if (block.terminal.kind === 'return') {
      state.assign(index++, block.terminal.value, fn.returns);
    }

    if (
      (block.terminal.kind === 'maybe-throw' ||
        block.terminal.kind === 'return') &&
      block.terminal.effects != null
    ) {
      for (const effect of block.terminal.effects) {
        if (effect.kind === 'Alias') {
          state.assign(index++, effect.from, effect.into);
          if (block.terminal.kind === 'maybe-throw') {
            state.catchParams.add(effect.into.identifier);
          }
        } else {
          CompilerError.invariant(effect.kind === 'Freeze', {
            reason: `Unexpected '${effect.kind}' effect for MaybeThrow terminal`,
            loc: block.terminal.loc,
          });
        }
      }
    }
  }

  for (const mutation of mutations) {
    state.mutate(
      mutation.index,
      mutation.place.identifier,
      makeInstructionId(mutation.id + 1),
      mutation.transitive,
      mutation.kind,
      mutation.place.loc,
      mutation.reason,
      shouldRecordErrors ? fn.env : null,
      mutation.noBackwardRangeExtension,
    );
  }
  for (const render of renders) {
    state.render(
      render.index,
      render.place.identifier,
      shouldRecordErrors ? fn.env : null,
    );
  }
  for (const param of [...fn.context, ...fn.params]) {
    const place = param.kind === 'Identifier' ? param : param.place;

    const node = state.nodes.get(place.identifier);
    if (node == null) {
      continue;
    }
    let mutated = false;
    if (node.local != null) {
      if (node.local.kind === MutationKind.Conditional) {
        mutated = true;
        functionEffects.push({
          kind: 'MutateConditionally',
          value: {...place, loc: node.local.loc},
        });
      } else if (node.local.kind === MutationKind.Definite) {
        mutated = true;
        functionEffects.push({
          kind: 'Mutate',
          value: {...place, loc: node.local.loc},
          reason: node.mutationReason,
        });
      }
    }
    if (node.transitive != null) {
      if (node.transitive.kind === MutationKind.Conditional) {
        mutated = true;
        functionEffects.push({
          kind: 'MutateTransitiveConditionally',
          value: {...place, loc: node.transitive.loc},
        });
      } else if (node.transitive.kind === MutationKind.Definite) {
        mutated = true;
        functionEffects.push({
          kind: 'MutateTransitive',
          value: {...place, loc: node.transitive.loc},
        });
      }
    }
    if (mutated) {
      place.effect = Effect.Capture;
    }
  }

  /**
   * Part 2
   * Add legacy operand-specific effects based on instruction effects and mutable ranges.
   * Also fixes up operand mutable ranges, making sure that start is non-zero if the value
   * is mutated (depended on by later passes like InferReactiveScopeVariables which uses this
   * to filter spurious mutations of globals, which we now guard against more precisely)
   */
  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      // TODO: we don't actually set these effects today!
      phi.place.effect = Effect.Store;
      const isPhiMutatedAfterCreation: boolean =
        phi.place.identifier.mutableRange.end >
        (block.instructions.at(0)?.id ?? block.terminal.id);
      for (const operand of phi.operands.values()) {
        operand.effect = isPhiMutatedAfterCreation
          ? Effect.Capture
          : Effect.Read;
      }
      if (
        isPhiMutatedAfterCreation &&
        phi.place.identifier.mutableRange.start === 0
      ) {
        /*
         * TODO: ideally we'd construct a precise start range, but what really
         * matters is that the phi's range appears mutable (end > start + 1)
         * so we just set the start to the previous instruction before this block
         */
        const firstInstructionIdOfBlock =
          block.instructions.at(0)?.id ?? block.terminal.id;
        phi.place.identifier.mutableRange.start = makeInstructionId(
          firstInstructionIdOfBlock - 1,
        );
      }
    }
    for (const instr of block.instructions) {
      for (const lvalue of eachInstructionLValue(instr)) {
        lvalue.effect = Effect.ConditionallyMutate;
        if (lvalue.identifier.mutableRange.start === 0) {
          lvalue.identifier.mutableRange.start = instr.id;
        }
        if (lvalue.identifier.mutableRange.end === 0) {
          lvalue.identifier.mutableRange.end = makeInstructionId(
            Math.max(instr.id + 1, lvalue.identifier.mutableRange.end),
          );
        }
      }
      for (const operand of eachInstructionValueOperand(instr.value)) {
        operand.effect = Effect.Read;
      }
      if (instr.effects == null) {
        continue;
      }
      const operandEffects = new Map<IdentifierId, Effect>();
      for (const effect of instr.effects) {
        switch (effect.kind) {
          case 'Assign':
          case 'Alias':
          case 'Capture':
          case 'CreateFrom':
          case 'MaybeAlias': {
            const isMutatedOrReassigned =
              effect.into.identifier.mutableRange.end > instr.id;
            if (isMutatedOrReassigned) {
              operandEffects.set(effect.from.identifier.id, Effect.Capture);
              operandEffects.set(effect.into.identifier.id, Effect.Store);
            } else {
              operandEffects.set(effect.from.identifier.id, Effect.Read);
              operandEffects.set(effect.into.identifier.id, Effect.Store);
            }
            break;
          }
          case 'CreateFunction':
          case 'Create': {
            break;
          }
          case 'Mutate': {
            operandEffects.set(effect.value.identifier.id, Effect.Store);
            break;
          }
          case 'Apply': {
            CompilerError.invariant(false, {
              reason: `[AnalyzeFunctions] Expected Apply effects to be replaced with more precise effects`,
              loc: effect.function.loc,
            });
          }
          case 'MutateTransitive':
          case 'MutateConditionally':
          case 'MutateTransitiveConditionally': {
            operandEffects.set(
              effect.value.identifier.id,
              Effect.ConditionallyMutate,
            );
            break;
          }
          case 'Freeze': {
            operandEffects.set(effect.value.identifier.id, Effect.Freeze);
            break;
          }
          case 'ImmutableCapture': {
            // no-op, Read is the default
            break;
          }
          case 'Impure':
          case 'Render':
          case 'MutateFrozen':
          case 'MutateGlobal': {
            // no-op
            break;
          }
          default: {
            assertExhaustive(
              effect,
              `Unexpected effect kind ${(effect as any).kind}`,
            );
          }
        }
      }
      for (const lvalue of eachInstructionLValue(instr)) {
        const effect =
          operandEffects.get(lvalue.identifier.id) ??
          Effect.ConditionallyMutate;
        lvalue.effect = effect;
      }
      for (const operand of eachInstructionValueOperand(instr.value)) {
        if (
          operand.identifier.mutableRange.end > instr.id &&
          operand.identifier.mutableRange.start === 0
        ) {
          operand.identifier.mutableRange.start = instr.id;
        }
        const effect = operandEffects.get(operand.identifier.id) ?? Effect.Read;
        operand.effect = effect;
      }

      /**
       * This case is targeted at hoisted functions like:
       *
       * ```
       * x();
       * function x() { ... }
       * ```
       *
       * Which turns into:
       *
       * t0 = DeclareContext HoistedFunction x
       * t1 = LoadContext x
       * t2 = CallExpression t1 ( )
       * t3 = FunctionExpression ...
       * t4 = StoreContext Function x = t3
       *
       * If the function had captured mutable values, it would already have its
       * range extended to include the StoreContext. But if the function doesn't
       * capture any mutable values its range won't have been extended yet. We
       * want to ensure that the value is memoized along with the context variable,
       * not independently of it (bc of the way we do codegen for hoisted functions).
       * So here we check for StoreContext rvalues and if they haven't already had
       * their range extended to at least this instruction, we extend it.
       */
      if (
        instr.value.kind === 'StoreContext' &&
        instr.value.value.identifier.mutableRange.end <= instr.id
      ) {
        instr.value.value.identifier.mutableRange.end = makeInstructionId(
          instr.id + 1,
        );
      }
    }
    if (block.terminal.kind === 'return') {
      block.terminal.value.effect = isFunctionExpression
        ? Effect.Read
        : Effect.Freeze;
    } else {
      for (const operand of eachTerminalOperand(block.terminal)) {
        operand.effect = Effect.Read;
      }
    }
  }

  /**
   * Part 3
   * Finish populating the externally visible effects. Above we bubble-up the side effects
   * (MutateFrozen/MutableGlobal/Impure/Render) as well as mutations of context variables.
   * Here we populate an effect to create the return value as well as populating alias/capture
   * effects for how data flows between the params, context vars, and return.
   */
  const returns = fn.returns.identifier;
  functionEffects.push({
    kind: 'Create',
    into: fn.returns,
    value: isPrimitiveType(returns)
      ? ValueKind.Primitive
      : isJsxType(returns.type)
        ? ValueKind.Frozen
        : ValueKind.Mutable,
    reason: ValueReason.KnownReturnSignature,
  });
  /**
   * Determine precise data-flow effects by simulating transitive mutations of the params/
   * captures and seeing what other params/context variables are affected. Anything that
   * would be transitively mutated needs a capture relationship.
   */
  const tracked: Array<Place> = [];
  for (const param of [...fn.params, ...fn.context, fn.returns]) {
    const place = param.kind === 'Identifier' ? param : param.place;
    tracked.push(place);
  }
  for (const into of tracked) {
    const mutationIndex = index++;
    state.mutate(
      mutationIndex,
      into.identifier,
      null,
      true,
      MutationKind.Conditional,
      into.loc,
      null,
      null,
    );
    for (const from of tracked) {
      if (
        from.identifier.id === into.identifier.id ||
        from.identifier.id === fn.returns.identifier.id
      ) {
        continue;
      }
      const fromNode = state.nodes.get(from.identifier);
      CompilerError.invariant(fromNode != null, {
        reason: `Expected a node to exist for all parameters and context variables`,
        loc: into.loc,
      });
      if (fromNode.lastMutated === mutationIndex) {
        if (into.identifier.id === fn.returns.identifier.id) {
          // The return value could be any of the params/context variables
          functionEffects.push({
            kind: 'Alias',
            from,
            into,
          });
        } else {
          // Otherwise params/context-vars can only capture each other
          functionEffects.push({
            kind: 'Capture',
            from,
            into,
          });
        }
      }
    }
  }

  return functionEffects;
}

function appendFunctionErrors(env: Environment | null, fn: HIRFunction): void {
  if (env == null) return;
  for (const effect of fn.aliasingEffects ?? []) {
    switch (effect.kind) {
      case 'Impure':
      case 'MutateFrozen':
      case 'MutateGlobal': {
        env.recordError(effect.error);
        break;
      }
    }
  }
}

export enum MutationKind {
  None = 0,
  Conditional = 1,
  Definite = 2,
}

type Node = {
  id: Identifier;
  createdFrom: Map<Identifier, number>;
  captures: Map<Identifier, number>;
  aliases: Map<Identifier, number>;
  maybeAliases: Map<Identifier, number>;
  edges: Array<{
    index: number;
    node: Identifier;
    kind: 'capture' | 'alias' | 'maybeAlias';
  }>;
  transitive: {kind: MutationKind; loc: SourceLocation} | null;
  local: {kind: MutationKind; loc: SourceLocation} | null;
  lastMutated: number;
  mutationReason: MutationReason | null;
  value:
    | {kind: 'Object'}
    | {kind: 'Phi'}
    | {kind: 'Function'; function: HIRFunction};
};
class AliasingState {
  nodes: Map<Identifier, Node> = new Map();
  /*
   * Identifiers that are catch handler bindings. These are tracked
   * so the backward-alias heuristic in mutate() can stop walking
   * through catch parameter aliases, which would otherwise incorrectly
   * match the "function call result" pattern and skip range extension.
   */
  catchParams: Set<Identifier> = new Set();

  create(place: Place, value: Node['value']): void {
    this.nodes.set(place.identifier, {
      id: place.identifier,
      createdFrom: new Map(),
      captures: new Map(),
      aliases: new Map(),
      maybeAliases: new Map(),
      edges: [],
      transitive: null,
      local: null,
      lastMutated: 0,
      mutationReason: null,
      value,
    });
  }

  createFrom(index: number, from: Place, into: Place): void {
    this.create(into, {kind: 'Object'});
    const fromNode = this.nodes.get(from.identifier);
    const toNode = this.nodes.get(into.identifier);
    if (fromNode == null || toNode == null) {
      return;
    }
    fromNode.edges.push({index, node: into.identifier, kind: 'alias'});
    if (!toNode.createdFrom.has(from.identifier)) {
      toNode.createdFrom.set(from.identifier, index);
    }
  }

  capture(index: number, from: Place, into: Place): void {
    const fromNode = this.nodes.get(from.identifier);
    const toNode = this.nodes.get(into.identifier);
    if (fromNode == null || toNode == null) {
      return;
    }
    fromNode.edges.push({index, node: into.identifier, kind: 'capture'});
    if (!toNode.captures.has(from.identifier)) {
      toNode.captures.set(from.identifier, index);
    }
  }

  assign(index: number, from: Place, into: Place): void {
    const fromNode = this.nodes.get(from.identifier);
    const toNode = this.nodes.get(into.identifier);
    if (fromNode == null || toNode == null) {
      return;
    }
    fromNode.edges.push({index, node: into.identifier, kind: 'alias'});
    if (!toNode.aliases.has(from.identifier)) {
      toNode.aliases.set(from.identifier, index);
    }
  }

  maybeAlias(index: number, from: Place, into: Place): void {
    const fromNode = this.nodes.get(from.identifier);
    const toNode = this.nodes.get(into.identifier);
    if (fromNode == null || toNode == null) {
      return;
    }
    fromNode.edges.push({index, node: into.identifier, kind: 'maybeAlias'});
    if (!toNode.maybeAliases.has(from.identifier)) {
      toNode.maybeAliases.set(from.identifier, index);
    }
  }

  render(index: number, start: Identifier, env: Environment | null): void {
    const seen = new Set<Identifier>();
    const queue: Array<Identifier> = [start];
    while (queue.length !== 0) {
      const current = queue.pop()!;
      if (seen.has(current)) {
        continue;
      }
      seen.add(current);
      const node = this.nodes.get(current);
      if (node == null || node.transitive != null || node.local != null) {
        continue;
      }
      if (node.value.kind === 'Function') {
        appendFunctionErrors(env, node.value.function);
      }
      for (const [alias, when] of node.createdFrom) {
        if (when >= index) {
          continue;
        }
        queue.push(alias);
      }
      for (const [alias, when] of node.aliases) {
        if (when >= index) {
          continue;
        }
        queue.push(alias);
      }
      for (const [capture, when] of node.captures) {
        if (when >= index) {
          continue;
        }
        queue.push(capture);
      }
    }
  }

  mutate(
    index: number,
    start: Identifier,
    // Null is used for simulated mutations
    end: InstructionId | null,
    transitive: boolean,
    startKind: MutationKind,
    loc: SourceLocation,
    reason: MutationReason | null,
    env: Environment | null,
    noBackwardRangeExtension: boolean = false,
  ): void {
    /*
     * Only skip backward-alias range extension when ALL of these hold:
     * 1. The effect requested noBackwardRangeExtension (MethodCall receiver)
     * 2. The start node is not a PropertyLoad result (no createdFrom edges),
     *    since PropertyLoad receivers need backward range extension for
     *    correctness (e.g. `x.y.push(val)` must extend x and y).
     * 3. At least one of the start's backward alias targets was produced by
     *    a function call (indicated by having maybeAliases from the default
     *    Apply handler). This distinguishes `expensiveProcessing(data).map(fn)`
     *    from `localArray.push(val)` — only the former should skip, since the
     *    call result represents a separately-memoizable value.
     */
    const startNode = this.nodes.get(start);
    let effectiveSkipAliases = false;
    if (
      noBackwardRangeExtension &&
      startNode != null &&
      startNode.createdFrom.size === 0
    ) {
      /*
       * Walk backward through aliases from the start node to check if
       * any value in the chain was produced by a function call (Apply).
       * Apply results are identifiable by having maybeAliases, since the
       * default Apply handler records MaybeAlias from each argument to
       * the result. Only walk through alias edges (not maybeAliases or
       * captures). Additionally, stop walking when a catch parameter is
       * reached, since catch parameters are aliased to call results via
       * terminal Alias effects and would otherwise incorrectly trigger
       * this heuristic.
       */
      const visited = new Set<Identifier>();
      const aliasQueue: Array<Identifier> = [start];
      while (aliasQueue.length > 0) {
        const id = aliasQueue.pop()!;
        if (visited.has(id)) {
          continue;
        }
        visited.add(id);
        const node = this.nodes.get(id);
        if (node == null) {
          continue;
        }
        /*
         * Stop walking through catch parameter aliases. Catch bindings
         * are aliased to call results in the try block, and those call
         * results have maybeAliases from the Apply handler. Without
         * this check, the heuristic would incorrectly treat catch
         * parameters as independently-memoizable function call results,
         * preventing backward range extension and causing scope boundary
         * issues (e.g. "Expected a break target" in try-catch blocks).
         */
        if (this.catchParams.has(id)) {
          continue;
        }
        if (node.maybeAliases.size > 0) {
          effectiveSkipAliases = true;
          break;
        }
        for (const [nextAliasId] of node.aliases) {
          aliasQueue.push(nextAliasId);
        }
      }
    }
    const seen = new Map<Identifier, MutationKind>();
    const queue: Array<{
      place: Identifier;
      transitive: boolean;
      direction: 'backwards' | 'forwards';
      kind: MutationKind;
      /*
       * When true, skip extending the mutable range for this node. This
       * is set for nodes reached via backward alias/maybeAlias edges when
       * effectiveSkipAliases is enabled, so that the receiver's backward
       * aliases are not pulled into the same reactive scope as the method
       * call. Nodes reached via capture edges reset this flag, since
       * captures represent structural containment (e.g. function closures)
       * where range extension is required for correctness.
       */
      skipRangeExtension: boolean;
    }> = [
      {
        place: start,
        transitive,
        direction: 'backwards',
        kind: startKind,
        skipRangeExtension: false,
      },
    ];
    while (queue.length !== 0) {
      const {place: current, transitive, direction, kind, skipRangeExtension} =
        queue.pop()!;
      const previousKind = seen.get(current);
      if (previousKind != null && previousKind >= kind) {
        continue;
      }
      seen.set(current, kind);
      const node = this.nodes.get(current);
      if (node == null) {
        continue;
      }
      node.mutationReason ??= reason;
      node.lastMutated = Math.max(node.lastMutated, index);
      if (end != null && !skipRangeExtension) {
        node.id.mutableRange.end = makeInstructionId(
          Math.max(node.id.mutableRange.end, end),
        );
      }
      if (
        node.value.kind === 'Function' &&
        node.transitive == null &&
        node.local == null
      ) {
        appendFunctionErrors(env, node.value.function);
      }
      if (transitive) {
        if (node.transitive == null || node.transitive.kind < kind) {
          node.transitive = {kind, loc};
        }
      } else {
        if (node.local == null || node.local.kind < kind) {
          node.local = {kind, loc};
        }
      }
      /**
       * all mutations affect "forward" edges by the rules:
       * - Capture a -> b, mutate(a) => mutate(b)
       * - Alias a -> b, mutate(a) => mutate(b)
       */
      for (const edge of node.edges) {
        if (edge.index >= index) {
          break;
        }
        queue.push({
          place: edge.node,
          transitive,
          direction: 'forwards',
          // Traversing a maybeAlias edge always downgrades to conditional mutation
          kind: edge.kind === 'maybeAlias' ? MutationKind.Conditional : kind,
          skipRangeExtension: false,
        });
      }
      for (const [alias, when] of node.createdFrom) {
        if (when >= index) {
          continue;
        }
        queue.push({
          place: alias,
          transitive: true,
          direction: 'backwards',
          kind,
          // Propagate parent's skipRangeExtension but don't initiate it
          skipRangeExtension,
        });
      }
      if (direction === 'backwards' || node.value.kind !== 'Phi') {
        /**
         * all mutations affect backward alias edges by the rules:
         * - Alias a -> b, mutate(b) => mutate(a)
         * - Alias a -> b, mutateTransitive(b) => mutate(a)
         *
         * However, if we reached a phi because one of its inputs was mutated
         * (and we're advancing "forwards" through that node's edges), then
         * we know we've already processed the mutation at its source. The
         * phi's other inputs can't be affected.
         */
        for (const [alias, when] of node.aliases) {
          if (when >= index) {
            continue;
          }
          queue.push({
            place: alias,
            transitive,
            direction: 'backwards',
            kind,
            /*
             * Skip range extension when traversing backward through alias
             * edges from a conditional method-call mutation. This prevents
             * the receiver's creation-site values from having their ranges
             * extended to cover the method call instruction, which would
             * otherwise cause them to be merged into the same scope.
             */
            skipRangeExtension:
              skipRangeExtension ||
              (effectiveSkipAliases && current === start),
          });
        }
        /**
         * MaybeAlias indicates potential data flow from unknown function calls,
         * so we downgrade mutations through these aliases to consider them
         * conditional. This means we'll consider them for mutation *range*
         * purposes but not report validation errors for mutations, since
         * we aren't sure that the `from` value could actually be aliased.
         */
        for (const [alias, when] of node.maybeAliases) {
          if (when >= index) {
            continue;
          }
          queue.push({
            place: alias,
            transitive,
            direction: 'backwards',
            kind: MutationKind.Conditional,
            skipRangeExtension:
              skipRangeExtension ||
              (effectiveSkipAliases && current === start),
          });
        }
      }
      /**
       * but only transitive mutations affect captures
       */
      if (transitive) {
        for (const [capture, when] of node.captures) {
          if (when >= index) {
            continue;
          }
          queue.push({
            place: capture,
            transitive,
            direction: 'backwards',
            kind,
            /*
             * Reset skipRangeExtension for capture edges. Captures
             * represent structural containment (e.g. a function closing
             * over a value), and the captured value's range must be
             * extended to cover the mutation point for correctness.
             */
            skipRangeExtension: false,
          });
        }
      }
    }
  }
}
