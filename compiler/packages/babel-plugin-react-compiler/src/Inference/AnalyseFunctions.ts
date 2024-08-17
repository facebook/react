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
  IdentifierName,
  LoweredFunction,
  Place,
  ReactiveScopeDependency,
  isRefOrRefValue,
  makeInstructionId,
} from '../HIR';
import {deadCodeElimination} from '../Optimization';
import {inferReactiveScopeVariables} from '../ReactiveScopes';
import {rewriteInstructionKindsBasedOnReassignment} from '../SSA';
import {logHIRFunction} from '../Utils/logger';
import {inferMutableContextVariables} from './InferMutableContextVariables';
import {inferMutableRanges} from './InferMutableRanges';
import inferReferenceEffects from './InferReferenceEffects';

// Helper class to track indirections such as LoadLocal and PropertyLoad.
export class IdentifierState {
  properties: Map<Identifier, ReactiveScopeDependency> = new Map();

  resolve(identifier: Identifier): Identifier {
    const resolved = this.properties.get(identifier);
    if (resolved !== undefined) {
      return resolved.identifier;
    }
    return identifier;
  }

  declareProperty(lvalue: Place, object: Place, property: string): void {
    const objectDependency = this.properties.get(object.identifier);
    let nextDependency: ReactiveScopeDependency;
    if (objectDependency === undefined) {
      nextDependency = {identifier: object.identifier, path: [property]};
    } else {
      nextDependency = {
        identifier: objectDependency.identifier,
        path: [...objectDependency.path, property],
      };
    }
    this.properties.set(lvalue.identifier, nextDependency);
  }

  declareTemporary(lvalue: Place, value: Place): void {
    const resolved: ReactiveScopeDependency = this.properties.get(
      value.identifier,
    ) ?? {
      identifier: value.identifier,
      path: [],
    };
    this.properties.set(lvalue.identifier, resolved);
  }
}

export default function analyseFunctions(func: HIRFunction): void {
  const state = new IdentifierState();

  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      switch (instr.value.kind) {
        case 'ObjectMethod':
        case 'FunctionExpression': {
          lower(instr.value.loweredFunc.func);
          infer(instr.value.loweredFunc, state, func.context);
          break;
        }
        case 'PropertyLoad': {
          state.declareProperty(
            instr.lvalue,
            instr.value.object,
            instr.value.property,
          );
          break;
        }
        case 'ComputedLoad': {
          /*
           * The path is set to an empty string as the path doesn't really
           * matter for a computed load.
           */
          state.declareProperty(instr.lvalue, instr.value.object, '');
          break;
        }
        case 'LoadLocal':
        case 'LoadContext': {
          if (instr.lvalue.identifier.name === null) {
            state.declareTemporary(instr.lvalue, instr.value.place);
          }
          break;
        }
      }
    }
  }
}

function lower(func: HIRFunction): void {
  analyseFunctions(func);
  inferReferenceEffects(func, {isFunctionExpression: true});
  deadCodeElimination(func);
  inferMutableRanges(func);
  rewriteInstructionKindsBasedOnReassignment(func);
  inferReactiveScopeVariables(func);
  inferMutableContextVariables(func);
  logHIRFunction('AnalyseFunction (inner)', func);
}

function infer(
  loweredFunc: LoweredFunction,
  state: IdentifierState,
  context: Array<Place>,
): void {
  const mutations = new Map<string, Effect>();
  for (const operand of loweredFunc.func.context) {
    if (
      isMutatedOrReassigned(operand.identifier) &&
      operand.identifier.name !== null
    ) {
      mutations.set(operand.identifier.name.value, operand.effect);
    }
  }

  for (const dep of loweredFunc.dependencies) {
    let name: IdentifierName | null = null;

    if (state.properties.has(dep.identifier)) {
      const receiver = state.properties.get(dep.identifier)!;
      name = receiver.identifier.name;
    } else {
      name = dep.identifier.name;
    }

    if (isRefOrRefValue(dep.identifier)) {
      /*
       * TODO: this is a hack to ensure we treat functions which reference refs
       * as having a capture and therefore being considered mutable. this ensures
       * the function gets a mutable range which accounts for anywhere that it
       * could be called, and allows us to help ensure it isn't called during
       * render
       */
      dep.effect = Effect.Capture;
    } else if (name !== null) {
      const effect = mutations.get(name.value);
      if (effect !== undefined) {
        dep.effect = effect === Effect.Unknown ? Effect.Capture : effect;
      }
    }
  }

  /*
   * This could potentially add duplicate deps to mutatedDeps in the case of
   * mutating a context ref in the child function and in this parent function.
   * It might be useful to dedupe this.
   *
   * In practice this never really matters because the Component function has no
   * context refs, so it will never have duplicate deps.
   */
  for (const place of context) {
    CompilerError.invariant(place.identifier.name !== null, {
      reason: 'context refs should always have a name',
      description: null,
      loc: place.loc,
      suggestions: null,
    });

    const effect = mutations.get(place.identifier.name.value);
    if (effect !== undefined) {
      place.effect = effect === Effect.Unknown ? Effect.Capture : effect;
      loweredFunc.dependencies.push(place);
    }
  }

  for (const operand of loweredFunc.func.context) {
    operand.identifier.mutableRange.start = makeInstructionId(0);
    operand.identifier.mutableRange.end = makeInstructionId(0);
    operand.identifier.scope = null;
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
