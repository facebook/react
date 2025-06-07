/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat from 'pretty-format';
import {CompilerError} from '..';
import {
  BlockId,
  Effect,
  HIRFunction,
  Identifier,
  IdentifierId,
  InstructionId,
  makeInstructionId,
  Place,
} from '../HIR/HIR';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {assertExhaustive, getOrInsertWith} from '../Utils/utils';
import {printFunction} from '../HIR';
import {printIdentifier, printPlace} from '../HIR/PrintHIR';
import {MutationKind} from './InferMutationAliasingFunctionEffects';

const DEBUG = false;

/**
 * Infers mutable ranges for all values.
 */
export function inferMutationAliasingRanges(fn: HIRFunction): void {
  if (DEBUG) {
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log(printFunction(fn));
  }
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
  }> = [];

  let index = 0;

  for (const param of [...fn.params, ...fn.context, fn.returns]) {
    const place = param.kind === 'Identifier' ? param : param.place;
    state.create(place);
  }
  const seenBlocks = new Set<BlockId>();
  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      state.create(phi.place);
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
      for (const lvalue of eachInstructionLValue(instr)) {
        state.create(lvalue);
      }

      if (instr.effects == null) continue;
      for (const effect of instr.effects) {
        if (effect.kind === 'Create' || effect.kind === 'CreateFunction') {
          state.create(effect.into);
        } else if (
          effect.kind === 'Assign' ||
          effect.kind === 'Alias' ||
          effect.kind === 'CreateFrom'
        ) {
          state.assign(index++, effect.from, effect.into);
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
            place: effect.value,
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
            place: effect.value,
          });
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
        } else {
          CompilerError.invariant(effect.kind === 'Freeze', {
            reason: `Unexpected '${effect.kind}' effect for MaybeThrow terminal`,
            loc: block.terminal.loc,
          });
        }
      }
    }
  }

  if (DEBUG) {
    console.log(state.debug());
    console.log(pretty(mutations));
  }
  for (const mutation of mutations) {
    state.mutate(
      mutation.index,
      mutation.place,
      makeInstructionId(mutation.id + 1),
      mutation.transitive,
      mutation.kind,
    );
  }
  if (DEBUG) {
    console.log(state.debug());
  }
  fn.aliasingEffects ??= [];
  for (const param of fn.context) {
    const node = state.nodes.get(param.identifier);
    if (node == null) {
      continue;
    }
    let mutated = false;
    if (node.local === MutationKind.Conditional) {
      mutated = true;
      fn.aliasingEffects.push({
        kind: 'MutateConditionally',
        value: param,
      });
    } else if (node.local === MutationKind.Definite) {
      mutated = true;
      fn.aliasingEffects.push({
        kind: 'Mutate',
        value: param,
      });
    }
    if (node.transitive === MutationKind.Conditional) {
      mutated = true;
      fn.aliasingEffects.push({
        kind: 'MutateTransitiveConditionally',
        value: param,
      });
    } else if (node.transitive === MutationKind.Definite) {
      mutated = true;
      fn.aliasingEffects.push({
        kind: 'MutateTransitive',
        value: param,
      });
    }
    if (mutated) {
      param.effect = Effect.Capture;
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
          case 'CreateFrom': {
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
          case 'ImmutableCapture': {
            operandEffects.set(effect.from.identifier.id, Effect.Read);
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
    }
    for (const operand of eachTerminalOperand(block.terminal)) {
      operand.effect = Effect.Read;
    }
  }

  if (DEBUG) {
    console.log(printFunction(fn));
  }
}

type Node = {
  id: Identifier;
  captures: Map<Identifier, number>;
  aliases: Map<Identifier, number>;
  edges: Array<{index: number; node: Identifier; kind: 'capture' | 'alias'}>;
  transitive: MutationKind;
  local: MutationKind;
};
class AliasingState {
  nodes: Map<Identifier, Node> = new Map();

  create(place: Place): void {
    this.nodes.set(place.identifier, {
      id: place.identifier,
      captures: new Map(),
      aliases: new Map(),
      edges: [],
      transitive: MutationKind.None,
      local: MutationKind.None,
    });
  }

  capture(index: number, from: Place, into: Place): void {
    const fromNode = this.nodes.get(from.identifier);
    const toNode = this.nodes.get(into.identifier);
    if (fromNode == null || toNode == null) {
      if (DEBUG) {
        console.log(
          `skip: capture ${printPlace(from)}${!!fromNode} -> ${printPlace(into)}${!!toNode}`,
        );
      }
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
      if (DEBUG) {
        console.log(
          `skip: assign ${printPlace(from)}${!!fromNode} -> ${printPlace(into)}${!!toNode}`,
        );
      }
      return;
    }
    fromNode.edges.push({index, node: into.identifier, kind: 'alias'});
    if (!toNode.captures.has(from.identifier)) {
      toNode.aliases.set(from.identifier, index);
    }
  }

  mutate(
    index: number,
    start: Place,
    end: InstructionId,
    transitive: boolean,
    kind: MutationKind,
  ): void {
    const seen = new Set<Identifier>();
    const queue = [start.identifier];
    while (queue.length !== 0) {
      const current = queue.pop()!;
      if (seen.has(current)) {
        continue;
      }
      seen.add(current);
      const node = this.nodes.get(current);
      if (node == null) {
        if (DEBUG) {
          console.log(
            `no node! ${printPlace(start)} for identifier ${printIdentifier(current)}`,
          );
        }
        continue;
      }
      if (DEBUG) {
        console.log(
          `mutate $${node.id.id} via ${printPlace(start)} at [${end}]`,
        );
      }
      node.id.mutableRange.end = makeInstructionId(
        Math.max(node.id.mutableRange.end, end),
      );
      if (transitive) {
        node.transitive = Math.max(node.transitive, kind);
      } else {
        node.local = Math.max(node.local, kind);
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
        queue.push(edge.node);
      }
      /**
       * all mutations affect backward alias edges by the rules:
       * - Alias a -> b, mutate(b) => mutate(a)
       * - Alias a -> b, mutateTransitive(b) => mutate(a)
       */
      for (const [alias, when] of node.aliases) {
        if (when >= index) {
          continue;
        }
        queue.push(alias);
      }
      /**
       * but only transitive mutations affect captures
       */
      if (transitive) {
        for (const [capture, when] of node.captures) {
          if (when >= index) {
            continue;
          }
          queue.push(capture);
        }
      }
    }
  }

  debug(): string {
    return pretty(this.nodes);
  }
}

function pretty(v: any): string {
  return prettyFormat(v, {
    plugins: [
      {
        test: v =>
          v !== null && typeof v === 'object' && v.kind === 'Identifier',
        serialize: v => printPlace(v),
      },
      {
        test: v =>
          v !== null &&
          typeof v === 'object' &&
          typeof v.declarationId === 'number',
        serialize: v =>
          `${printIdentifier(v)}:${v.mutableRange.start}:${v.mutableRange.end}`,
      },
    ],
  });
}
