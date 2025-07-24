/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useSyncExternalStore, useState, startTransition} from 'react';

import portaledContent from '../portaledContent';

import styles from './EditorPane.css';

import Button from 'react-devtools-shared/src/devtools/views/Button';
import ButtonIcon from 'react-devtools-shared/src/devtools/views/ButtonIcon';

import OpenInEditorButton from './OpenInEditorButton';
import {getOpenInEditorURL} from '../../../utils';
import {LOCAL_STORAGE_OPEN_IN_EDITOR_URL} from '../../../constants';

import EditorSettings from './EditorSettings';

export type SourceSelection = {
  url: string,
  // The selection is a ref so that we don't have to rerender every keystroke.
  selectionRef: {
    line: number,
    column: number,
  },
};

export type Props = {selectedSource: ?SourceSelection};

function EditorPane({selectedSource}: Props) {
  const [showSettings, setShowSettings] = useState(false);

  const editorURL = useSyncExternalStore(
    function subscribe(callback) {
      window.addEventListener(LOCAL_STORAGE_OPEN_IN_EDITOR_URL, callback);
      return function unsubscribe() {
        window.removeEventListener(LOCAL_STORAGE_OPEN_IN_EDITOR_URL, callback);
      };
    },
    function getState() {
      return getOpenInEditorURL();
    },
  );

  if (showSettings) {
    return (
      <div className={styles.EditorPane}>
        <EditorSettings />
        <div className={styles.VRule} />
        <Button onClick={() => startTransition(() => setShowSettings(false))}>
          <ButtonIcon type="close" />
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.EditorPane}>
      <OpenInEditorButton
        className={styles.WideButton}
        editorURL={editorURL}
        source={selectedSource}
      />
      <div className={styles.VRule} />
      <Button
        onClick={() => startTransition(() => setShowSettings(true))}
        // We don't use the title here because we don't have enough space to show it.
        // Once we expand this pane we can add it.
        // title="Configure code editor"
      >
        <ButtonIcon type="settings" />
      </Button>
    </div>
  );
}
export default (portaledContent(EditorPane): React$ComponentType<{}>);
