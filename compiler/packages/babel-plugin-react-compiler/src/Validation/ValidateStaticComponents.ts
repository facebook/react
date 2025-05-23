/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {CompilerError, ErrorSeverity} from '../CompilerError';
import {HIRFunction, IdentifierId, SourceLocation} from '../HIR';
import {Result} from '../Utils/Result';

/**
 * Validates against components that are created dynamically and whose identity is not guaranteed
 * to be stable (which would cause the component to reset on each re-render).
 */
export function validateStaticComponents(
  fn: HIRFunction,
): Result<void, CompilerError> {
  const error = new CompilerError();
  const knownDynamicComponents = new Map<IdentifierId, SourceLocation>();
  for (const block of fn.body.blocks.values()) {
    phis: for (const phi of block.phis) {
      for (const operand of phi.operands.values()) {
        const loc = knownDynamicComponents.get(operand.identifier.id);
        if (loc != null) {
          knownDynamicComponents.set(phi.place.identifier.id, loc);
          continue phis;
        }
      }
    }
    for (const instr of block.instructions) {
      const {lvalue, value} = instr;
      switch (value.kind) {
        case 'FunctionExpression':
        case 'NewExpression':
        case 'MethodCall':
        case 'CallExpression': {
          knownDynamicComponents.set(lvalue.identifier.id, value.loc);
          break;
        }
        case 'LoadLocal': {
          const loc = knownDynamicComponents.get(value.place.identifier.id);
          if (loc != null) {
            knownDynamicComponents.set(lvalue.identifier.id, loc);
          }
          break;
        }
        case 'StoreLocal': {
          const loc = knownDynamicComponents.get(value.value.identifier.id);
          if (loc != null) {
            knownDynamicComponents.set(lvalue.identifier.id, loc);
            knownDynamicComponents.set(value.lvalue.place.identifier.id, loc);
          }
          break;
        }
        case 'JsxExpression': {
          if (value.tag.kind === 'Identifier') {
            const location = knownDynamicComponents.get(
              value.tag.identifier.id,
            );
            if (location != null) {
              error.push({
                reason: `Components created during render will reset their state each time they are created. Declare components outside of render. `,
                severity: ErrorSeverity.InvalidReact,
                loc: value.tag.loc,
                description: null,
                suggestions: null,
              });
              error.push({
                reason: `The component may be created during render`,
                severity: ErrorSeverity.InvalidReact,
                loc: location,
                description: null,
                suggestions: null,
              });
            }
          }
        }
      }
    }
  }
  return error.asResult();
}
