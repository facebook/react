/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  HIRFunction,
  Instruction,
  makeIdentifierId,
  makeInstructionId,
} from '../HIR';
import {createTemporaryPlace, markInstructionIds} from '../HIR/HIRBuilder';

export function inlineJsxTransform(fn: HIRFunction): void {
  for (const [, block] of fn.body.blocks) {
    let nextInstructions: Array<Instruction> | null = null;
    for (let i = 0; i < block.instructions.length; i++) {
      const instr = block.instructions[i]!;
      switch (instr.value.kind) {
        case 'JsxExpression': {
          nextInstructions ??= block.instructions.slice(0, i);
          const innerObject = createTemporaryPlace(fn.env, instr.value.loc);
          nextInstructions.push({
            id: makeInstructionId(0),
            lvalue: {...innerObject},
            value: {
              kind: 'ObjectExpression',
              properties: [],
              loc: instr.value.loc,
            },
            loc: instr.loc,
          });
          const outerObject = createTemporaryPlace(fn.env, instr.value.loc);
          nextInstructions.push({
            id: makeInstructionId(0),
            lvalue: {...outerObject},
            value: {
              kind: 'ObjectExpression',
              properties: [
                {
                  kind: 'ObjectProperty',
                  key: {kind: 'string', name: 'inner'},
                  type: 'property',
                  place: {...innerObject},
                },
              ],
              loc: instr.value.loc,
            },
            loc: instr.loc,
          });
          // above creates
          // {
          //   inner: {}
          // }
          // don't emit the `instr`, create new instructions and push to nextInstructions
          break;
        }
        case 'JsxFragment': {
          nextInstructions ??= block.instructions.slice(0, i);
          // similar to above
          // don't emit the `instr`, create new instructions and push to nextInstructions
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
  // TODO: fixup instruction ids, mutable ranges, etc
  markInstructionIds(fn.body);
}
