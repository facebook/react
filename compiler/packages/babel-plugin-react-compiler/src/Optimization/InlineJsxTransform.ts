/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BuiltinTag,
  Effect,
  HIRFunction,
  Instruction,
  JsxAttribute,
  makeInstructionId,
  ObjectProperty,
  Place,
  SpreadPattern,
} from '../HIR';
import {
  createTemporaryPlace,
  fixScopeAndIdentifierRanges,
  markInstructionIds,
  markPredecessors,
  reversePostorderBlocks,
} from '../HIR/HIRBuilder';

function createSymbolProperty(
  fn: HIRFunction,
  instr: Instruction,
  nextInstructions: Array<Instruction>,
  propertyName: string,
  symbolName: string,
): ObjectProperty {
  const symbolPlace = createTemporaryPlace(fn.env, instr.value.loc);
  const symbolInstruction: Instruction = {
    id: makeInstructionId(0),
    lvalue: {...symbolPlace, effect: Effect.Mutate},
    value: {
      kind: 'LoadGlobal',
      binding: {kind: 'Global', name: 'Symbol'},
      loc: instr.value.loc,
    },
    loc: instr.loc,
  };
  nextInstructions.push(symbolInstruction);

  const symbolForPlace = createTemporaryPlace(fn.env, instr.value.loc);
  const symbolForInstruction: Instruction = {
    id: makeInstructionId(0),
    lvalue: {...symbolForPlace, effect: Effect.Read},
    value: {
      kind: 'PropertyLoad',
      object: {...symbolInstruction.lvalue},
      property: 'for',
      loc: instr.value.loc,
    },
    loc: instr.loc,
  };
  nextInstructions.push(symbolForInstruction);

  const symbolValuePlace = createTemporaryPlace(fn.env, instr.value.loc);
  const symbolValueInstruction: Instruction = {
    id: makeInstructionId(0),
    lvalue: {...symbolValuePlace, effect: Effect.Mutate},
    value: {
      kind: 'Primitive',
      value: symbolName,
      loc: instr.value.loc,
    },
    loc: instr.loc,
  };
  nextInstructions.push(symbolValueInstruction);

  const $$typeofPlace = createTemporaryPlace(fn.env, instr.value.loc);
  const $$typeofInstruction: Instruction = {
    id: makeInstructionId(0),
    lvalue: {...$$typeofPlace, effect: Effect.Mutate},
    value: {
      kind: 'MethodCall',
      receiver: symbolInstruction.lvalue,
      property: symbolForInstruction.lvalue,
      args: [symbolValueInstruction.lvalue],
      loc: instr.value.loc,
    },
    loc: instr.loc,
  };
  const $$typeofProperty: ObjectProperty = {
    kind: 'ObjectProperty',
    key: {name: propertyName, kind: 'string'},
    type: 'property',
    place: {...$$typeofPlace, effect: Effect.Capture},
  };
  nextInstructions.push($$typeofInstruction);
  return $$typeofProperty;
}

function createTagProperty(
  fn: HIRFunction,
  instr: Instruction,
  nextInstructions: Array<Instruction>,
  componentTag: BuiltinTag | Place,
): ObjectProperty {
  let tagProperty: ObjectProperty;
  switch (componentTag.kind) {
    case 'BuiltinTag': {
      const tagPropertyPlace = createTemporaryPlace(fn.env, instr.value.loc);
      const tagInstruction: Instruction = {
        id: makeInstructionId(0),
        lvalue: {...tagPropertyPlace, effect: Effect.Mutate},
        value: {
          kind: 'Primitive',
          value: componentTag.name,
          loc: instr.value.loc,
        },
        loc: instr.loc,
      };
      tagProperty = {
        kind: 'ObjectProperty',
        key: {name: 'type', kind: 'string'},
        type: 'property',
        place: {...tagPropertyPlace, effect: Effect.Capture},
      };
      nextInstructions.push(tagInstruction);
      break;
    }
    case 'Identifier': {
      tagProperty = {
        kind: 'ObjectProperty',
        key: {name: 'type', kind: 'string'},
        type: 'property',
        place: {...componentTag, effect: Effect.Capture},
      };
      break;
    }
  }

  return tagProperty;
}

function createPropsProperties(
  fn: HIRFunction,
  instr: Instruction,
  nextInstructions: Array<Instruction>,
  propAttributes: Array<JsxAttribute>,
  children: Array<Place> | null,
): {
  refProperty: ObjectProperty;
  keyProperty: ObjectProperty;
  propsProperty: ObjectProperty;
} {
  let refProperty: ObjectProperty | undefined;
  let keyProperty: ObjectProperty | undefined;
  const props: Array<ObjectProperty | SpreadPattern> = [];
  propAttributes.forEach(prop => {
    switch (prop.kind) {
      case 'JsxAttribute': {
        if (prop.name === 'ref') {
          refProperty = {
            kind: 'ObjectProperty',
            key: {name: 'ref', kind: 'string'},
            type: 'property',
            place: {...prop.place},
          };
        } else if (prop.name === 'key') {
          keyProperty = {
            kind: 'ObjectProperty',
            key: {name: 'key', kind: 'string'},
            type: 'property',
            place: {...prop.place},
          };
        } else {
          const attributeProperty: ObjectProperty = {
            kind: 'ObjectProperty',
            key: {name: prop.name, kind: 'string'},
            type: 'property',
            place: {...prop.place},
          };
          props.push(attributeProperty);
        }
        break;
      }
      case 'JsxSpreadAttribute': {
        // TODO: Optimize spreads to pass object directly if none of its properties are mutated
        props.push({
          kind: 'Spread',
          place: {...prop.argument},
        });
        break;
      }
    }
  });
  const propsPropertyPlace = createTemporaryPlace(fn.env, instr.value.loc);
  if (children) {
    let childrenPropProperty: ObjectProperty;
    if (children.length === 1) {
      childrenPropProperty = {
        kind: 'ObjectProperty',
        key: {name: 'children', kind: 'string'},
        type: 'property',
        place: {...children[0], effect: Effect.Capture},
      };
    } else {
      const childrenPropPropertyPlace = createTemporaryPlace(
        fn.env,
        instr.value.loc,
      );

      const childrenPropInstruction: Instruction = {
        id: makeInstructionId(0),
        lvalue: {...childrenPropPropertyPlace, effect: Effect.Mutate},
        value: {
          kind: 'ArrayExpression',
          elements: [...children],
          loc: instr.value.loc,
        },
        loc: instr.loc,
      };
      nextInstructions.push(childrenPropInstruction);
      childrenPropProperty = {
        kind: 'ObjectProperty',
        key: {name: 'children', kind: 'string'},
        type: 'property',
        place: {...childrenPropPropertyPlace, effect: Effect.Capture},
      };
    }
    props.push(childrenPropProperty);
  }

  if (refProperty == null) {
    const refPropertyPlace = createTemporaryPlace(fn.env, instr.value.loc);
    const refInstruction: Instruction = {
      id: makeInstructionId(0),
      lvalue: {...refPropertyPlace, effect: Effect.Mutate},
      value: {
        kind: 'Primitive',
        value: null,
        loc: instr.value.loc,
      },
      loc: instr.loc,
    };
    refProperty = {
      kind: 'ObjectProperty',
      key: {name: 'ref', kind: 'string'},
      type: 'property',
      place: {...refPropertyPlace, effect: Effect.Capture},
    };
    nextInstructions.push(refInstruction);
  }

  if (keyProperty == null) {
    const keyPropertyPlace = createTemporaryPlace(fn.env, instr.value.loc);
    const keyInstruction: Instruction = {
      id: makeInstructionId(0),
      lvalue: {...keyPropertyPlace, effect: Effect.Mutate},
      value: {
        kind: 'Primitive',
        value: null,
        loc: instr.value.loc,
      },
      loc: instr.loc,
    };
    keyProperty = {
      kind: 'ObjectProperty',
      key: {name: 'key', kind: 'string'},
      type: 'property',
      place: {...keyPropertyPlace, effect: Effect.Capture},
    };
    nextInstructions.push(keyInstruction);
  }

  const propsInstruction: Instruction = {
    id: makeInstructionId(0),
    lvalue: {...propsPropertyPlace, effect: Effect.Mutate},
    value: {
      kind: 'ObjectExpression',
      properties: props,
      loc: instr.value.loc,
    },
    loc: instr.loc,
  };
  const propsProperty: ObjectProperty = {
    kind: 'ObjectProperty',
    key: {name: 'props', kind: 'string'},
    type: 'property',
    place: {...propsPropertyPlace, effect: Effect.Capture},
  };
  nextInstructions.push(propsInstruction);
  return {refProperty, keyProperty, propsProperty};
}

// TODO: Make PROD only with conditional statements
export function inlineJsxTransform(fn: HIRFunction): void {
  for (const [, block] of fn.body.blocks) {
    let nextInstructions: Array<Instruction> | null = null;
    for (let i = 0; i < block.instructions.length; i++) {
      const instr = block.instructions[i]!;
      switch (instr.value.kind) {
        case 'JsxExpression': {
          nextInstructions ??= block.instructions.slice(0, i);

          const {refProperty, keyProperty, propsProperty} =
            createPropsProperties(
              fn,
              instr,
              nextInstructions,
              instr.value.props,
              instr.value.children,
            );
          const reactElementInstruction: Instruction = {
            id: makeInstructionId(0),
            lvalue: {...instr.lvalue, effect: Effect.Store},
            value: {
              kind: 'ObjectExpression',
              properties: [
                createSymbolProperty(
                  fn,
                  instr,
                  nextInstructions,
                  '$$typeof',
                  /**
                   * TODO: Add this to config so we can switch between
                   * react.element / react.transitional.element
                   */
                  'react.transitional.element',
                ),
                createTagProperty(fn, instr, nextInstructions, instr.value.tag),
                refProperty,
                keyProperty,
                propsProperty,
              ],
              loc: instr.value.loc,
            },
            loc: instr.loc,
          };
          nextInstructions.push(reactElementInstruction);

          break;
        }
        case 'JsxFragment': {
          nextInstructions ??= block.instructions.slice(0, i);
          const {refProperty, keyProperty, propsProperty} =
            createPropsProperties(
              fn,
              instr,
              nextInstructions,
              [],
              instr.value.children,
            );
          const reactElementInstruction: Instruction = {
            id: makeInstructionId(0),
            lvalue: {...instr.lvalue, effect: Effect.Store},
            value: {
              kind: 'ObjectExpression',
              properties: [
                createSymbolProperty(
                  fn,
                  instr,
                  nextInstructions,
                  '$$typeof',
                  /**
                   * TODO: Add this to config so we can switch between
                   * react.element / react.transitional.element
                   */
                  'react.transitional.element',
                ),
                createSymbolProperty(
                  fn,
                  instr,
                  nextInstructions,
                  'type',
                  'react.fragment',
                ),
                refProperty,
                keyProperty,
                propsProperty,
              ],
              loc: instr.value.loc,
            },
            loc: instr.loc,
          };
          nextInstructions.push(reactElementInstruction);
          break;
        }
        default: {
          if (nextInstructions !== null) {
            nextInstructions.push(instr);
          }
        }
      }
    }
    if (nextInstructions !== null) {
      block.instructions = nextInstructions;
    }
  }

  // Fixup the HIR to restore RPO, ensure correct predecessors, and renumber instructions.
  reversePostorderBlocks(fn.body);
  markPredecessors(fn.body);
  markInstructionIds(fn.body);
  // The renumbering instructions invalidates scope and identifier ranges
  fixScopeAndIdentifierRanges(fn.body);
}
