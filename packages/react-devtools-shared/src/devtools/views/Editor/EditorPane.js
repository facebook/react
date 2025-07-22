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

function EditorPane(_: {}) {
  return <div className={styles.EditorPane}>Hello World</div>;
}
export default (portaledContent(EditorPane): React$ComponentType<{}>);
