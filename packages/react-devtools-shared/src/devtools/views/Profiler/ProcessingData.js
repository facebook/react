/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import styles from './Profiler.css';

export default function ProcessingData(): React.Node {
  return (
    <div className={styles.Column}>
      <div className={styles.Header}>Processing data...</div>
      <div className={styles.Row}>This should only take a minute.</div>
    </div>
  );
}
