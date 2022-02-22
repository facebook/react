/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import RecordToggle from './RecordToggle';

import styles from './Profiler.css';

export default function RecordingInProgress() {
  return (
    <div className={styles.Column}>
      <div className={styles.Header}>Profiling is in progress...</div>
      <div className={styles.Row}>
        Click the record button <RecordToggle /> to stop recording.
      </div>
    </div>
  );
}
