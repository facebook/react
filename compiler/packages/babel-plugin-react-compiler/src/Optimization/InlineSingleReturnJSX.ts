/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError} from '..';
import {
  BlockId,
  Effect,
  HIRFunction,
  Instruction,
  makeInstructionId,
  ObjectProperty,
  Place,
  ReactiveScope,
  SpreadPattern,
} from '../HIR';
import {updateScopeRangesAfterRenumberingInstructions} from '../HIR/BuildReactiveScopeTerminalsHIR';
import {createTemporaryPlace, markInstructionIds} from '../HIR/HIRBuilder';
import {BuiltInPropsId} from '../HIR/ObjectShape';
import {retainWhere} from '../Utils/utils';

export function inlineSingleReturnJSX(fn: HIRFunction): void {
  if (fn.fnType !== 'Component') {
    // This optimization only applies to function components
    return;
  }
  const returnValues: Array<Place> = [];
  for (const [, block] of fn.body.blocks) {
    if (block.terminal.kind === 'return') {
      returnValues.push(block.terminal.value);
    }
  }
  if (returnValues.length !== 1) {
    /*
     * This optimization only applies if the component always returns
     * the same element, multiple returns are rarely the same element.
     * Note that in theory you could return the same tag+props+children
     * in two different places, but that's pretty strange and not worth
     * optimizing for.
     */
    return;
  }
  const returnValue = returnValues[0]!;
  const scopes: Array<{start: BlockId; end: BlockId; scope: ReactiveScope}> =
    [];
  for (const [, block] of fn.body.blocks) {
    retainWhere(scopes, scope => scope.end !== block.id);
    let nextInstructions: Array<Instruction> | null = null;
    for (let i = 0; i < block.instructions.length; i++) {
      const instr = block.instructions[i]!;
      if (instr.lvalue.identifier.id !== returnValue.identifier.id) {
        if (nextInstructions !== null) {
          nextInstructions.push(instr);
        }
        continue;
      }
      const value = instr.value;

      if (
        value.kind !== 'JsxExpression' ||
        value.tag.kind !== 'Identifier' ||
        value.tag.reactive ||
        value.props.some(
          prop =>
            prop.kind === 'JsxAttribute' &&
            prop.name === 'key' &&
            prop.place.reactive,
        ) ||
        scopes.length !== 1
        /*
         * ||
         * scopes[0].scope.reassignments.size !== 0 ||
         * scopes[0].scope.declarations.size !== 1 ||
         * !Iterable_some(
         *   scopes[0].scope.declarations.values(),
         *   decl => decl.identifier.id === returnValue.identifier.id,
         * ) ||
         * !isFunctionComponentType(value.tag.identifier)
         */
      ) {
        return;
      }

      const scopeStart = fn.body.blocks.get(scopes[0].start)!;
      CompilerError.invariant(
        scopeStart.terminal.kind === 'scope' ||
          scopeStart.terminal.kind === 'pruned-scope',
        {
          reason: 'wip',
          loc: scopeStart.terminal.loc,
        },
      );
      scopeStart.terminal = {
        kind: 'label',
        block: scopeStart.terminal.block,
        fallthrough: scopeStart.terminal.fallthrough,
        id: scopeStart.terminal.id,
        loc: scopeStart.terminal.loc,
      };

      nextInstructions ??= block.instructions.slice(0, i);
      const propsTemp = createTemporaryPlace(fn.env, value.loc);
      propsTemp.effect = Effect.Freeze;
      propsTemp.identifier.type = {kind: 'Object', shapeId: BuiltInPropsId};

      const properties: Array<ObjectProperty | SpreadPattern> = [];
      value.props.forEach(attr => {
        if (attr.kind === 'JsxAttribute') {
          if (attr.name === 'key') {
            return;
          }
          properties.push({
            kind: 'ObjectProperty',
            key: {
              kind: 'identifier',
              name: attr.name,
            },
            place: attr.place,
            type: 'property',
          } satisfies ObjectProperty);
        } else {
          properties.push({
            kind: 'Spread',
            place: attr.argument,
          } satisfies SpreadPattern);
        }
      });
      if (value.children !== null) {
        if (value.children.length === 1) {
          properties.push({
            kind: 'ObjectProperty',
            key: {
              kind: 'identifier',
              name: 'children',
            },
            place: {...value.children[0]!},
            type: 'property',
          });
        } else {
          const childrenTemp = createTemporaryPlace(fn.env, value.loc);
          childrenTemp.effect = Effect.Freeze;
          nextInstructions.push({
            id: makeInstructionId(0),
            lvalue: {...childrenTemp},
            value: {
              kind: 'ArrayExpression',
              elements: value.children,
              loc: value.loc,
            },
            loc: value.loc,
          });
          properties.push({
            kind: 'ObjectProperty',
            key: {
              kind: 'identifier',
              name: 'children',
            },
            place: {...childrenTemp},
            type: 'property',
          });
        }
      }

      nextInstructions.push({
        id: makeInstructionId(0),
        lvalue: {...propsTemp},
        value: {
          kind: 'ObjectExpression',
          properties,
          loc: value.loc,
        },
        loc: value.loc,
      });
      nextInstructions.push({
        id: makeInstructionId(0),
        lvalue: instr.lvalue,
        value: {
          kind: 'CallExpression',
          callee: {...value.tag},
          args: [{...propsTemp}],
          loc: value.loc,
        },
        loc: value.loc,
      });
    }
    if (nextInstructions !== null) {
      block.instructions = nextInstructions;
    }
    if (
      block.terminal.kind === 'scope' ||
      block.terminal.kind === 'pruned-scope'
    ) {
      scopes.push({
        start: block.id,
        end: block.terminal.fallthrough,
        scope: block.terminal.scope,
      });
    }
  }

  markInstructionIds(fn.body);
  updateScopeRangesAfterRenumberingInstructions(fn);
}
