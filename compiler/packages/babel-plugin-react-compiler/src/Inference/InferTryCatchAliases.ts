/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {BlockId, HIRFunction, Identifier} from '../HIR';
import DisjointSet from '../Utils/DisjointSet';

/*
 * Any values created within a try/catch block could be aliased to the try handler.
 * Our lowering ensures that every instruction within a try block will be lowered into a
 * basic block ending in a maybe-throw terminal that points to its catch block, so we can
 * iterate such blocks and alias their instruction lvalues to the handler's param (if present).
 */
export function inferTryCatchAliases(
  fn: HIRFunction,
  aliases: DisjointSet<Identifier>,
): void {
  const handlerParams: Map<BlockId, Identifier> = new Map();
  for (const [_, block] of fn.body.blocks) {
    if (
      block.terminal.kind === 'try' &&
      block.terminal.handlerBinding !== null
    ) {
      handlerParams.set(
        block.terminal.handler,
        block.terminal.handlerBinding.identifier,
      );
    } else if (block.terminal.kind === 'maybe-throw') {
      const handlerParam = handlerParams.get(block.terminal.handler);
      if (handlerParam === undefined) {
        /*
         * There's no catch clause param, nothing to alias to so
         * skip this block
         */
        continue;
      }
      /*
       * Otherwise alias all values created in this block to the
       * catch clause param
       */
      for (const instr of block.instructions) {
        aliases.union([handlerParam, instr.lvalue.identifier]);
      }
    }
  }
}
