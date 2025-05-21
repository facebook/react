/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '..';
import {HIRFunction, IdentifierId, Place} from '../HIR';
import {printPlace} from '../HIR/PrintHIR';
import {eachInstructionValueLValue, eachPatternOperand} from '../HIR/visitors';

/**
 * Validates that all store/load references to a given named identifier align with the
 * "kind" of that variable (normal variable or context variable). For example, a context
 * variable may not be loaded/stored with regular StoreLocal/LoadLocal/Destructure instructions.
 */
export function validateContextVariableLValues(fn: HIRFunction): void {
  const identifierKinds: IdentifierKinds = new Map();
  validateContextVariableLValuesImpl(fn, identifierKinds);
}

function validateContextVariableLValuesImpl(
  fn: HIRFunction,
  identifierKinds: IdentifierKinds,
): void {
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const {value} = instr;
      switch (value.kind) {
        case 'DeclareContext':
        case 'StoreContext': {
          visit(identifierKinds, value.lvalue.place, 'context');
          break;
        }
        case 'LoadContext': {
          visit(identifierKinds, value.place, 'context');
          break;
        }
        case 'StoreLocal':
        case 'DeclareLocal': {
          visit(identifierKinds, value.lvalue.place, 'local');
          break;
        }
        case 'LoadLocal': {
          visit(identifierKinds, value.place, 'local');
          break;
        }
        case 'PostfixUpdate':
        case 'PrefixUpdate': {
          visit(identifierKinds, value.lvalue, 'local');
          break;
        }
        case 'Destructure': {
          for (const lvalue of eachPatternOperand(value.lvalue.pattern)) {
            visit(identifierKinds, lvalue, 'destructure');
          }
          break;
        }
        case 'ObjectMethod':
        case 'FunctionExpression': {
          validateContextVariableLValuesImpl(
            value.loweredFunc.func,
            identifierKinds,
          );
          break;
        }
        default: {
          for (const _ of eachInstructionValueLValue(value)) {
            CompilerError.throwTodo({
              reason:
                'ValidateContextVariableLValues: unhandled instruction variant',
              loc: value.loc,
              description: `Handle '${value.kind} lvalues`,
              suggestions: null,
            });
          }
        }
      }
    }
  }
}

type IdentifierKinds = Map<
  IdentifierId,
  {place: Place; kind: 'local' | 'context' | 'destructure'}
>;

function visit(
  identifiers: IdentifierKinds,
  place: Place,
  kind: 'local' | 'context' | 'destructure',
): void {
  const prev = identifiers.get(place.identifier.id);
  if (prev !== undefined) {
    const wasContext = prev.kind === 'context';
    const isContext = kind === 'context';
    if (wasContext !== isContext) {
      if (prev.kind === 'destructure' || kind === 'destructure') {
        CompilerError.throwTodo({
          reason: `Support destructuring of context variables`,
          loc: kind === 'destructure' ? place.loc : prev.place.loc,
          description: null,
          suggestions: null,
        });
      }

      CompilerError.invariant(false, {
        reason: `Expected all references to a variable to be consistently local or context references`,
        loc: place.loc,
        description: `Identifier ${printPlace(
          place,
        )} is referenced as a ${kind} variable, but was previously referenced as a ${prev} variable`,
        suggestions: null,
      });
    }
  }
  identifiers.set(place.identifier.id, {place, kind});
}
