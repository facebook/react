/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useSyncExternalStore} from 'react';

import portaledContent from '../portaledContent';

import styles from './EditorPane.css';

import OpenInEditorButton from './OpenInEditorButton';
import {getOpenInEditorURL} from '../../../utils';
import {LOCAL_STORAGE_OPEN_IN_EDITOR_URL} from '../../../constants';

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

  return (
    <div className={styles.EditorPane}>
      <OpenInEditorButton editorURL={editorURL} source={selectedSource} />
    </div>
  );
}
export default (portaledContent(EditorPane): React$ComponentType<{}>);
