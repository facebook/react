/* global chrome */

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {parse} from '@babel/parser';
import {SourceMapConsumer} from 'source-map';
import {
  checkNodeLocation,
  getASTFromSourceMap,
  getFilteredHookASTNodes,
  getHookName,
  getPotentialHookDeclarationsFromAST,
  isConfirmedHookDeclaration,
  isNonDeclarativePrimitiveHook,
} from './astUtils';

import type {
  HooksNode,
  HookSource,
  HooksTree,
} from 'react-debug-tools/src/ReactDebugHooks';
import type {HookNames} from 'react-devtools-shared/src/hookNamesCache';
import type {Thenable} from 'shared/ReactTypes';
import type {SourceConsumer} from './astUtils';

const SOURCE_MAP_REGEX = / ?sourceMappingURL=([^\s'"]+)/gm;
const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
const MAX_SOURCE_LENGTH = 100_000_000;

type HookSourceData = {|
  hookSource: HookSource,
  sourceConsumer: SourceConsumer | null,
  sourceContents: string | null,
  sourceMapURL: string | null,
  sourceMapContents: string | null,
|};

export default async function parseHookNames(
  hooksTree: HooksTree,
): Thenable<HookNames | null> {
  const hooksList: Array<HooksNode> = [];
  flattenHooksList(hooksTree, hooksList);

  // Gather the unique set of source files to load for the built-in hooks.
  const fileNameToHookSourceData: Map<string, HookSourceData> = new Map();
  for (let i = 0; i < hooksList.length; i++) {
    const hook = hooksList[i];

    const hookSource = hook.hookSource;
    if (hookSource == null) {
      // Older versions of react-debug-tools don't include this information.
      // In this case, we can't continue.
      throw Error('Hook source code location not found.');
    }

    const fileName = hookSource.fileName;
    if (fileName == null) {
      throw Error('Hook source code location not found.');
    } else {
      if (!fileNameToHookSourceData.has(fileName)) {
        fileNameToHookSourceData.set(fileName, {
          hookSource,
          sourceConsumer: null,
          sourceContents: null,
          sourceMapURL: null,
          sourceMapContents: null,
        });
      }
    }
  }

  // TODO (named hooks) Call .destroy() on SourceConsumers after we're done to free up memory.

  return loadSourceFiles(fileNameToHookSourceData)
    .then(() => extractAndLoadSourceMaps(fileNameToHookSourceData))
    .then(() => parseSourceMaps(fileNameToHookSourceData))
    .then(() => findHookNames(hooksList, fileNameToHookSourceData));
}

function extractAndLoadSourceMaps(
  fileNameToHookSourceData: Map<string, HookSourceData>,
): Promise<*> {
  const promises = [];
  fileNameToHookSourceData.forEach(hookSourceData => {
    const sourceMappingURLs = ((hookSourceData.sourceContents: any): string).match(
      SOURCE_MAP_REGEX,
    );
    if (sourceMappingURLs == null) {
      // Maybe file has not been transformed; let's try to parse it as-is.
    } else {
      for (let i = 0; i < sourceMappingURLs.length; i++) {
        const sourceMappingURL = sourceMappingURLs[i];
        const index = sourceMappingURL.indexOf('base64,');
        if (index >= 0) {
          // Web apps like Code Sandbox embed multiple inline source maps.
          // In this case, we need to loop through and find the right one.
          // We may also need to trim any part of this string that isn't based64 encoded data.
          const trimmed = ((sourceMappingURL.match(
            /base64,([a-zA-Z0-9+\/=]+)/,
          ): any): Array<string>)[1];
          const decoded = atob(trimmed);
          const parsed = JSON.parse(decoded);

          // Hook source might be a URL like "https://4syus.csb.app/src/App.js"
          // Parsed source map might be a partial path like "src/App.js"
          const fileName = ((hookSourceData.hookSource.fileName: any): string);
          const match = parsed.sources.find(
            source =>
              source === 'Inline Babel script' || fileName.includes(source),
          );
          if (match) {
            hookSourceData.sourceMapContents = parsed;
            break;
          }
        } else {
          if (sourceMappingURLs.length > 1) {
            console.warn(
              'More than one external source map detected in the source file',
            );
          }

          let url = sourceMappingURLs[0].split('=')[1];
          if (ABSOLUTE_URL_REGEX.test(url)) {
            const baseURL = url.slice(0, url.lastIndexOf('/'));
            url = `${baseURL}/${url}`;

            if (!isValidUrl(url)) {
              throw new Error(`Invalid source map URL "${url}"`);
            }
          }

          hookSourceData.sourceMapURL = url;

          promises.push(
            fetchFile(url).then(sourceMapContents => {
              hookSourceData.sourceMapContents = JSON.parse(sourceMapContents);
            }),
          );
          break;
        }
      }
    }
  });
  return Promise.all(promises);
}

function fetchFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch(url).then(response => {
      if (response.ok) {
        response
          .text()
          .then(text => {
            resolve(text);
          })
          .catch(error => {
            reject(null);
          });
      } else {
        reject(null);
      }
    });
  });
}

function findHookNames(
  hooksList: Array<HooksNode>,
  fileNameToHookSourceData: Map<string, HookSourceData>,
): Promise<HookNames> {
  return ((Promise.all(
    hooksList.map(hook => {
      if (isNonDeclarativePrimitiveHook(hook)) {
        // Not all hooks have names (e.g. useEffect or useLayoutEffect)
        return null;
      }

      // We already guard against a null HookSource in parseHookNames()
      const hookSource = ((hook.hookSource: any): HookSource);
      const fileName = hookSource.fileName;
      if (!fileName) {
        return null; // Should not be reachable.
      }

      const hookSourceData = fileNameToHookSourceData.get(fileName);
      if (!hookSourceData) {
        return null; // Should not be reachable.
      }

      const {lineNumber, columnNumber} = hookSource;
      if (!lineNumber || !columnNumber) {
        return null; // Should not be reachable.
      }

      let hooksFromAST;
      let potentialReactHookASTNode;
      let sourceCode;

      const sourceConsumer = hookSourceData.sourceConsumer;
      if (sourceConsumer) {
        const astData = getASTFromSourceMap(
          sourceConsumer,
          lineNumber,
          columnNumber,
        );

        if (astData === null) {
          return null;
        }

        const {sourceFileAST, line, source} = astData;

        sourceCode = source;
        hooksFromAST = getPotentialHookDeclarationsFromAST(sourceFileAST);

        // Iterate through potential hooks and try to find the current hook.
        // potentialReactHookASTNode will contain declarations of the form const X = useState(0);
        // where X could be an identifier or an array pattern (destructuring syntax)
        potentialReactHookASTNode = hooksFromAST.find(node => {
          const nodeLocationCheck = checkNodeLocation(node, line);
          const hookDeclaractionCheck = isConfirmedHookDeclaration(node);
          return nodeLocationCheck && hookDeclaractionCheck;
        });
      } else {
        sourceCode = hookSourceData.sourceContents;

        // There's no source map to parse here so we can use the source contents directly.
        const ast = parse(sourceCode, {
          sourceType: 'unambiguous',
          plugins: ['jsx', 'typescript'],
        });
        hooksFromAST = getPotentialHookDeclarationsFromAST(ast);
        const line = ((hookSource.lineNumber: any): number);
        potentialReactHookASTNode = hooksFromAST.find(
          node =>
            checkNodeLocation(node, line) && isConfirmedHookDeclaration(node),
        );
      }

      if (!sourceCode || !potentialReactHookASTNode) {
        return null;
      }

      // nodesAssociatedWithReactHookASTNode could directly be used to obtain the hook variable name
      // depending on the type of potentialReactHookASTNode
      try {
        const nodesAssociatedWithReactHookASTNode = getFilteredHookASTNodes(
          potentialReactHookASTNode,
          hooksFromAST,
          sourceCode,
        );

        return getHookName(
          hook,
          nodesAssociatedWithReactHookASTNode,
          potentialReactHookASTNode,
        );
      } catch (error) {
        console.error(error);
        return null;
      }
    }),
  ): any): Promise<HookNames>);
}

function isValidUrl(possibleURL: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(possibleURL);
  } catch (_) {
    return false;
  }
  return true;
}

function loadSourceFiles(
  fileNameToHookSourceData: Map<string, HookSourceData>,
): Promise<*> {
  const promises = [];
  fileNameToHookSourceData.forEach((hookSourceData, fileName) => {
    promises.push(
      fetchFile(fileName).then(sourceContents => {
        if (sourceContents.length > MAX_SOURCE_LENGTH) {
          throw Error('Source code too large to parse');
        }

        hookSourceData.sourceContents = sourceContents;
      }),
    );
  });
  return Promise.all(promises);
}

async function parseSourceMaps(
  fileNameToHookSourceData: Map<string, HookSourceData>,
): Promise<*> {
  // Parse source maps (or original source) into ASTs.
  // TODO (named hooks) Maybe this code should be injected;
  // It's the only code in react-devtools-shared that references chrome.* APIs
  // $FlowFixMe
  const wasmMappingsURL = chrome.extension.getURL('source-map.wasm'); // eslint-disable-line no-undef

  // SourceMapConsumer.initialize() does nothing when running in Node (aka Jest)
  // so we can avoid triggering a warning message about this.
  if (!__TEST__) {
    SourceMapConsumer.initialize({'lib/mappings.wasm': wasmMappingsURL});
  }

  const promises = [];
  fileNameToHookSourceData.forEach(hookSourceData => {
    if (hookSourceData.sourceMapContents !== null) {
      // Parse and extract the AST from the source map.
      promises.push(
        SourceMapConsumer.with(
          hookSourceData.sourceMapContents,
          null,
          (sourceConsumer: SourceConsumer) => {
            hookSourceData.sourceConsumer = sourceConsumer;
          },
        ),
      );
    } else {
      // There's no source map to parse here so we can skip this step.
    }
  });
  return Promise.all(promises);
}

function flattenHooksList(
  hooksTree: HooksTree,
  hooksList: Array<HooksNode>,
): void {
  for (let i = 0; i < hooksTree.length; i++) {
    const hook = hooksTree[i];
    hooksList.push(hook);
    if (hook.subHooks.length > 0) {
      flattenHooksList(hook.subHooks, hooksList);
    }
  }
}
