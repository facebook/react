/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {
  LOCAL_STORAGE_OPEN_IN_EDITOR_URL,
  LOCAL_STORAGE_OPEN_IN_EDITOR_URL_PRESET,
} from '../../../constants';
import {useLocalStorage} from '../hooks';
import {getDefaultOpenInEditorURL} from 'react-devtools-shared/src/utils';

import styles from './SettingsShared.css';

const vscodeFilepath = 'vscode://file/{path}:{line}';

export default function ComponentsSettings({
  environmentNames,
}: {
  environmentNames: Promise<Array<string>>,
}): React.Node {
  const [openInEditorURLPreset, setOpenInEditorURLPreset] = useLocalStorage<
    'vscode' | 'custom',
  >(LOCAL_STORAGE_OPEN_IN_EDITOR_URL_PRESET, 'custom');

  const [openInEditorURL, setOpenInEditorURL] = useLocalStorage<string>(
    LOCAL_STORAGE_OPEN_IN_EDITOR_URL,
    getDefaultOpenInEditorURL(),
  );

  return (
    <>
      <select
        value={openInEditorURLPreset}
        onChange={({currentTarget}) => {
          const selectedValue = currentTarget.value;
          setOpenInEditorURLPreset(selectedValue);
          if (selectedValue === 'vscode') {
            setOpenInEditorURL(vscodeFilepath);
          } else if (selectedValue === 'custom') {
            setOpenInEditorURL('');
          }
        }}>
        <option value="vscode">VS Code</option>
        <option value="custom">Custom</option>
      </select>
      {openInEditorURLPreset === 'custom' && (
        <input
          className={styles.Input}
          type="text"
          placeholder={process.env.EDITOR_URL ? process.env.EDITOR_URL : ''}
          value={openInEditorURL}
          onChange={event => {
            setOpenInEditorURL(event.target.value);
          }}
        />
      )}
    </>
  );
}
