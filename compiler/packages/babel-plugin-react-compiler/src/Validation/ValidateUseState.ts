/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity} from '..';
import {HIRFunction, isUseStateType} from '../HIR';

/**
 * Validates that `useState()` is not used for common anti-patterns:
 *
 * - Discarding the setter (`const [value] = useState(...)`) is a way
 *   to force a reactive value not to update, which is not recommended.
 * - Discarding the value (`const [,setter] = useState(...)`) is a way
 *   to force-update the component, which is generally only required if
 *   there is some shared mutable value that isn't properly subscribed.
 *
 * Note: this pass relies on DCE having run first to prune unused patterns
 * from destructuring of useState results.
 */
export function validateUseState(fn: HIRFunction): void {
  const error = new CompilerError();
  for (const [, block] of fn.body.blocks) {
    for (const instr of block.instructions) {
      const value = instr.value;
      if (
        value.kind !== 'Destructure' ||
        !isUseStateType(value.value.identifier) ||
        value.lvalue.pattern.kind !== 'ArrayPattern' ||
        value.lvalue.pattern.items.some(item => item.kind === 'Spread')
      ) {
        continue;
      }
      const items = value.lvalue.pattern.items;
      if (items.length === 0 || items[0].kind === 'Hole') {
        // unused state value
        error.push({
          reason:
            'Using only a state setter, but not its value, will cause a component to re-render without updating',
          description: null,
          severity: ErrorSeverity.InvalidReact,
          loc: value.value.loc,
          suggestions: null,
        });
      }
      if (items.length < 2 || items[1].kind === 'Hole') {
        // unused setter
        error.push({
          reason:
            'Using only a state value, but not its setter, will cause the component not to update when the state input changes',
          description: null,
          severity: ErrorSeverity.InvalidReact,
          loc: value.value.loc,
          suggestions: null,
        });
      }
    }
  }
  if (error.hasErrors()) {
    throw error;
  }
}
