/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import Button from 'react-devtools-shared/src/devtools/views/Button';
import ButtonIcon from 'react-devtools-shared/src/devtools/views/ButtonIcon';

import type {ReactFunctionLocation} from 'shared/ReactTypes';

import {checkConditions} from '../Editor/utils';

type Props = {
  editorURL: string,
  source: ReactFunctionLocation,
  symbolicatedSourcePromise: Promise<ReactFunctionLocation | null>,
};

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
