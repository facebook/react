/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  BasicBlock,
  BlockId,
  BuiltinTag,
  DeclarationId,
  Effect,
  forkTemporaryIdentifier,
  GotoTerminal,
  GotoVariant,
  HIRFunction,
  Identifier,
  IfTerminal,
  Instruction,
  InstructionKind,
  JsxAttribute,
  makeInstructionId,
  ObjectProperty,
  Phi,
  Place,
  promoteTemporary,
  SpreadPattern,
} from '../HIR';
import {
  createTemporaryPlace,
  fixScopeAndIdentifierRanges,
  markInstructionIds,
  markPredecessors,
  reversePostorderBlocks,
} from '../HIR/HIRBuilder';
import {CompilerError, EnvironmentConfig} from '..';
import {
  mapInstructionLValues,
  mapInstructionOperands,
  mapInstructionValueOperands,
  mapTerminalOperands,
} from '../HIR/visitors';

type InlinedJsxDeclarationMap = Map<
  DeclarationId,
  {identifier: Identifier; blockIdsToIgnore: Set<BlockId>}
>;

/**
 * A prod-only, RN optimization to replace JSX with inlined ReactElement object literals
 *
 * Example:
 * <>foo</>
 * _______________
 * let t1;
 * if (__DEV__) {
 *   t1 = <>foo</>
 * } else {
 *   t1 = {...}
 * }
 *
 */
export function inlineJsxTransform(
  fn: HIRFunction,
  inlineJsxTransformConfig: NonNullable<
    EnvironmentConfig['inlineJsxTransform']
  >,
): void {
  const inlinedJsxDeclarations: InlinedJsxDeclarationMap = new Map();
  /**
   * Step 1: Codegen the conditional and ReactElement object literal
   */
  for (const [_, currentBlock] of [...fn.body.blocks]) {
    let fallthroughBlockInstructions: Array<Instruction> | null = null;
    const instructionCount = currentBlock.instructions.length;
    for (let i = 0; i < instructionCount; i++) {
      const instr = currentBlock.instructions[i]!;
      // TODO: Support value blocks
      if (currentBlock.kind === 'value') {
        fn.env.logger?.logEvent(fn.env.filename, {
          kind: 'CompileDiagnostic',
          fnLoc: null,
          detail: {
            reason: 'JSX Inlining is not supported on value blocks',
            loc: instr.loc,
          },
        });
        continue;
      }
      switch (instr.value.kind) {
        case 'JsxExpression':
        case 'JsxFragment': {
          /**
           * Split into blocks for new IfTerminal:
           *   current, then, else, fallthrough
           */
          const currentBlockInstructions = currentBlock.instructions.slice(
            0,
            i,
          );
          const thenBlockInstructions = currentBlock.instructions.slice(
            i,
            i + 1,
          );
          const elseBlockInstructions: Array<Instruction> = [];
          fallthroughBlockInstructions ??= currentBlock.instructions.slice(
            i + 1,
          );

          const fallthroughBlockId = fn.env.nextBlockId;
          const fallthroughBlock: BasicBlock = {
            kind: currentBlock.kind,
            id: fallthroughBlockId,
            instructions: fallthroughBlockInstructions,
            terminal: currentBlock.terminal,
            preds: new Set(),
            phis: new Set(),
          };

          /**
           * Complete current block
           * - Add instruction for variable declaration
           * - Add instruction for LoadGlobal used by conditional
           * - End block with a new IfTerminal
           */
          const varPlace = createTemporaryPlace(fn.env, instr.value.loc);
          promoteTemporary(varPlace.identifier);
          const varLValuePlace = createTemporaryPlace(fn.env, instr.value.loc);
          const thenVarPlace = {
            ...varPlace,
            identifier: forkTemporaryIdentifier(
              fn.env.nextIdentifierId,
              varPlace.identifier,
            ),
          };
          const elseVarPlace = {
            ...varPlace,
            identifier: forkTemporaryIdentifier(
              fn.env.nextIdentifierId,
              varPlace.identifier,
            ),
          };
          const varInstruction: Instruction = {
            id: makeInstructionId(0),
            lvalue: {...varLValuePlace},
            value: {
              kind: 'DeclareLocal',
              lvalue: {place: {...varPlace}, kind: InstructionKind.Let},
              type: null,
              loc: instr.value.loc,
            },
            loc: instr.loc,
          };
          currentBlockInstructions.push(varInstruction);

          const devGlobalPlace = createTemporaryPlace(fn.env, instr.value.loc);
          const devGlobalInstruction: Instruction = {
            id: makeInstructionId(0),
            lvalue: {...devGlobalPlace, effect: Effect.Mutate},
            value: {
              kind: 'LoadGlobal',
              binding: {
                kind: 'Global',
                name: inlineJsxTransformConfig.globalDevVar,
              },
              loc: instr.value.loc,
            },
            loc: instr.loc,
          };
          currentBlockInstructions.push(devGlobalInstruction);
          const thenBlockId = fn.env.nextBlockId;
          const elseBlockId = fn.env.nextBlockId;
          const ifTerminal: IfTerminal = {
            kind: 'if',
            test: {...devGlobalPlace, effect: Effect.Read},
            consequent: thenBlockId,
            alternate: elseBlockId,
            fallthrough: fallthroughBlockId,
            loc: instr.loc,
            id: makeInstructionId(0),
          };
          currentBlock.instructions = currentBlockInstructions;
          currentBlock.terminal = ifTerminal;

          /**
           * Set up then block where we put the original JSX return
           */
          const thenBlock: BasicBlock = {
            id: thenBlockId,
            instructions: thenBlockInstructions,
            kind: 'block',
            phis: new Set(),
            preds: new Set(),
            terminal: {
              kind: 'goto',
              block: fallthroughBlockId,
              variant: GotoVariant.Break,
              id: makeInstructionId(0),
              loc: instr.loc,
            },
          };
          fn.body.blocks.set(thenBlockId, thenBlock);

          const resassignElsePlace = createTemporaryPlace(
            fn.env,
            instr.value.loc,
          );
          const reassignElseInstruction: Instruction = {
            id: makeInstructionId(0),
            lvalue: {...resassignElsePlace},
            value: {
              kind: 'StoreLocal',
              lvalue: {
                place: elseVarPlace,
                kind: InstructionKind.Reassign,
              },
              value: {...instr.lvalue},
              type: null,
              loc: instr.value.loc,
            },
            loc: instr.loc,
          };
          thenBlockInstructions.push(reassignElseInstruction);

          /**
           * Set up else block where we add new codegen
           */
          const elseBlockTerminal: GotoTerminal = {
            kind: 'goto',
            block: fallthroughBlockId,
            variant: GotoVariant.Break,
            id: makeInstructionId(0),
            loc: instr.loc,
          };
          const elseBlock: BasicBlock = {
            id: elseBlockId,
            instructions: elseBlockInstructions,
            kind: 'block',
            phis: new Set(),
            preds: new Set(),
            terminal: elseBlockTerminal,
          };
          fn.body.blocks.set(elseBlockId, elseBlock);

          /**
           * ReactElement object literal codegen
           */
          const {refProperty, keyProperty, propsProperty} =
            createPropsProperties(
              fn,
              instr,
              elseBlockInstructions,
              instr.value.kind === 'JsxExpression' ? instr.value.props : [],
              instr.value.children,
            );
          const reactElementInstructionPlace = createTemporaryPlace(
            fn.env,
            instr.value.loc,
          );
          const reactElementInstruction: Instruction = {
            id: makeInstructionId(0),
            lvalue: {...reactElementInstructionPlace, effect: Effect.Store},
            value: {
              kind: 'ObjectExpression',
              properties: [
                createSymbolProperty(
                  fn,
                  instr,
                  elseBlockInstructions,
                  '$$typeof',
                  inlineJsxTransformConfig.elementSymbol,
                ),
                instr.value.kind === 'JsxExpression'
                  ? createTagProperty(
                      fn,
                      instr,
                      elseBlockInstructions,
                      instr.value.tag,
                    )
                  : createSymbolProperty(
                      fn,
                      instr,
                      elseBlockInstructions,
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
          elseBlockInstructions.push(reactElementInstruction);

          const reassignConditionalInstruction: Instruction = {
            id: makeInstructionId(0),
            lvalue: {...createTemporaryPlace(fn.env, instr.value.loc)},
            value: {
              kind: 'StoreLocal',
              lvalue: {
                place: {...elseVarPlace},
                kind: InstructionKind.Reassign,
              },
              value: {...reactElementInstruction.lvalue},
              type: null,
              loc: instr.value.loc,
            },
            loc: instr.loc,
          };
          elseBlockInstructions.push(reassignConditionalInstruction);

          /**
           * Create phis to reassign the var
           */
          const operands: Map<BlockId, Place> = new Map();
          operands.set(thenBlockId, {
            ...elseVarPlace,
          });
          operands.set(elseBlockId, {
            ...thenVarPlace,
          });

          const phiIdentifier = forkTemporaryIdentifier(
            fn.env.nextIdentifierId,
            varPlace.identifier,
          );
          const phiPlace = {
            ...createTemporaryPlace(fn.env, instr.value.loc),
            identifier: phiIdentifier,
          };
          const phis: Set<Phi> = new Set([
            {
              kind: 'Phi',
              operands,
              place: phiPlace,
            },
          ]);
          fallthroughBlock.phis = phis;
          fn.body.blocks.set(fallthroughBlockId, fallthroughBlock);

          /**
           * Track this JSX instruction so we can replace references in step 2
           */
          inlinedJsxDeclarations.set(instr.lvalue.identifier.declarationId, {
            identifier: phiIdentifier,
            blockIdsToIgnore: new Set([thenBlockId, elseBlockId]),
          });
          break;
        }
        case 'FunctionExpression':
        case 'ObjectMethod': {
          inlineJsxTransform(
            instr.value.loweredFunc.func,
            inlineJsxTransformConfig,
          );
          break;
        }
      }
    }
  }

  /**
   * Step 2: Replace declarations with new phi values
   */
  for (const [blockId, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      mapInstructionOperands(instr, place =>
        handlePlace(place, blockId, inlinedJsxDeclarations),
      );

      mapInstructionLValues(instr, lvalue =>
        handlelValue(lvalue, blockId, inlinedJsxDeclarations),
      );

      mapInstructionValueOperands(instr.value, place =>
        handlePlace(place, blockId, inlinedJsxDeclarations),
      );
    }

    mapTerminalOperands(block.terminal, place =>
      handlePlace(place, blockId, inlinedJsxDeclarations),
    );

    if (block.terminal.kind === 'scope') {
      const scope = block.terminal.scope;
      for (const dep of scope.dependencies) {
        dep.identifier = handleIdentifier(
          dep.identifier,
          inlinedJsxDeclarations,
        );
      }

      for (const [origId, decl] of [...scope.declarations]) {
        const newDecl = handleIdentifier(
          decl.identifier,
          inlinedJsxDeclarations,
        );
        if (newDecl.id !== origId) {
          scope.declarations.delete(origId);
          scope.declarations.set(decl.identifier.id, {
            identifier: newDecl,
            scope: decl.scope,
          });
        }
      }
    }
  }

  /**
   * Step 3: Fixup the HIR
   * Restore RPO, ensure correct predecessors, renumber instructions, fix scope and ranges.
   */
  reversePostorderBlocks(fn.body);
  markPredecessors(fn.body);
  markInstructionIds(fn.body);
  fixScopeAndIdentifierRanges(fn.body);
}

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
  const jsxAttributesWithoutKey = propAttributes.filter(
    p => p.kind === 'JsxAttribute' && p.name !== 'key',
  );
  const jsxSpreadAttributes = propAttributes.filter(
    p => p.kind === 'JsxSpreadAttribute',
  );
  const spreadPropsOnly =
    jsxAttributesWithoutKey.length === 0 && jsxSpreadAttributes.length === 1;
  propAttributes.forEach(prop => {
    switch (prop.kind) {
      case 'JsxAttribute': {
        switch (prop.name) {
          case 'key': {
            keyProperty = {
              kind: 'ObjectProperty',
              key: {name: 'key', kind: 'string'},
              type: 'property',
              place: {...prop.place},
            };
            break;
          }
          case 'ref': {
            /**
             * In the current JSX implementation, ref is both
             * a property on the element and a property on props.
             */
            refProperty = {
              kind: 'ObjectProperty',
              key: {name: 'ref', kind: 'string'},
              type: 'property',
              place: {...prop.place},
            };
            const refPropProperty: ObjectProperty = {
              kind: 'ObjectProperty',
              key: {name: 'ref', kind: 'string'},
              type: 'property',
              place: {...prop.place},
            };
            props.push(refPropProperty);
            break;
          }
          default: {
            const attributeProperty: ObjectProperty = {
              kind: 'ObjectProperty',
              key: {name: prop.name, kind: 'string'},
              type: 'property',
              place: {...prop.place},
            };
            props.push(attributeProperty);
          }
        }
        break;
      }
      case 'JsxSpreadAttribute': {
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

  let propsProperty: ObjectProperty;
  if (spreadPropsOnly) {
    const spreadProp = jsxSpreadAttributes[0];
    CompilerError.invariant(spreadProp.kind === 'JsxSpreadAttribute', {
      reason: 'Spread prop attribute must be of kind JSXSpreadAttribute',
      loc: instr.loc,
    });
    propsProperty = {
      kind: 'ObjectProperty',
      key: {name: 'props', kind: 'string'},
      type: 'property',
      place: {...spreadProp.argument, effect: Effect.Mutate},
    };
  } else {
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
    propsProperty = {
      kind: 'ObjectProperty',
      key: {name: 'props', kind: 'string'},
      type: 'property',
      place: {...propsPropertyPlace, effect: Effect.Capture},
    };
    nextInstructions.push(propsInstruction);
  }

  return {refProperty, keyProperty, propsProperty};
}

function handlePlace(
  place: Place,
  blockId: BlockId,
  inlinedJsxDeclarations: InlinedJsxDeclarationMap,
): Place {
  const inlinedJsxDeclaration = inlinedJsxDeclarations.get(
    place.identifier.declarationId,
  );
  if (
    inlinedJsxDeclaration == null ||
    inlinedJsxDeclaration.blockIdsToIgnore.has(blockId)
  ) {
    return place;
  }

  return {...place, identifier: inlinedJsxDeclaration.identifier};
}

function handlelValue(
  lvalue: Place,
  blockId: BlockId,
  inlinedJsxDeclarations: InlinedJsxDeclarationMap,
): Place {
  const inlinedJsxDeclaration = inlinedJsxDeclarations.get(
    lvalue.identifier.declarationId,
  );
  if (
    inlinedJsxDeclaration == null ||
    inlinedJsxDeclaration.blockIdsToIgnore.has(blockId)
  ) {
    return lvalue;
  }

  return {...lvalue, identifier: inlinedJsxDeclaration.identifier};
}

function handleIdentifier(
  identifier: Identifier,
  inlinedJsxDeclarations: InlinedJsxDeclarationMap,
): Identifier {
  const inlinedJsxDeclaration = inlinedJsxDeclarations.get(
    identifier.declarationId,
  );
  return inlinedJsxDeclaration == null
    ? identifier
    : inlinedJsxDeclaration.identifier;
}
