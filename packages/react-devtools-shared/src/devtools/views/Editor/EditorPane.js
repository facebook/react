/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import portaledContent from '../portaledContent';

import styles from './EditorPane.css';

export type SourceSelection = {
  url: string,
  // The selection is a ref so that we don't have to rerender every keystroke.
  selectionRef: {
    line: number,
    column: number,
  },
};

function EditorPane(props: {selectedSource: ?SourceSelection}) {
  return <div className={styles.EditorPane}>Hello World</div>;
}
export default (portaledContent(EditorPane): React$ComponentType<{}>);
