/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as t from '@babel/types';
import {hasOwnProperty} from './utils';

export type ComponentDeclaration = t.FunctionDeclaration & {
  __componentDeclaration: boolean;
};

export function isComponentDeclaration(
  node: t.FunctionDeclaration,
): node is ComponentDeclaration {
  return hasOwnProperty(node, '__componentDeclaration');
}

export function parseComponentDeclaration(
  node: t.FunctionDeclaration,
): ComponentDeclaration | null {
  return isComponentDeclaration(node) ? node : null;
}
