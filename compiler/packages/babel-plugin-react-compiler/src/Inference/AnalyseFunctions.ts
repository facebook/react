/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '../CompilerError';
import {
  Effect,
  HIRFunction,
  Identifier,
  LoweredFunction,
  Place,
  isRefOrRefValue,
  makeInstructionId,
} from '../HIR';
import {deadCodeElimination} from '../Optimization';
import {inferReactiveScopeVariables} from '../ReactiveScopes';
import {rewriteInstructionKindsBasedOnReassignment} from '../SSA';
import {inferMutableRanges} from './InferMutableRanges';
import inferReferenceEffects from './InferReferenceEffects';
import DisjointSet from '../Utils/DisjointSet';
import {
  eachInstructionLValue,
  eachInstructionValueOperand,
} from '../HIR/visitors';
import prettyFormat from 'pretty-format';
import {printIdentifier} from '../HIR/PrintHIR';
import {Iterable_some} from '../Utils/utils';

export default function analyseFunctions(func: HIRFunction): void {
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'ObjectMethod':
        case 'FunctionExpression': {
          const aliases = lower(instr.value.loweredFunc.func);
          infer(instr.value.loweredFunc, aliases);

          /**
           * Reset mutable range for outer inferReferenceEffects
           */
          for (const operand of instr.value.loweredFunc.func.context) {
            operand.identifier.mutableRange.start = makeInstructionId(0);
            operand.identifier.mutableRange.end = makeInstructionId(0);
            operand.identifier.scope = null;
          }
          break;
        }
      }
    }
  }
}

function lower(func: HIRFunction): DisjointSet<Identifier> {
  analyseFunctions(func);
  inferReferenceEffects(func, {isFunctionExpression: true});
  deadCodeElimination(func);
  const aliases = inferMutableRanges(func);
  rewriteInstructionKindsBasedOnReassignment(func);
  inferReactiveScopeVariables(func);
  func.env.logger?.debugLogIRs?.({
    kind: 'hir',
    name: 'AnalyseFunction (inner)',
    value: func,
  });
  inferAliasesForCapturing(func, aliases);
  return aliases;
}

export function debugAliases(aliases: DisjointSet<Identifier>): void {
  console.log(
    prettyFormat(
      aliases
        .buildSets()
        .map(set => [...set].map(ident => printIdentifier(ident))),
    ),
  );
}

/**
 * The alias sets returned by InferMutableRanges() accounts only for aliases that
 * are known to mutate together. Notably this skips cases where a value is captured
 * into some other value, but neither is subsequently mutated. An example is pushing
 * a mutable value onto an array, where neither the array or value are subsequently
 * mutated.
 *
 * This function extends the aliases sets to account for such capturing, so that we
 * can detect cases where one of the values in a set is mutated later (in an outer function)
 * we can correctly infer them as mutating together.
 */
function inferAliasesForCapturing(
  fn: HIRFunction,
  aliases: DisjointSet<Identifier>,
): void {
  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      const {lvalue, value} = instr;
      const hasStore =
        lvalue.effect === Effect.Store ||
        Iterable_some(
          eachInstructionValueOperand(value),
          operand => operand.effect === Effect.Store,
        );
      if (!hasStore) {
        continue;
      }
      const operands: Array<Identifier> = [];
      for (const lvalue of eachInstructionLValue(instr)) {
        operands.push(lvalue.identifier);
      }
      for (const operand of eachInstructionValueOperand(instr.value)) {
        if (
          operand.effect === Effect.Store ||
          operand.effect === Effect.Capture
        ) {
          operands.push(operand.identifier);
        }
      }
      if (operands.length > 1) {
        aliases.union(operands);
      }
    }
  }
}

function infer(
  loweredFunc: LoweredFunction,
  aliases: DisjointSet<Identifier>,
): void {
  for (const operand of loweredFunc.func.context) {
    const identifier = operand.identifier;
    CompilerError.invariant(operand.effect === Effect.Unknown, {
      reason:
        '[AnalyseFunctions] Expected Function context effects to not have been set',
      loc: operand.loc,
    });
    if (isRefOrRefValue(identifier)) {
      /*
       * TODO: this is a hack to ensure we treat functions which reference refs
       * as having a capture and therefore being considered mutable. this ensures
       * the function gets a mutable range which accounts for anywhere that it
       * could be called, and allows us to help ensure it isn't called during
       * render
       */
      operand.effect = Effect.Capture;
    } else if (isMutatedOrReassigned(identifier)) {
      /**
       * Reflects direct reassignments, PropertyStores, and ConditionallyMutate
       * (directly or through maybe-aliases)
       */
      operand.effect = Effect.Capture;
    } else {
      operand.effect = Effect.Read;
    }
  }
  const contextIdentifiers = new Map(
    loweredFunc.func.context.map(place => [place.identifier, place]),
  );
  for (const set of aliases.buildSets()) {
    const contextOperands: Set<Place> = new Set(
      [...set]
        .map(identifier => contextIdentifiers.get(identifier))
        .filter(place => place != null) as Array<Place>,
    );
    if (contextOperands.size !== 0) {
      loweredFunc.func.effects ??= [];
      loweredFunc.func.effects?.push({
        kind: 'CaptureEffect',
        places: contextOperands,
      });
    }
  }
}

function isMutatedOrReassigned(id: Identifier): boolean {
  /*
   * This check checks for mutation and reassingnment, so the usual check for
   * mutation (ie, `mutableRange.end - mutableRange.start > 1`) isn't quite
   * enough.
   *
   * We need to track re-assignments in context refs as we need to reflect the
   * re-assignment back to the captured refs.
   */
  return id.mutableRange.end > id.mutableRange.start;
}
