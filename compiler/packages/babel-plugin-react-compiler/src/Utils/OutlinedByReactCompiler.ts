/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from '@babel/types';

export type OutlinedByReactCompilerFunctionDeclaration =
  t.FunctionDeclaration & {
    isOutlinedByReactCompiler: boolean;
  };

export function isOutlinedByReactCompiler(
  node: t.FunctionDeclaration,
): node is OutlinedByReactCompilerFunctionDeclaration {
  return Object.prototype.hasOwnProperty.call(node, 'isOutlinedByReactCompiler');
}

export function markOutlinedByReactCompiler(
  node: t.FunctionDeclaration,
): OutlinedByReactCompilerFunctionDeclaration {
  const outlinedNode = node as OutlinedByReactCompilerFunctionDeclaration;
  outlinedNode.isOutlinedByReactCompiler = true;
  return outlinedNode;
}

export function copyOutlinedByReactCompilerMarker(
  source: t.FunctionDeclaration,
  target: t.FunctionDeclaration,
): t.FunctionDeclaration {
  if (isOutlinedByReactCompiler(source)) {
    return markOutlinedByReactCompiler(target);
  }
  return target;
}
