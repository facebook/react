/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  FunctionExpression,
  getHookKind,
  HIRFunction,
  IdentifierId,
} from '../HIR';

export function nameAnonymousFunctions(fn: HIRFunction): void {
  if (fn.id == null) {
    return;
  }
  const parentName = fn.id;
  const functions: Map<IdentifierId, FunctionExpression> = new Map();
  const names: Map<IdentifierId, string> = new Map();
  for (const block of fn.body.blocks.values()) {
    for (const instr of block.instructions) {
      const {lvalue, value} = instr;
      switch (value.kind) {
        case 'LoadGlobal': {
          names.set(lvalue.identifier.id, value.binding.name);
          break;
        }
        case 'LoadContext':
        case 'LoadLocal': {
          const name = value.place.identifier.name;
          if (name != null && name.kind === 'named') {
            names.set(lvalue.identifier.id, name.value);
          }
          break;
        }
        case 'PropertyLoad': {
          const objectName = names.get(value.object.identifier.id);
          if (objectName != null) {
            names.set(
              lvalue.identifier.id,
              `${objectName}.${String(value.property)}`,
            );
          }
          break;
        }
        case 'FunctionExpression': {
          if (value.name == null) {
            // only track anonymous functions
            functions.set(lvalue.identifier.id, value);
          }
          break;
        }
        case 'StoreContext':
        case 'StoreLocal': {
          const fn = functions.get(value.value.identifier.id);
          const variableName = value.lvalue.place.identifier.name;
          if (
            fn != null &&
            variableName != null &&
            variableName.kind === 'named'
          ) {
            fn.name = `${parentName}[${variableName.value}]`;
            functions.delete(value.value.identifier.id);
          }
          break;
        }
        case 'CallExpression':
        case 'MethodCall': {
          const callee =
            value.kind === 'MethodCall' ? value.property : value.callee;
          const hookKind = getHookKind(fn.env, callee.identifier);
          let calleeName: string | null = null;
          if (hookKind != null && hookKind !== 'Custom') {
            calleeName = hookKind;
          } else {
            calleeName = names.get(callee.identifier.id) ?? '(anonymous)';
          }
          for (const arg of value.args) {
            if (arg.kind === 'Spread') {
              continue;
            }
            const fn = functions.get(arg.identifier.id);
            if (fn != null) {
              fn.name = `${parentName}[${calleeName}()]`;
              functions.delete(arg.identifier.id);
            }
          }
          break;
        }
        case 'JsxExpression': {
          for (const attr of value.props) {
            if (attr.kind === 'JsxSpreadAttribute') {
              continue;
            }
            const fn = functions.get(attr.place.identifier.id);
            if (fn != null) {
              const elementName =
                value.tag.kind === 'BuiltinTag'
                  ? value.tag.name
                  : (names.get(value.tag.identifier.id) ?? null);
              const propName =
                elementName == null
                  ? attr.name
                  : `<${elementName}>.${attr.name}`;
              fn.name = `${parentName}[${propName}]`;
              functions.delete(attr.place.identifier.id);
            }
          }
          break;
        }
      }
    }
  }
}
