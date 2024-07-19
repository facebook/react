/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ReactiveFunction,
  ReactiveScopeBlock,
  ReactiveStatement,
  ReactiveTerminal,
  ReactiveTerminalStatement,
} from '../HIR/HIR';
import {assertExhaustive} from '../Utils/utils';
import {
  ReactiveFunctionTransform,
  Transformed,
  visitReactiveFunction,
} from './visitors';

/*
 * Given a reactive function, flattens any scopes contained within a loop construct.
 * We won't initially support memoization within loops though this is possible in the future.
 */
export function flattenReactiveLoops(fn: ReactiveFunction): void {
  visitReactiveFunction(fn, new Transform(), false);
}

class Transform extends ReactiveFunctionTransform<boolean> {
  override transformScope(
    scope: ReactiveScopeBlock,
    isWithinLoop: boolean,
  ): Transformed<ReactiveStatement> {
    this.visitScope(scope, isWithinLoop);
    if (isWithinLoop) {
      return {
        kind: 'replace',
        value: {
          kind: 'pruned-scope',
          scope: scope.scope,
          instructions: scope.instructions,
        },
      };
    } else {
      return {kind: 'keep'};
    }
  }

  override visitTerminal(
    stmt: ReactiveTerminalStatement<ReactiveTerminal>,
    isWithinLoop: boolean,
  ): void {
    switch (stmt.terminal.kind) {
      // Loop terminals flatten nested scopes
      case 'do-while':
      case 'while':
      case 'for':
      case 'for-of':
      case 'for-in': {
        this.traverseTerminal(stmt, true);
        break;
      }
      // Non-loop terminals passthrough is contextual, inherits the parent isWithinScope
      case 'try':
      case 'label':
      case 'break':
      case 'continue':
      case 'if':
      case 'return':
      case 'switch':
      case 'throw': {
        this.traverseTerminal(stmt, isWithinLoop);
        break;
      }
      default: {
        assertExhaustive(
          stmt.terminal,
          `Unexpected terminal kind \`${(stmt.terminal as any).kind}\``,
        );
      }
    }
  }
}
