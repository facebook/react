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
  const functions = nameAnonymousFunctionsImpl(fn);
  function visit(node: Node, prefix: string): void {
    if (node.name != null && node.name !== node.fn.name) {
      const name = `${prefix}${node.name}]`;
      node.fn.name = name;
    }
    const nextPrefix = `${prefix}${node.name} > `;
    for (const inner of node.inner) {
      visit(inner, nextPrefix);
    }
  }
  for (const node of functions) {
    visit(node, `${parentName}[`);
  }
}

type Node = {
  fn: FunctionExpression;
  name: string | null;
  inner: Array<Node>;
};

function nameAnonymousFunctionsImpl(fn: HIRFunction): Array<Node> {
  const functions: Map<IdentifierId, Node> = new Map();
  const names: Map<IdentifierId, string> = new Map();
  const nodes: Array<Node> = [];
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
          const inner = nameAnonymousFunctionsImpl(value.loweredFunc.func);
          const node = {
            fn: value,
            name: value.name,
            inner,
          };
          nodes.push(node);
          if (value.name == null) {
            // only populate names for anonymous functions
            functions.set(lvalue.identifier.id, node);
          }
          break;
        }
        case 'StoreContext':
        case 'StoreLocal': {
          const node = functions.get(value.value.identifier.id);
          const variableName = value.lvalue.place.identifier.name;
          if (
            node != null &&
            variableName != null &&
            variableName.kind === 'named'
          ) {
            node.name = variableName.value;
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
          for (let i = 0; i < value.args.length; i++) {
            const arg = value.args[i]!;
            if (arg.kind === 'Spread') {
              continue;
            }
            const node = functions.get(arg.identifier.id);
            if (node != null) {
              node.name = `${calleeName}(arg${i})`;
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
            const node = functions.get(attr.place.identifier.id);
            if (node != null) {
              const elementName =
                value.tag.kind === 'BuiltinTag'
                  ? value.tag.name
                  : (names.get(value.tag.identifier.id) ?? null);
              const propName =
                elementName == null
                  ? attr.name
                  : `<${elementName}>.${attr.name}`;
              node.name = `${propName}`;
              functions.delete(attr.place.identifier.id);
            }
          }
          break;
        }
      }
    }
  }
  return nodes;
}
