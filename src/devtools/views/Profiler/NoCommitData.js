// @flow

import React, { useContext } from 'react';
import { ProfilerContext } from './ProfilerContext';
import ToggleCommitFilterModalButton from './ToggleCommitFilterModalButton';

import styles from './NoCommitData.css';

export default function NoCommitData(_: {||}) {
  const { rootHasProfilingData } = useContext(ProfilerContext);

  if (rootHasProfilingData) {
    return (
      <div className={styles.NoCommitData}>
        <p className={styles.Header}>
          There is no data matching the current filter criteria.
        </p>
        <p className={styles.FilterMessage}>
          Try adjusting the commit filter <ToggleCommitFilterModalButton />
        </p>
      </div>
    );
  } else {
    return (
      <div className={styles.NoCommitData}>
        <p className={styles.Header}>
          There is no timing data to display for the currently selected commit.
        </p>
        <p>
          This can indicate that a render occurred too quickly for the timing
          API to measure. Try selecting another commit in the upper, right-hand
          corner.
        </p>
      </div>
    );
  }
}
