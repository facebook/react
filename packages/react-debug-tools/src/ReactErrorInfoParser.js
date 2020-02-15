/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const FRAME_RE = /\n {4}in (.+?)(?: \(created by (.+?)\)| \(at (.*)\:([0-9]+?)\))?$/gm;

type DescribedFiber = {
  +name: string,
  +source: ?{+fileName: string, +lineNumber: number, ...},
  +owner: ?{+name: string, ...},
  ...
};

type ParsedErrorInfo = {
  +componentStack: $ReadOnlyArray<DescribedFiber>,
  ...
};

export function parseErrorInfo({
  componentStack,
}: {
  +componentStack: string,
  ...
}): ParsedErrorInfo {
  const result = {componentStack: []};
  let match;
  while ((match = FRAME_RE.exec(componentStack))) {
    const [, name, ownerName, sourceFileName, sourceLineNumber] = match;
    result.componentStack.push({
      name,
      owner: ownerName != null ? {name: ownerName} : null,
      source:
        sourceFileName != null
          ? {
              fileName: normalizeFileName(sourceFileName),
              lineNumber: Number.parseInt(sourceLineNumber, 10),
            }
          : null,
    });
  }
  return result;
}

function normalizeFileName(fileName: string): string {
  // DevTools injects zero-width spaces to control formatting in the console.
  return fileName.replace(/\u200B/g, '');
}
