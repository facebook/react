/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

import type {
  BasicSourceMap,
  MixedSourceMap,
  IndexSourceMap,
} from './SourceMapTypes';

export function sourceMapIncludesSource(
  sourcemap: MixedSourceMap,
  source: ?string,
): boolean {
  if (source == null) {
    return false;
  }
  if (sourcemap.mappings === undefined) {
    const indexSourceMap: IndexSourceMap = sourcemap;
    return indexSourceMap.sections.some(section => {
      return sourceMapIncludesSource(section.map, source);
    });
  }

  const basicMap: BasicSourceMap = sourcemap;
  return basicMap.sources.some(
    s => s === 'Inline Babel script' || source.endsWith(s),
  );
}
