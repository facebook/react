/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isFunctionExpression} from '@babel/types';
import {CompilerError} from '..';
import {
  AliasingEffect,
  BasicBlock,
  BlockId,
  CallExpression,
  Environment,
  HIRFunction,
  Instruction,
  InstructionValue,
  isArrayType,
  isMapType,
  isSetType,
  MethodCall,
  NewExpression,
  Place,
  SpreadPattern,
} from '../HIR';
import {
  eachInstructionValueLValue,
  eachInstructionValueOperand,
  eachTerminalSuccessor,
} from '../HIR/visitors';
import {Result} from '../Utils/Result';
import {getFunctionCallSignature} from './InferReferenceEffects';
import {
  AliasingSignature,
  FunctionSignature,
  LifetimeId,
} from '../HIR/ObjectShape';
import {assertExhaustive, getOrInsertWith} from '../Utils/utils';

export function inferMutationAliasingEffects(
  fn: HIRFunction,
  {isFunctionExpression}: {isFunctionExpression: boolean} = {
    isFunctionExpression: false,
  },
): Result<Array<AliasingEffect>, CompilerError> {
  const initialState = InferenceState.empty(fn.env, isFunctionExpression);

  // Map of blocks to the last (merged) incoming state that was processed
  const statesByBlock: Map<BlockId, InferenceState> = new Map();

  /*
   * Multiple predecessors may be visited prior to reaching a given successor,
   * so track the list of incoming state for each successor block.
   * These are merged when reaching that block again.
   */
  const queuedStates: Map<BlockId, InferenceState> = new Map();
  function queue(blockId: BlockId, state: InferenceState): void {
    let queuedState = queuedStates.get(blockId);
    if (queuedState != null) {
      // merge the queued states for this block
      state = queuedState.merge(state) ?? queuedState;
      queuedStates.set(blockId, state);
    } else {
      /*
       * this is the first queued state for this block, see whether
       * there are changed relative to the last time it was processed.
       */
      const prevState = statesByBlock.get(blockId);
      const nextState = prevState != null ? prevState.merge(state) : state;
      if (nextState != null) {
        queuedStates.set(blockId, nextState);
      }
    }
  }
  queue(fn.body.entry, initialState);

  const signatureCache: Map<Instruction, Array<AliasingEffect>> = new Map();

  while (queuedStates.size !== 0) {
    for (const [blockId, block] of fn.body.blocks) {
      const incomingState = queuedStates.get(blockId);
      queuedStates.delete(blockId);
      if (incomingState == null) {
        continue;
      }

      statesByBlock.set(blockId, incomingState);
      const state = incomingState.clone();
      inferBlock(state, block, signatureCache);

      for (const nextBlockId of eachTerminalSuccessor(block.terminal)) {
        queue(nextBlockId, state);
      }
    }
  }
}

function inferBlock(
  state: InferenceState,
  block: BasicBlock,
  signatureCache: Map<Instruction, Array<AliasingEffect>>,
): void {
  for (const instr of block.instructions) {
    let signature = signatureCache.get(instr);
    if (signature == null) {
      signature = computeSignatureForInstruction(state.env, instr);
      signatureCache.set(instr, signature);
    }
    const effects = applySignature(signature, state);
    instr.effects = effects;
  }
}

/**
 * Applies the signature to the given state to determine the precise set of effects
 * that will occur in practice. This takes into account the inferred state of each
 * variable. For example, the signature may have a `ConditionallyMutate x` effect.
 * Here, we check the abstract type of `x` and either record a `Mutate x` if x is mutable
 * or no effect if x is a primitive, global, or frozen.
 *
 * This phase may also emit errors, for example MutateLocal on a frozen value is invalid.
 */
function applySignature(
  signature: Array<AliasingEffect>,
  state: InferenceState,
): Array<AliasingEffect> {}

class InferenceState {
  env: Environment;
  isFunctionExpression: boolean;

  constructor(env: Environment, isFunctionExpression: boolean) {
    this.env = env;
    this.isFunctionExpression = isFunctionExpression;
  }

  merge(state: InferenceState): InferenceState | null {}

  clone(): InferenceState {}

  static empty(
    env: Environment,
    isFunctionExpression: boolean,
  ): InferenceState {
    return new InferenceState(env, isFunctionExpression);
  }
}

/**
 * Computes an effect signature for the instruction _without_ looking at the inference state,
 * and only using the semantics of the instructions and the inferred types. The idea is to make
 * it easy to check that the semantics of each instruction are preserved by describing only the
 * effects and not making decisions based on the inference state.
 *
 * Then in applySignature(), above, we refine this signature based on the inference state.
 *
 * NOTE: this function is designed to be cached so it's only computed once upon first visiting
 * an instruction.
 */
function computeSignatureForInstruction(
  env: Environment,
  instr: Instruction,
): Array<AliasingEffect> {
  const {lvalue, value} = instr;
  const effects: Array<AliasingEffect> = [];
  switch (value.kind) {
    case 'ArrayExpression': {
      // All elements are captured into part of the output value
      for (const element of value.elements) {
        let operand: Place;
        if (element.kind === 'Identifier') {
          operand = element;
        } else if (element.kind === 'Spread') {
          operand = element.place;
        } else {
          continue;
        }
        effects.push({
          kind: 'Capture',
          from: {place: operand, path: null},
          to: {place: lvalue, path: '*'},
        });
      }
      break;
    }
    case 'ObjectExpression': {
      for (const property of value.properties) {
        const operand =
          property.kind === 'ObjectProperty' ? property.place : property.place;
        effects.push({
          kind: 'Capture',
          from: {place: operand, path: null},
          to: {place: lvalue, path: '*'},
        });
      }
      break;
    }
    case 'Await': {
      // Potentially mutates the receiver (awaiting it changes its state and can run side effects)
      effects.push({kind: 'ConditionallyMutate', place: value.value});
      /**
       * Data from the promise may be returned into the result, but await does not directly return
       * the promise itself
       */
      effects.push({
        kind: 'Capture',
        from: {place: value.value, path: '*'},
        to: {place: lvalue, path: null},
      });
      break;
    }
    case 'TaggedTemplateExpression': {
      CompilerError.throwTodo({
        reason: `Handle TaggedTemplateExpression in new inference`,
        loc: instr.loc,
      });
    }
    case 'NewExpression':
    case 'CallExpression':
    case 'MethodCall': {
      let callee;
      let mutatesCallee = false;
      if (value.kind === 'NewExpression') {
        callee = value.callee;
        mutatesCallee = false;
      } else if (value.kind === 'CallExpression') {
        callee = value.callee;
        mutatesCallee = true;
      } else if (value.kind === 'MethodCall') {
        callee = value.property;
        mutatesCallee = false;
      } else {
        assertExhaustive(
          value,
          `Unexpected value kind '${(value as any).kind}'`,
        );
      }
      const signature = getFunctionCallSignature(env, callee.identifier.type);
      if (signature != null && signature.aliasing != null) {
        effects.push(
          ...computeEffectsForSignature(
            signature.aliasing,
            lvalue,
            callee,
            value.args,
          ),
        );
      } else {
        /**
         * If no signature then by default:
         * - All operands are conditionally mutated, except some instruction
         *   variants are assumed to not mutate the callee (such as `new`)
         * - All operands are captured into (but not directly aliased as)
         *   every other argument.
         */
        for (const operand of eachInstructionValueOperand(value)) {
          if (operand !== callee || mutatesCallee) {
            effects.push({kind: 'ConditionallyMutate', place: operand});
          }
          for (const other of eachInstructionValueOperand(value)) {
            if (other === operand) {
              continue;
            }
            effects.push({
              kind: 'Capture',
              from: {place: operand, path: null},
              to: {place: other, path: '*'},
            });
          }
        }
      }
      break;
    }
    case 'PropertyDelete':
    case 'ComputedDelete': {
      // Mutates the object by removing the property, no aliasing
      effects.push({kind: 'MutateLocal', place: value.object});
      break;
    }
    case 'PropertyLoad':
    case 'ComputedLoad': {
      effects.push({
        kind: 'Capture',
        from: {place: value.object, path: '*'},
        to: {place: lvalue, path: null},
      });
      break;
    }
    case 'PropertyStore':
    case 'ComputedStore': {
      effects.push({kind: 'MutateLocal', place: value.object});
      effects.push({
        kind: 'Capture',
        from: {place: value.value, path: null},
        to: {place: value.object, path: '*'},
      });
      effects.push({kind: 'Alias', from: value.value, to: lvalue});
      break;
    }
    case 'PostfixUpdate':
    case 'PrefixUpdate': {
      effects.push({kind: 'MutateLocal', place: value.value});
      break;
    }
    case 'ObjectMethod':
    case 'FunctionExpression': {
      const functionEffects = value.loweredFunc.func.aliasingEffects;
      if (functionEffects != null) {
        effects.push(...functionEffects);
      }
      break;
    }
    case 'GetIterator': {
      if (
        isArrayType(value.collection.identifier) ||
        isMapType(value.collection.identifier) ||
        isSetType(value.collection.identifier)
      ) {
        /*
         * Builtin collections are known to return a fresh iterator on each call,
         * so the iterator does not alias the collection
         */
        effects.push({
          kind: 'Capture',
          from: {place: value.collection, path: '*'},
          to: {place: lvalue, path: '*'},
        });
      } else {
        /*
         * Otherwise, the object may return itself as the iterator, so we have to
         * assume that the result directly aliases the collection. Further, the
         * method to get the iterator could potentially mutate the collection
         */
        effects.push({kind: 'Alias', from: value.collection, to: lvalue});
        effects.push({kind: 'ConditionallyMutate', place: value.collection});
      }
      break;
    }
    case 'IteratorNext': {
      /*
       * Technically advancing an iterator will always mutate it (for any reasonable implementation)
       * But because we create an alias from the collection to the iterator if we don't know the type,
       * then it's possible the iterator is aliased to a frozen value and we wouldn't want to error.
       * so we mark this as conditional mutation to allow iterating frozen values.
       */
      effects.push({kind: 'ConditionallyMutate', place: value.iterator});
      // Extracts part of the original collection into the result
      effects.push({
        kind: 'Capture',
        from: {place: value.iterator, path: '*'},
        to: {place: lvalue, path: null},
      });
      break;
    }
    case 'NextPropertyOf': {
      // no effects
      break;
    }
    case 'JsxExpression':
    case 'JsxFragment': {
      for (const operand of eachInstructionValueOperand(value)) {
        effects.push({kind: 'Freeze', place: operand});
        effects.push({
          kind: 'Capture',
          from: {place: operand, path: null},
          to: {place: lvalue, path: '*'},
        });
      }
      break;
    }
    case 'DeclareContext':
    case 'DeclareLocal': {
      // no effects
      break;
    }
    case 'Destructure': {
      for (const patternLValue of eachInstructionValueLValue(value)) {
        effects.push({
          kind: 'Capture',
          from: {place: value.value, path: '*'},
          to: {place: patternLValue, path: null},
        });
      }
      effects.push({kind: 'Alias', from: value.value, to: lvalue});
      break;
    }
    case 'LoadContext': {
      effects.push({
        kind: 'Capture',
        from: {place: value.place, path: '*'},
        to: {place: lvalue, path: null},
      });
      break;
    }
    case 'LoadLocal': {
      effects.push({kind: 'Alias', from: value.place, to: lvalue});
      break;
    }
    case 'StoreContext': {
      effects.push({kind: 'MutateLocal', place: value.lvalue.place});
      effects.push({
        kind: 'Capture',
        from: {place: value.value, path: null},
        to: {place: value.lvalue.place, path: '*'},
      });
      effects.push({kind: 'Alias', from: value.value, to: lvalue});
      break;
    }
    case 'StoreGlobal': {
      effects.push({kind: 'MutateGlobal', place: value.value});
      break;
    }
    case 'StoreLocal': {
      effects.push({kind: 'Alias', from: value.value, to: value.lvalue.place});
      effects.push({kind: 'Alias', from: value.value, to: lvalue});
      break;
    }
    case 'TypeCastExpression': {
      effects.push({kind: 'Alias', from: value.value, to: lvalue});
      break;
    }
    case 'BinaryExpression':
    case 'Debugger':
    case 'FinishMemoize':
    case 'JSXText':
    case 'LoadGlobal':
    case 'MetaProperty':
    case 'Primitive':
    case 'RegExpLiteral':
    case 'StartMemoize':
    case 'TemplateLiteral':
    case 'UnaryExpression':
    case 'UnsupportedNode': {
      // no effects
      break;
    }
  }
  return effects;
}

function computeEffectsForSignature(
  signature: AliasingSignature,
  lvalue: Place,
  receiver: Place,
  args: Array<Place | SpreadPattern>,
): Array<AliasingEffect> {
  // Build substitutions
  const substitutions: Map<LifetimeId, Array<Place>> = new Map();
  substitutions.set(signature.receiver, [receiver]);
  substitutions.set(signature.returns, [lvalue]);
  const params = signature.params;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (params == null || i >= params.length || arg.kind === 'Spread') {
      const place = arg.kind === 'Identifier' ? arg : arg.place;
      getOrInsertWith(substitutions, signature.restParam, () => []).push(place);
    } else {
      const param = params[i];
      substitutions.set(param, [arg]);
    }
  }
  // Apply substitutions
  const effects: Array<AliasingEffect> = [];
  for (const effect of signature.effects) {
    switch (effect.kind) {
      case 'Alias': {
        const from = substitutions.get(effect.from);
        const to = substitutions.get(effect.to);
        if (from == null || to == null) {
          continue;
        }
        for (const fromPlace of from) {
          for (const toPlace of to) {
            effects.push({kind: 'Alias', from: fromPlace, to: toPlace});
          }
        }
        break;
      }
      case 'Capture': {
        const from = substitutions.get(effect.from.place);
        const to = substitutions.get(effect.to.place);
        if (from == null || to == null) {
          continue;
        }
        for (const fromPlace of from) {
          for (const toPlace of to) {
            effects.push({
              kind: 'Capture',
              from: {place: fromPlace, path: effect.from.path},
              to: {place: toPlace, path: effect.to.path},
            });
          }
        }
        break;
      }
      case 'ConditionallyMutate': {
        const places = substitutions.get(effect.place);
        if (places == null) {
          continue;
        }
        for (const place of places) {
          effects.push({kind: 'ConditionallyMutate', place});
        }
        break;
      }
      case 'MutateGlobal': {
        const places = substitutions.get(effect.place);
        if (places == null) {
          continue;
        }
        for (const place of places) {
          effects.push({kind: 'MutateGlobal', place});
        }
        break;
      }
      case 'Freeze': {
        const places = substitutions.get(effect.place);
        if (places == null) {
          continue;
        }
        for (const place of places) {
          effects.push({kind: 'Freeze', place});
        }
        break;
      }
      case 'MutateLocal': {
        const places = substitutions.get(effect.place);
        if (places == null) {
          continue;
        }
        for (const place of places) {
          effects.push({kind: 'MutateLocal', place});
        }
        break;
      }
      case 'MutateTransitive': {
        const places = substitutions.get(effect.place);
        if (places == null) {
          continue;
        }
        for (const place of places) {
          effects.push({kind: 'MutateTransitive', place});
        }
        break;
      }
      default: {
        assertExhaustive(
          effect,
          `Unexpected effect kind '${(effect as any).kind}'`,
        );
      }
    }
  }
  return effects;
}
