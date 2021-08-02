/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import traverse, {Node, NodePath} from '@babel/traverse';
import {string} from 'yargs';
import {getHookNamesFromAST} from './astUtils';
import {encode, decode} from 'sourcemap-codec';

export type HookMap = {|
  names: $ReadOnlyArray<string>,
  mappings: $ReadOnlyArray<
    $ReadOnlyArray<[number, number, number, number, number]>,
  >,
|};

export type EncodedHookMap = {|
  names: $ReadOnlyArray<string>,
  mappings: string,
|};

export function generateHookMap(sourceAST: Node): HookMap {
  const hooksFromAST = getHookNamesFromAST(sourceAST);

  const names = [];
  const mappings = [];
  hooksFromAST.forEach((hookNodes, name) => {
    names.push(name);
    hookNodes.forEach(node => {
      mappings.push([
        [
          node.loc.start.line,
          node.loc.start.column,
          node.loc.end.line,
          node.loc.end.column,
          names.length - 1,
        ],
      ]);
    });
  });
  return {names, mappings};
}

export function generateEncodedHookMap(sourceAST: Node): EncodedHookMap {
  const hookMap = generateHookMap(sourceAST);
  const encoded = encode(hookMap.mappings);
  return {
    names: hookMap.names,
    mappings: encoded,
  };
}

export function decodeHookMap(encodedHookMap: EncodedHookMap): HookMap {
  return {
    names: encodedHookMap.names,
    mappings: decode(encodedHookMap.mappings),
  };
}
