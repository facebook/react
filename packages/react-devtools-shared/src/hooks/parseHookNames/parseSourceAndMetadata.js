/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// For an overview of why the code in this file is structured this way,
// refer to header comments in loadSourceAndMetadata.

import {parse} from '@babel/parser';
import LRU from 'lru-cache';
import {SourceMapConsumer} from 'source-map-js';
import {getHookName} from '../astUtils';
import {areSourceMapsAppliedToErrors} from '../ErrorTester';
import {__DEBUG__} from 'react-devtools-shared/src/constants';
import {getHookSourceLocationKey} from 'react-devtools-shared/src/hookNamesCache';
import {SourceMapMetadataConsumer} from '../SourceMapMetadataConsumer';
import {
  withAsyncPerformanceMark,
  withSyncPerformanceMark,
} from 'react-devtools-shared/src/PerformanceMarks';

import type {
  HooksList,
  LocationKeyToHookSourceAndMetadata,
} from './loadSourceAndMetadata';
import type {HookSource} from 'react-debug-tools/src/ReactDebugHooks';
import type {HookNames, LRUCache} from 'react-devtools-shared/src/types';
import type {SourceConsumer} from '../astUtils';

type AST = mixed;

type HookParsedMetadata = {|
  // API for consuming metadfata present in extended source map.
  metadataConsumer: SourceMapMetadataConsumer | null,

  // AST for original source code; typically comes from a consumed source map.
  originalSourceAST: AST | null,

  // Source code (React components or custom hooks) containing primitive hook calls.
  // If no source map has been provided, this code will be the same as runtimeSourceCode.
  originalSourceCode: string | null,

  // Original source URL if there is a source map, or the same as runtimeSourceURL.
  originalSourceURL: string | null,

  // Line number in original source code.
  originalSourceLineNumber: number | null,

  // Column number in original source code.
  originalSourceColumnNumber: number | null,

  // APIs from source-map for parsing source maps (if detected).
  sourceConsumer: SourceConsumer | null,
|};

type LocationKeyToHookParsedMetadata = Map<string, HookParsedMetadata>;

type CachedRuntimeCodeMetadata = {|
  sourceConsumer: SourceConsumer | null,
  metadataConsumer: SourceMapMetadataConsumer | null,
|};

const runtimeURLToMetadataCache: LRUCache<
  string,
  CachedRuntimeCodeMetadata,
> = new LRU({
  max: 50,
  dispose: (runtimeSourceURL: string, metadata: CachedRuntimeCodeMetadata) => {
    if (__DEBUG__) {
      console.log(
        `runtimeURLToMetadataCache.dispose() Evicting cached metadata for "${runtimeSourceURL}"`,
      );
    }

    const sourceConsumer = metadata.sourceConsumer;
    if (sourceConsumer !== null) {
      sourceConsumer.destroy();
    }
  },
});

type CachedSourceCodeMetadata = {|
  originalSourceAST: AST,
  originalSourceCode: string,
|};

const originalURLToMetadataCache: LRUCache<
  string,
  CachedSourceCodeMetadata,
> = new LRU({
  max: 50,
  dispose: (originalSourceURL: string, metadata: CachedSourceCodeMetadata) => {
    if (__DEBUG__) {
      console.log(
        `originalURLToMetadataCache.dispose() Evicting cached metadata for "${originalSourceURL}"`,
      );
    }
  },
});

export async function parseSourceAndMetadata(
  hooksList: HooksList,
  locationKeyToHookSourceAndMetadata: LocationKeyToHookSourceAndMetadata,
): Promise<HookNames | null> {
  return withAsyncPerformanceMark('parseSourceAndMetadata()', async () => {
    const locationKeyToHookParsedMetadata = withSyncPerformanceMark(
      'initializeHookParsedMetadata',
      () => initializeHookParsedMetadata(locationKeyToHookSourceAndMetadata),
    );

    withSyncPerformanceMark('parseSourceMaps', () =>
      parseSourceMaps(
        locationKeyToHookSourceAndMetadata,
        locationKeyToHookParsedMetadata,
      ),
    );

    withSyncPerformanceMark('parseSourceAST()', () =>
      parseSourceAST(
        locationKeyToHookSourceAndMetadata,
        locationKeyToHookParsedMetadata,
      ),
    );

    return withSyncPerformanceMark('findHookNames()', () =>
      findHookNames(hooksList, locationKeyToHookParsedMetadata),
    );
  });
}

function findHookNames(
  hooksList: HooksList,
  locationKeyToHookParsedMetadata: LocationKeyToHookParsedMetadata,
): HookNames {
  const map: HookNames = new Map();

  hooksList.map(hook => {
    // We already guard against a null HookSource in parseHookNames()
    const hookSource = ((hook.hookSource: any): HookSource);
    const fileName = hookSource.fileName;
    if (!fileName) {
      return null; // Should not be reachable.
    }

    const locationKey = getHookSourceLocationKey(hookSource);
    const hookParsedMetadata = locationKeyToHookParsedMetadata.get(locationKey);
    if (!hookParsedMetadata) {
      return null; // Should not be reachable.
    }

    const {lineNumber, columnNumber} = hookSource;
    if (!lineNumber || !columnNumber) {
      return null; // Should not be reachable.
    }

    const {
      originalSourceURL,
      originalSourceColumnNumber,
      originalSourceLineNumber,
    } = hookParsedMetadata;

    if (
      originalSourceLineNumber == null ||
      originalSourceColumnNumber == null ||
      originalSourceURL == null
    ) {
      return null; // Should not be reachable.
    }

    let name;
    const {metadataConsumer} = hookParsedMetadata;
    if (metadataConsumer != null) {
      name = withSyncPerformanceMark('metadataConsumer.hookNameFor()', () =>
        metadataConsumer.hookNameFor({
          line: originalSourceLineNumber,
          column: originalSourceColumnNumber,
          source: originalSourceURL,
        }),
      );
    }

    if (name == null) {
      name = withSyncPerformanceMark('getHookName()', () =>
        getHookName(
          hook,
          hookParsedMetadata.originalSourceAST,
          ((hookParsedMetadata.originalSourceCode: any): string),
          ((originalSourceLineNumber: any): number),
          originalSourceColumnNumber,
        ),
      );
    }

    if (__DEBUG__) {
      console.log(`findHookNames() Found name "${name || '-'}"`);
    }

    const key = getHookSourceLocationKey(hookSource);
    map.set(key, name);
  });

  return map;
}

function initializeHookParsedMetadata(
  locationKeyToHookSourceAndMetadata: LocationKeyToHookSourceAndMetadata,
) {
  // Create map of unique source locations (file names plus line and column numbers) to metadata about hooks.
  const locationKeyToHookParsedMetadata: LocationKeyToHookParsedMetadata = new Map();
  locationKeyToHookSourceAndMetadata.forEach(
    (hookSourceAndMetadata, locationKey) => {
      const hookParsedMetadata: HookParsedMetadata = {
        metadataConsumer: null,
        originalSourceAST: null,
        originalSourceCode: null,
        originalSourceURL: null,
        originalSourceLineNumber: null,
        originalSourceColumnNumber: null,
        sourceConsumer: null,
      };

      locationKeyToHookParsedMetadata.set(locationKey, hookParsedMetadata);

      const runtimeSourceURL = hookSourceAndMetadata.runtimeSourceURL;

      // If we've already loaded the source map info for this file,
      // we can skip reloading it (and more importantly, re-parsing it).
      const runtimeMetadata = runtimeURLToMetadataCache.get(runtimeSourceURL);
      if (runtimeMetadata != null) {
        if (__DEBUG__) {
          console.groupCollapsed(
            `parseHookNames() Found cached runtime metadata for file "${runtimeSourceURL}"`,
          );
          console.log(runtimeMetadata);
          console.groupEnd();
        }
        hookParsedMetadata.sourceConsumer = runtimeMetadata.sourceConsumer;
        hookParsedMetadata.metadataConsumer = runtimeMetadata.metadataConsumer;
      }
    },
  );

  return locationKeyToHookParsedMetadata;
}

function parseSourceAST(
  locationKeyToHookSourceAndMetadata: LocationKeyToHookSourceAndMetadata,
  locationKeyToHookParsedMetadata: LocationKeyToHookParsedMetadata,
): void {
  locationKeyToHookSourceAndMetadata.forEach(
    (hookSourceAndMetadata, locationKey) => {
      const hookParsedMetadata = locationKeyToHookParsedMetadata.get(
        locationKey,
      );
      if (hookParsedMetadata == null) {
        throw Error(`Expected to find HookParsedMetadata for "${locationKey}"`);
      }

      if (hookParsedMetadata.originalSourceAST !== null) {
        // Use cached metadata.
        return;
      }

      if (
        hookParsedMetadata.originalSourceURL != null &&
        hookParsedMetadata.originalSourceCode != null &&
        hookParsedMetadata.originalSourceColumnNumber != null &&
        hookParsedMetadata.originalSourceLineNumber != null
      ) {
        // Use cached metadata.
        return;
      }

      const {lineNumber, columnNumber} = hookSourceAndMetadata.hookSource;
      if (lineNumber == null || columnNumber == null) {
        throw Error('Hook source code location not found.');
      }

      const {metadataConsumer, sourceConsumer} = hookParsedMetadata;
      const runtimeSourceCode = ((hookSourceAndMetadata.runtimeSourceCode: any): string);
      let hasHookMap = false;
      let originalSourceURL;
      let originalSourceCode;
      let originalSourceColumnNumber;
      let originalSourceLineNumber;
      if (areSourceMapsAppliedToErrors() || sourceConsumer == null) {
        // Either the current environment automatically applies source maps to errors,
        // or the current code had no source map to begin with.
        // Either way, we don't need to convert the Error stack frame locations.
        originalSourceColumnNumber = columnNumber;
        originalSourceLineNumber = lineNumber;
        // There's no source map to parse here so we can just parse the original source itself.
        originalSourceCode = runtimeSourceCode;
        // TODO (named hooks) This mixes runtimeSourceURLs with source mapped URLs in the same cache key space.
        // Namespace them?
        originalSourceURL = hookSourceAndMetadata.runtimeSourceURL;
      } else {
        // Parse and extract the AST from the source map.
        // Now that the source map has been loaded,
        // extract the original source for later.
        // TODO (named hooks) Refactor this read, github.com/facebook/react/pull/22181
        const {column, line, source} = withSyncPerformanceMark(
          'sourceConsumer.originalPositionFor()',
          () =>
            sourceConsumer.originalPositionFor({
              line: lineNumber,

              // Column numbers are represented differently between tools/engines.
              // Error.prototype.stack columns are 1-based (like most IDEs) but ASTs are 0-based.
              // For more info see https://github.com/facebook/react/issues/21792#issuecomment-873171991
              column: columnNumber - 1,
            }),
        );

        if (source == null) {
          // TODO (named hooks) maybe fall back to the runtime source instead of throwing?
          throw new Error(
            'Could not map hook runtime location to original source location',
          );
        }

        originalSourceColumnNumber = column;
        originalSourceLineNumber = line;
        // TODO (named hooks) maybe canonicalize this URL somehow?
        // It can be relative if the source map specifies it that way,
        // but we use it as a cache key across different source maps and there can be collisions.
        originalSourceURL = (source: string);
        originalSourceCode = withSyncPerformanceMark(
          'sourceConsumer.sourceContentFor()',
          () => (sourceConsumer.sourceContentFor(source, true): string),
        );

        if (__DEBUG__) {
          console.groupCollapsed(
            `parseSourceAST() Extracted source code from source map for "${originalSourceURL}"`,
          );
          console.log(originalSourceCode);
          console.groupEnd();
        }

        if (
          metadataConsumer != null &&
          metadataConsumer.hasHookMap(originalSourceURL)
        ) {
          hasHookMap = true;
        }
      }

      if (__DEBUG__) {
        console.log(
          `parseSourceAST() mapped line ${lineNumber}->${originalSourceLineNumber} and column ${columnNumber}->${originalSourceColumnNumber}`,
        );
      }

      hookParsedMetadata.originalSourceCode = originalSourceCode;
      hookParsedMetadata.originalSourceURL = originalSourceURL;
      hookParsedMetadata.originalSourceLineNumber = originalSourceLineNumber;
      hookParsedMetadata.originalSourceColumnNumber = originalSourceColumnNumber;

      if (hasHookMap) {
        if (__DEBUG__) {
          console.log(
            `parseSourceAST() Found hookMap and skipping parsing for "${originalSourceURL}"`,
          );
        }
        // If there's a hook map present from an extended sourcemap then
        // we don't need to parse the source files and instead can use the
        // hook map to extract hook names.
        return;
      }

      if (__DEBUG__) {
        console.log(
          `parseSourceAST() Did not find hook map for "${originalSourceURL}"`,
        );
      }

      // The cache also serves to deduplicate parsing by URL in our loop over location keys.
      // This may need to change if we switch to async parsing.
      const sourceMetadata = originalURLToMetadataCache.get(originalSourceURL);
      if (sourceMetadata != null) {
        if (__DEBUG__) {
          console.groupCollapsed(
            `parseSourceAST() Found cached source metadata for "${originalSourceURL}"`,
          );
          console.log(sourceMetadata);
          console.groupEnd();
        }
        hookParsedMetadata.originalSourceAST = sourceMetadata.originalSourceAST;
        hookParsedMetadata.originalSourceCode =
          sourceMetadata.originalSourceCode;
      } else {
        // TypeScript is the most commonly used typed JS variant so let's default to it
        // unless we detect explicit Flow usage via the "@flow" pragma.
        const plugin =
          originalSourceCode.indexOf('@flow') > 0 ? 'flow' : 'typescript';

        // TODO (named hooks) This is probably where we should check max source length,
        // rather than in loadSourceAndMetatada -> loadSourceFiles().
        const originalSourceAST = withSyncPerformanceMark(
          '[@babel/parser] parse(originalSourceCode)',
          () =>
            parse(originalSourceCode, {
              sourceType: 'unambiguous',
              plugins: ['jsx', plugin],
            }),
        );
        hookParsedMetadata.originalSourceAST = originalSourceAST;

        if (__DEBUG__) {
          console.log(
            `parseSourceAST() Caching source metadata for "${originalSourceURL}"`,
          );
        }

        originalURLToMetadataCache.set(originalSourceURL, {
          originalSourceAST,
          originalSourceCode,
        });
      }
    },
  );
}

function parseSourceMaps(
  locationKeyToHookSourceAndMetadata: LocationKeyToHookSourceAndMetadata,
  locationKeyToHookParsedMetadata: LocationKeyToHookParsedMetadata,
) {
  locationKeyToHookSourceAndMetadata.forEach(
    (hookSourceAndMetadata, locationKey) => {
      const hookParsedMetadata = locationKeyToHookParsedMetadata.get(
        locationKey,
      );
      if (hookParsedMetadata == null) {
        throw Error(`Expected to find HookParsedMetadata for "${locationKey}"`);
      }

      const sourceMapJSON = hookSourceAndMetadata.sourceMapJSON;
      if (sourceMapJSON != null) {
        hookParsedMetadata.metadataConsumer = withSyncPerformanceMark(
          'new SourceMapMetadataConsumer(sourceMapJSON)',
          () => new SourceMapMetadataConsumer(sourceMapJSON),
        );
        hookParsedMetadata.sourceConsumer = withSyncPerformanceMark(
          'new SourceMapConsumer(sourceMapJSON)',
          () => new SourceMapConsumer(sourceMapJSON),
        );

        const runtimeSourceURL = hookSourceAndMetadata.runtimeSourceURL;

        // Only set once to avoid triggering eviction/cleanup code.
        if (!runtimeURLToMetadataCache.has(runtimeSourceURL)) {
          if (__DEBUG__) {
            console.log(
              `parseSourceMaps() Caching runtime metadata for "${runtimeSourceURL}"`,
            );
          }

          runtimeURLToMetadataCache.set(runtimeSourceURL, {
            metadataConsumer: hookParsedMetadata.metadataConsumer,
            sourceConsumer: hookParsedMetadata.sourceConsumer,
          });
        }
      }
    },
  );
}

export function purgeCachedMetadata(): void {
  originalURLToMetadataCache.reset();
  runtimeURLToMetadataCache.reset();
}
