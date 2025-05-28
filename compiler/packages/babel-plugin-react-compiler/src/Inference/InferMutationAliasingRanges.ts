/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Effect,
  HIRFunction,
  Identifier,
  IdentifierId,
  makeInstructionId,
} from '../HIR/HIR';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import DisjointSet from '../Utils/DisjointSet';
import {assertExhaustive} from '../Utils/utils';
import {inferMutableRangesForAlias} from './InferMutableRangesForAlias';

export function inferMutationAliasingRanges(fn: HIRFunction): void {
  /**
   * Part 1
   * Infer ranges for transitive mutations, which includes mutations that affect
   * captured references and not just direct aliases. We build a distjoing set
   * that tracks capturing and direct aliasing, and look at transitive mutations
   * only.
   */
  const captures = new DisjointSet<Identifier>();
  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      captures.union([
        phi.place.identifier,
        ...[...phi.operands.values()].map(place => place.identifier),
      ]);
    }

    for (const instr of block.instructions) {
      for (const lvalue of eachInstructionLValue(instr)) {
        lvalue.identifier.mutableRange.start = instr.id;
        lvalue.identifier.mutableRange.end = makeInstructionId(
          Math.max(instr.id + 1, lvalue.identifier.mutableRange.end),
        );
      }

      if (instr.effects == null) continue;
      for (const effect of instr.effects) {
        if (
          effect.kind === 'Alias' ||
          effect.kind === 'CreateFrom' ||
          effect.kind === 'Capture'
        ) {
          captures.union([effect.from.identifier, effect.into.identifier]);
        } else if (
          effect.kind === 'MutateTransitive' ||
          effect.kind === 'MutateTransitiveConditionally'
        ) {
          const value = effect.value;
          value.identifier.mutableRange.end = makeInstructionId(instr.id + 1);
        }
      }
    }
  }
  inferMutableRangesForAlias(fn, captures);

  /**
   * Part 2
   * Infer ranges for local (non-transitive) mutations. We build a disjoint set
   * that only tracks direct value aliasing, and look only at local mutations
   * to extend ranges
   */
  const aliases = new DisjointSet<Identifier>();
  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      aliases.union([
        phi.place.identifier,
        ...[...phi.operands.values()].map(place => place.identifier),
      ]);
    }

    for (const instr of block.instructions) {
      if (instr.effects == null) continue;
      for (const effect of instr.effects) {
        if (effect.kind === 'Alias' || effect.kind === 'CreateFrom') {
          aliases.union([effect.from.identifier, effect.into.identifier]);
        } else if (
          effect.kind === 'Mutate' ||
          effect.kind === 'MutateConditionally'
        ) {
          const value = effect.value;
          value.identifier.mutableRange.end = makeInstructionId(instr.id + 1);
        }
      }
    }
  }
  inferMutableRangesForAlias(fn, aliases);

  /**
   * Part 3
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
      if (instr.effects == null) {
        for (const lvalue of eachInstructionLValue(instr)) {
          lvalue.effect = Effect.ConditionallyMutate;
        }
        for (const operand of eachInstructionValueOperand(instr.value)) {
          operand.effect = Effect.Read;
        }
        continue;
      }
      const operandEffects = new Map<IdentifierId, Effect>();
      for (const effect of instr.effects) {
        switch (effect.kind) {
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
          case 'Create': {
            break;
          }
          case 'Mutate': {
            operandEffects.set(effect.value.identifier.id, Effect.Store);
            break;
          }
          case 'Apply': {
            operandEffects.set(
              effect.function.place.identifier.id,
              Effect.ConditionallyMutate,
            );
            break;
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
}
