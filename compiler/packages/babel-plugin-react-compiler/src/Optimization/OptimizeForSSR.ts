/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {traverse} from '@babel/types';
import {
  getHookKind,
  HIRFunction,
  IdentifierId,
  isArrayType,
  isObjectType,
  isPlainObjectType,
  isPrimitiveType,
  isUseStateType,
  LoadLocal,
  StoreLocal,
} from '../HIR';
import {
  eachInstructionValueOperand,
  eachTerminalOperand,
} from '../HIR/visitors';
import {retainWhere} from '../Utils/utils';

/**
 * Optimizes the code for running specifically in an SSR environment. This optimization
 * asssumes that setState will not be called during render during initial mount, which
 * allows inlining useState/useReducer.
 *
 * Optimizations:
 * - Inline useState/useReducer
 * - Inline useMemo/useCallback (happens in earlier passes)
 * - Remove effects
 * - Remove refs where known to be unused during render (eg directly passed to a dom node)
 * - Remove event handlers
 */
export function optimizeForSSR(fn: HIRFunction): void {
  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      const {value} = instr;
      switch (value.kind) {
        case 'JsxExpression': {
          if (
            value.tag.kind === 'BuiltinTag' &&
            value.tag.name.indexOf('-') === -1
          ) {
            retainWhere(value.props, prop => {
              return (
                prop.kind === 'JsxSpreadAttribute' ||
                (prop.name !== 'ref' && !prop.name.startsWith('on'))
              );
            });
          }
          break;
        }
        case 'Destructure': {
          if (
            isUseStateType(value.value.identifier) &&
            value.lvalue.pattern.kind === 'ArrayPattern' &&
            value.lvalue.pattern.items.length >= 1 &&
            value.lvalue.pattern.items[0].kind === 'Identifier'
          ) {
            const store: StoreLocal = {
              kind: 'StoreLocal',
              loc: value.loc,
              type: null,
              lvalue: {
                kind: value.lvalue.kind,
                place: value.lvalue.pattern.items[0],
              },
              value: value.value,
            };
            instr.value = store;
          }
          break;
        }
        case 'MethodCall':
        case 'CallExpression': {
          const calleee =
            value.kind === 'CallExpression' ? value.callee : value.property;
          const hookKind = getHookKind(fn.env, calleee.identifier);
          switch (hookKind) {
            case 'useEffectEvent': {
              if (
                value.args.length === 1 &&
                value.args[0].kind === 'Identifier'
              ) {
                const load: LoadLocal = {
                  kind: 'LoadLocal',
                  place: value.args[0],
                  loc: value.loc,
                };
                instr.value = load;
              }
              break;
            }
            case 'useEffect':
            case 'useLayoutEffect':
            case 'useInsertionEffect': {
              // Drop effects
              instr.value = {
                kind: 'Primitive',
                value: undefined,
                loc: value.loc,
              };
              break;
            }
            case 'useState': {
              if (
                value.args.length === 1 &&
                value.args[0].kind === 'Identifier'
              ) {
                const arg = value.args[0];
                if (
                  isPrimitiveType(arg.identifier) ||
                  isPlainObjectType(arg.identifier) ||
                  isArrayType(arg.identifier)
                ) {
                  instr.value = {
                    kind: 'LoadLocal',
                    place: arg,
                    loc: arg.loc,
                  };
                }
              }
              break;
            }
          }
        }
      }
    }
  }
}
