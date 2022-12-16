/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from "@babel/types";
import generate from "@babel/generator";

/**
 * Dumper.
 */

const defaultDumpNodeOption = {
  // dump with location.
  loc: false,

  // dump with the node type.
  type: false,

  // dump as the entire source code instead of a shorten name.
  source: false,

  // instead of <anno>, fallback to source.
  fallbackToSource: true,
};

type DumpNodeOption = typeof defaultDumpNodeOption;

export function dumpNodeLoc(node: t.Node): string {
  return `${node.loc?.start.line ?? "?"}:${node.loc?.start.column ?? "?"}`;
}

/**
 * Dump a string form of the @param node to help with debugging.
 */
export function dumpNode(
  node: t.Node | null | undefined,
  options: Partial<DumpNodeOption> = defaultDumpNodeOption
): string {
  let str = "";
  let opt = { ...defaultDumpNodeOption, ...options };

  if (!node) return "";

  if (opt.loc) {
    str += `${dumpNodeLoc(node)} `;
  }

  if (opt.source) {
    str += generate(node).code;
  } else {
    switch (node.type) {
      case "Identifier":
        str += node.name;
        break;

      case "JSXIdentifier":
        str += `${node.name}`;
        break;

      case "VariableDeclarator":
        str += `${dumpNode(node.id, { source: true })}`;
        break;

      case "JSXMemberExpression":
        str += `${dumpNode(node.object)}.${dumpNode(node.property)}`;
        break;

      case "JSXNamespacedName":
        str += `${dumpNode(node.namespace)}:${dumpNode(node.name)}`;
        break;

      case "JSXOpeningElement":
        str += dumpNode(node.name);
        break;

      case "JSXAttribute":
        str += dumpNode(node.name);
        break;

      case "FunctionDeclaration":
        str += `function ${dumpNode(node.id)}`;
        break;

      case "JSXFragment":
        str += `<>`;
        break;

      case "JSXElement":
        if (node.selfClosing) {
          str += `<${dumpNode(node.openingElement)} />`;
        } else {
          str += `<${dumpNode(node.openingElement)}>`;
        }
        break;

      default:
        if (opt.fallbackToSource) {
          str += "`" + generate(node, { compact: true }).code + "`";
        } else {
          str += `<anno>`;
        }
    }
  }

  if (opt.type) {
    str += ` : ${node.type}`;
  }

  return str;
}
