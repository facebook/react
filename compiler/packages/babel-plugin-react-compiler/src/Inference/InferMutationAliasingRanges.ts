/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import prettyFormat from 'pretty-format';
import {CompilerError, SourceLocation} from '..';
import {
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
import {printInstruction} from '../HIR/PrintHIR';

const DEBUG = false;

/**
 * Infers mutable ranges for all values.
 */
export function inferMutationAliasingRanges(fn: HIRFunction): void {
  if (DEBUG) {
    console.log();
  }
  /**
   * Part 1: Infer mutable ranges for values. We build an abstract model
   * of the effect types, distinguishing values which can capture references
   * to other values and variables, which can point to one or more values.
   *
   * Transitive mutation marks value identifiers as mutated and also walks
   * into the identifiers captured by that abstract value: local mutation
   * only marks the top-level identifiers as mutated.
   *
   * TODO: add a fixpoint.
   */
  const state = new AliasingState();
  for (const param of fn.context) {
    state.create(param);
  }
  for (const block of fn.body.blocks.values()) {
    for (const phi of block.phis) {
      state.create(phi.place);
      for (const operand of phi.operands.values()) {
        state.alias(operand, phi.place);
      }
    }

    for (const instr of block.instructions) {
      for (const lvalue of eachInstructionLValue(instr)) {
        state.create(lvalue);
        if (lvalue.identifier.mutableRange.start === 0) {
          lvalue.identifier.mutableRange.start = instr.id;
        }
        lvalue.identifier.mutableRange.end = makeInstructionId(
          Math.max(instr.id + 1, lvalue.identifier.mutableRange.end),
        );
      }

      if (instr.effects == null) continue;
      for (const effect of instr.effects) {
        if (effect.kind === 'Create' || effect.kind === 'CreateFunction') {
          state.create(effect.into);
        } else if (effect.kind === 'Assign') {
          state.assign(effect.from, effect.into);
        } else if (effect.kind === 'Alias' || effect.kind === 'CreateFrom') {
          state.alias(effect.from, effect.into);
        } else if (effect.kind === 'Capture') {
          state.capture(effect.from, effect.into);
        } else if (
          effect.kind === 'MutateTransitive' ||
          effect.kind === 'MutateTransitiveConditionally'
        ) {
          state.mutateTransitive(
            effect.value.identifier,
            makeInstructionId(instr.id + 1),
            effect.value.loc,
          );
        } else if (
          effect.kind === 'Mutate' ||
          effect.kind === 'MutateConditionally'
        ) {
          state.mutate(
            effect.value.identifier,
            makeInstructionId(instr.id + 1),
            effect.value.loc,
          );
        }
      }
      if (DEBUG) {
        console.log(printInstruction(instr));
        console.log(state.debug());
      }
    }
  }
  if (DEBUG) {
    console.log(state.debug());
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

/**
 * TODO: similar to alias effect inference state:
 * - values represent the conceptual values (context vars, things that got Create*-ed)
 *   into which other values are captured
 * - variables deals with aliases (Assign, Alias, CreateFrom)
 *
 * Ex:
 * `Capture a -> b`:
 * - find the values represented by `a` (aValues) by looking up a in .variables, then mapping to .values
 * - find the values represented by `b` (bValues) by looking up b in .variables, then mapping to .values
 * - add aValues into bValues
 */
class AliasingState {
  values: Map<Identifier, Set<Identifier>> = new Map();
  variables: Map<IdentifierId, Set<Identifier>> = new Map();

  create(place: Place): void {
    this.values.set(place.identifier, new Set());
    this.variables.set(place.identifier.id, new Set([place.identifier]));
  }

  clear(lvalue: Place): void {
    this.variables.set(lvalue.identifier.id, new Set());
  }

  assign(from: Place, into: Place): void {
    const fromVariables = this.variables.get(from.identifier.id);
    if (fromVariables == null) {
      return;
    }
    this.variables.set(
      into.identifier.id,
      new Set([...fromVariables, from.identifier, into.identifier]),
      // fromVariables,
    );
  }

  alias(from: Place, into: Place): void {
    const intoVariables = getOrInsertWith(
      this.variables,
      into.identifier.id,
      () => new Set(),
    );
    intoVariables.add(from.identifier);
  }

  capture(from: Place, into: Place): void {
    const intoVariables = this.variables.get(into.identifier.id)!;
    for (const v of intoVariables) {
      const values = this.values.get(v)!;
      values.add(from.identifier);
    }
  }

  mutateTransitive(
    place: Identifier,
    end: InstructionId,
    loc: SourceLocation,
  ): void {
    const variables = this.variables.get(place.id);
    if (variables == null) {
      return;
    }
    for (const value of variables) {
      value.mutableRange.end = makeInstructionId(
        Math.max(value.mutableRange.end, end),
      );
      const captured = this.values.get(value)!;
      for (const capture of captured) {
        this.mutateTransitive(capture, end, loc);
      }
    }
  }

  mutate(place: Identifier, end: InstructionId, _loc: SourceLocation): void {
    const variables = this.variables.get(place.id);
    if (variables == null) {
      return;
    }
    place.mutableRange.end = makeInstructionId(
      Math.max(place.mutableRange.end, end),
    );
    for (const value of variables) {
      // Unlike mutateTransitive, we don't traverse into captured values
      value.mutableRange.end = makeInstructionId(
        Math.max(value.mutableRange.end, end),
      );
    }
  }

  canonicalize(): Map<IdentifierId, string> {
    const map = new Map<IdentifierId, string>();
    for (const value of this.values.keys()) {
      map.set(
        value.id,
        `${value.mutableRange.start}:${value.mutableRange.end}`,
      );
    }
    return map;
  }

  debug(): string {
    const values = new Map<string, string>();
    for (const [k, v] of this.values) {
      values.set(
        `${k.name?.value ?? ''}$${k.id}:${k.mutableRange.start}:${k.mutableRange.end}`,
        [...v]
          .map(
            v =>
              `${v.name?.value ?? ''}$${v.id}:${v.mutableRange.start}:${v.mutableRange.end}`,
          )
          .join(', '),
      );
    }
    const variables = new Map<string, string>();
    for (const [k, v] of this.variables) {
      variables.set(
        `$${k}`,
        [...v]
          .map(
            v =>
              `${v.name?.value ?? ''}$${v.id}:${v.mutableRange.start}:${v.mutableRange.end}`,
          )
          .join(', '),
      );
    }
    return prettyFormat({values, variables});
  }
}
