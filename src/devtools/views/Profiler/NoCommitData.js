// @flow

import React from 'react';

import styles from './NoCommitData.css';

export default function NoCommitData({
  height,
  width,
}: {|
  height: number,
  width: number,
|}) {
  return (
    <div className={styles.NoCommitData} style={{ height, width }}>
      <p className={styles.Header}>
        There is no timing data to display for the currently selected commit.
      </p>
      <p>
        This can indicate that a render occurred too quickly for the timing API
        to measure. Try selecting another commit in the upper, right-hand
        corner.
      </p>
    </div>
  );
}
