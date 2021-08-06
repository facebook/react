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
import {getHookNamesMappingFromAST} from './astUtils';
import {encode, decode} from 'sourcemap-codec';

type SourceMapSegment = [number, number, number, number];
type SourceMapLine = SourceMapSegment[];
type SourceMapMappings = SourceMapLine[];

export type HookMap = {|
  names: $ReadOnlyArray<string>,
  mappings: SourceMapMappings,
|};

export type EncodedHookMap = {|
  names: $ReadOnlyArray<string>,
  mappings: string,
|};

/**
 * Given a parsed source code AST, returns a "Hook Map", which is a
 * mapping which maps locations in the source code to their to their
 * corresponding Hook name, if there is a relevant Hook name for that
 * location (see getHookNamesMappingFromAST for details on the
 * representation of the mapping).
 *
 * The format of the Hook Map follows a similar format as the `name`
 * and `mappings` fields in the Source Map spec, where `names` is an
 * array of strings, and `mappings` contains segments lines, columns,
 * and indices into the `names` array.
 *
 * E.g.:
 *   {
 *     names: ["<no-hook>", "state"],
 *     mappings: [
 *       [ -> line 1
 *         [1, 0, 0],  -> line, col, name index
 *       ],
 *       [ -> line 2
 *         [2, 5, 1],  -> line, col, name index
 *         [2, 15, 0],  -> line, col, name index
 *       ],
 *     ],
 *   }
 */
export function generateHookMap(sourceAST: Node): HookMap {
  const hookNamesMapping = getHookNamesMappingFromAST(sourceAST);
  const namesMap: Map<string, number> = new Map();
  const sourceMapLinesMap: Map<number, SourceMapLine> = new Map();
  const names = [];
  const sourceMapLines = [];
  const mappings = [];

  let currentLine = null;
  for (const {name, start} of hookNamesMapping) {
    let nameIndex = namesMap.get(name);
    if (nameIndex == null) {
      names.push(name);
      nameIndex = names.length - 1;
      namesMap.set(name, nameIndex);
    }

    // TODO: We add a -1 at the end of the segment so we can later
    // encode/decode the mappings by reusing the encode/decode functions
    // from the `sourcemap-codec` library. This library expects segments
    // of specific sizes (i.e. of size 4) in order to encode them correctly.
    // In the future, when we implement our own encoding, we will not
    // need this restriction and can remove the -1 at the end.
    const segment = [start.line, start.column, nameIndex, -1];

    if (currentLine != start.line) {
      currentLine = start.line;
      if (mappings.length > 0) {
        const current = mappings[mappings.length - 1];
        current.push(segment);
      } else {
        mappings.push([segment]);
      }
    } else {
      mappings.push([segment]);
    }
  }

  return {names, mappings};
}

/**
 * Returns encoded version of a Hook Map that is returned
 * by generateHookMap.
 *
 * **NOTE:**
 * TODO: To encode the `mappings` in the Hook Map, we
 * reuse the encode function from the `sourcemap-codec`
 * library, which means that we are restricted to only
 * encoding segments of specific sizes.
 * Inside generateHookMap we make sure to build segments
 * of size 4.
 * In the future, when we implement our own encoding, we will not
 * need this restriction and can remove the -1 at the end.
 */
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
