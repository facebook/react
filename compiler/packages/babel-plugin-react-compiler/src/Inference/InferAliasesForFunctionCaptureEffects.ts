/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {HIRFunction, Identifier} from '../HIR/HIR';
import DisjointSet from '../Utils/DisjointSet';

export function inferAliasForFunctionCaptureEffects(
  func: HIRFunction,
  aliases: DisjointSet<Identifier>,
): void {
  for (const [_, block] of func.body.blocks) {
    for (const instr of block.instructions) {
      const {value} = instr;
      if (
        value.kind !== 'FunctionExpression' &&
        value.kind !== 'ObjectMethod'
      ) {
        continue;
      }
      const loweredFunction = value.loweredFunc.func;
      for (const effect of loweredFunction.effects ?? []) {
        if (effect.kind !== 'CaptureEffect') {
          continue;
        }
        aliases.union([...effect.places].map(place => place.identifier));
      }
    }
  }
}
