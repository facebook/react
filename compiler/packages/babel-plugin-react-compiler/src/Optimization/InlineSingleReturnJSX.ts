/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BlockId,
  Effect,
  HIRFunction,
  Instruction,
  isFunctionComponentType,
  makeInstructionId,
  ObjectProperty,
  Place,
  SpreadPattern,
} from '../HIR';
import {createTemporaryPlace, markInstructionIds} from '../HIR/HIRBuilder';
import {BuiltInPropsId} from '../HIR/ObjectShape';

export function inlineSingleReturnJSX(fn: HIRFunction): void {
  if (fn.fnType !== 'Component') {
    // This optimization only applies to function components
    return;
  }
  const returnValues: Array<{block: BlockId; place: Place}> = [];
  for (const [, block] of fn.body.blocks) {
    if (block.terminal.kind === 'return') {
      returnValues.push({
        block: block.id,
        place: block.terminal.value,
      });
    }
  }
  if (returnValues.length !== 1) {
    // This optimization only applies if the component always returns
    // the same element, multiple returns are rarely the same element.
    // Note that in theory you could return the same tag+props+children
    // in two different places, but that's pretty strange and not worth
    // optimizing for.
    return;
  }
  const returnValue = returnValues[0]!;
  const returnBlock = fn.body.blocks.get(returnValue.block)!;
  let nextInstructions: Array<Instruction> | null = null;
  for (let i = 0; i < returnBlock.instructions.length; i++) {
    const instr = returnBlock.instructions[i]!;
    if (instr.lvalue.identifier.id !== returnValue.place.identifier.id) {
      if (nextInstructions !== null) {
        nextInstructions.push(instr);
      }
      continue;
    }
    const value = instr.value;

    if (
      value.kind !== 'JsxExpression' ||
      value.tag.kind !== 'Identifier' ||
      value.tag.reactive
      // || isFunctionComponentType(value.tag.identifier)
    ) {
      return;
    }

    nextInstructions ??= returnBlock.instructions.slice(0, i);
    const propsTemp = createTemporaryPlace(fn.env, value.loc);
    propsTemp.effect = Effect.Freeze;
    propsTemp.identifier.type = {kind: 'Object', shapeId: BuiltInPropsId};

    const properties: Array<ObjectProperty | SpreadPattern> = value.props.map(
      attr => {
        if (attr.kind === 'JsxAttribute') {
          return {
            kind: 'ObjectProperty',
            key: {
              kind: 'identifier',
              name: attr.name,
            },
            place: attr.place,
            type: 'property',
          } satisfies ObjectProperty;
        } else {
          return {
            kind: 'Spread',
            place: attr.argument,
          } satisfies SpreadPattern;
        }
      },
    );
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
    returnBlock.instructions = nextInstructions;
  }

  markInstructionIds(fn.body);
}
