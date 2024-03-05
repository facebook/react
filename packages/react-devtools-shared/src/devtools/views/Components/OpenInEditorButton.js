/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';

import Button from 'react-devtools-shared/src/devtools/views/Button';
import ButtonIcon from 'react-devtools-shared/src/devtools/views/ButtonIcon';

import type {Source} from 'react-devtools-shared/src/shared/types';

type Props = {
  editorURL: string,
  source: Source,
  symbolicatedSourcePromise: Promise<Source | null>,
};

function checkConditions(
  editorURL: string,
  source: Source,
): {url: URL | null, shouldDisableButton: boolean} {
  try {
    const url = new URL(editorURL);

    let sourceURL = source.sourceURL;

    // Check if sourceURL is a correct URL, which has a protocol specified
    if (sourceURL.includes('://')) {
      if (!__IS_INTERNAL_VERSION__) {
        // In this case, we can't really determine the path to a file, disable a button
        return {url: null, shouldDisableButton: true};
      } else {
        const endOfSourceMapURLPattern = '.js/';
        const endOfSourceMapURLIndex = sourceURL.lastIndexOf(
          endOfSourceMapURLPattern,
        );

        if (endOfSourceMapURLIndex === -1) {
          return {url: null, shouldDisableButton: true};
        } else {
          sourceURL = sourceURL.slice(
            endOfSourceMapURLIndex + endOfSourceMapURLPattern.length,
            sourceURL.length,
          );
        }
      }
    }

    const lineNumberAsString = String(source.line);

    url.href = url.href
      .replace('{path}', sourceURL)
      .replace('{line}', lineNumberAsString)
      .replace('%7Bpath%7D', sourceURL)
      .replace('%7Bline%7D', lineNumberAsString);

    return {url, shouldDisableButton: false};
  } catch (e) {
    // User has provided incorrect editor url
    return {url: null, shouldDisableButton: true};
  }
}

function OpenInEditorButton({
  editorURL,
  source,
  symbolicatedSourcePromise,
}: Props): React.Node {
  const symbolicatedSource = React.use(symbolicatedSourcePromise);

  const {url, shouldDisableButton} = checkConditions(
    editorURL,
    symbolicatedSource ? symbolicatedSource : source,
  );

  return (
    <Button
      disabled={shouldDisableButton}
      onClick={() => window.open(url)}
      title="Open in editor">
      <ButtonIcon type="editor" />
    </Button>
  );
}

export default OpenInEditorButton;
