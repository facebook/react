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

export default function NoProfilingData(): React.Node {
  return (
    <div className={styles.Column}>
      <div className={styles.Header}>No profiling data has been recorded.</div>
      <div className={styles.Row}>
        Click the record button <RecordToggle /> to start recording.
      </div>
      <div className={`${styles.Row} ${styles.LearnMoreRow}`}>
        Click{' '}
        <a
          className={styles.LearnMoreLink}
          href="https://fb.me/react-devtools-profiling"
          rel="noopener noreferrer"
          target="_blank">
          here
        </a>{' '}
        to learn more about profiling.
      </div>
    </div>
  );
}
