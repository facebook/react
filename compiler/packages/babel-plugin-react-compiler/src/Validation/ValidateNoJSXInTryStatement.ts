/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity} from '..';
import {BlockId, HIRFunction} from '../HIR';
import {retainWhere} from '../Utils/utils';

/**
 * Developers may not be aware of error boundaries and lazy evaluation of JSX, leading them
 * to use patterns such as `let el; try { el = <Component /> } catch { ... }` to attempt to
 * catch rendering errors. Such code will fail to catch errors in rendering, but developers
 * may not realize this right away.
 *
 * This validation pass validates against this pattern: specifically, it errors for JSX
 * created within a try block. JSX is allowed within a catch statement, unless that catch
 * is itself nested inside an outer try.
 */
export function validateNoJSXInTryStatement(fn: HIRFunction): void {
  const activeTryBlocks: Array<BlockId> = [];
  const errors = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    retainWhere(activeTryBlocks, id => id !== block.id);

    if (activeTryBlocks.length !== 0) {
      for (const instr of block.instructions) {
        const {value} = instr;
        switch (value.kind) {
          case 'JsxExpression':
          case 'JsxFragment': {
            errors.push({
              severity: ErrorSeverity.InvalidReact,
              reason: `Unexpected JSX element within a try statement. To catch errors in rendering a given component, wrap that component in an error boundary. (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)`,
              loc: value.loc,
            });
            break;
          }
        }
      }
    }

    if (block.terminal.kind === 'try') {
      activeTryBlocks.push(block.terminal.handler);
    }
  }
  if (errors.hasErrors()) {
    throw errors;
  }
}
