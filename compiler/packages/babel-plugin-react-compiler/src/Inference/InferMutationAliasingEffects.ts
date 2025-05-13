/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '..';
import {
  AliasingEffect,
  HIRFunction,
  Instruction,
  isArrayType,
  isMapType,
  isSetType,
  Place,
} from '../HIR';
import {
  eachInstructionValueLValue,
  eachInstructionValueOperand,
} from '../HIR/visitors';
import {Result} from '../Utils/Result';

export function inferMutationAliasingEffects(
  fn: HIRFunction,
): Result<Array<AliasingEffect>, CompilerError> {}

function computeEffectsForInstruction(
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
    case 'MethodCall':
    case 'NewExpression':
    case 'CallExpression': {
      // TODO
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
      // TODO: effects.push(...value.loweredFunc.func.aliasEffects)
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
      // TODO
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
    case 'TaggedTemplateExpression':
    case 'TemplateLiteral':
    case 'UnaryExpression':
    case 'UnsupportedNode': {
      // no effects
      break;
    }
  }
  return effects;
}
