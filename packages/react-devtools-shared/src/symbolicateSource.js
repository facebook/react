/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import SourceMapConsumer from 'react-devtools-shared/src/hooks/SourceMapConsumer';

import type {ReactFunctionLocation} from 'shared/ReactTypes';
import type {FetchFileWithCaching} from 'react-devtools-shared/src/devtools/views/Components/FetchFileWithCachingContext';

const symbolicationCache: Map<
  string,
  Promise<ReactFunctionLocation | null>,
> = new Map();

export function symbolicateSourceWithCache(
  fetchFileWithCaching: FetchFileWithCaching,
  sourceURL: string,
  line: number, // 1-based
  column: number, // 1-based
): Promise<ReactFunctionLocation | null> {
  const key = `${sourceURL}:${line}:${column}`;
  const cachedPromise = symbolicationCache.get(key);
  if (cachedPromise != null) {
    return cachedPromise;
  }

  const promise = symbolicateSource(
    fetchFileWithCaching,
    sourceURL,
    line,
    column,
  );
  symbolicationCache.set(key, promise);

  return promise;
}

const SOURCE_MAP_ANNOTATION_PREFIX = 'sourceMappingURL=';
export async function symbolicateSource(
  fetchFileWithCaching: FetchFileWithCaching,
  sourceURL: string,
  lineNumber: number, // 1-based
  columnNumber: number, // 1-based
): Promise<ReactFunctionLocation | null> {
  const resource = await fetchFileWithCaching(sourceURL).catch(() => null);
  if (resource == null) {
    return null;
  }

  const resourceLines = resource.split(/[\r\n]+/);
  for (let i = resourceLines.length - 1; i >= 0; --i) {
    const resourceLine = resourceLines[i];

    // In case there is empty last line
    if (!resourceLine) continue;
    // Not an annotation? Stop looking for a source mapping url.
    if (!resourceLine.startsWith('//#')) break;

    if (resourceLine.includes(SOURCE_MAP_ANNOTATION_PREFIX)) {
      const sourceMapAnnotationStartIndex = resourceLine.indexOf(
        SOURCE_MAP_ANNOTATION_PREFIX,
      );
      const sourceMapAt = resourceLine.slice(
        sourceMapAnnotationStartIndex + SOURCE_MAP_ANNOTATION_PREFIX.length,
        resourceLine.length,
      );

      const sourceMapURL = new URL(sourceMapAt, sourceURL).toString();
      const sourceMap = await fetchFileWithCaching(sourceMapURL).catch(
        () => null,
      );
      if (sourceMap != null) {
        try {
          const parsedSourceMap = JSON.parse(sourceMap);
          const consumer = SourceMapConsumer(parsedSourceMap);
          const functionName = ''; // TODO: Parse function name from sourceContent.
          const {
            sourceURL: possiblyURL,
            line,
            column: columnZeroBased,
          } = consumer.originalPositionFor({
            lineNumber, // 1-based
            columnNumber, // 1-based
          });

          const column = columnZeroBased + 1;

          if (possiblyURL === null) {
            return null;
          }
          try {
            // sourceMapURL = https://react.dev/script.js.map
            void new URL(possiblyURL); // test if it is a valid URL

            return [functionName, possiblyURL, line, column];
          } catch (e) {
            // This is not valid URL
            if (
              // sourceMapURL = /file
              possiblyURL.startsWith('/') ||
              // sourceMapURL = C:\\...
              possiblyURL.slice(1).startsWith(':\\\\')
            ) {
              // This is an absolute path
              return [functionName, possiblyURL, line, column];
            }

            // This is a relative path
            // possiblyURL = x.js.map, sourceMapURL = https://react.dev/script.js.map
            const absoluteSourcePath = new URL(
              possiblyURL,
              sourceMapURL,
            ).toString();
            return [functionName, absoluteSourcePath, line, column];
          }
        } catch (e) {
          return null;
        }
      }

      return null;
    }
  }

  return null;
}
