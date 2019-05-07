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
        <div className={styles.Header}>
          There is no data matching the current filter criteria.
        </div>
        <div className={styles.FilterMessage}>
          Try adjusting the commit filter <ToggleCommitFilterModalButton />
        </div>
      </div>
    );
  } else {
    return (
      <div className={styles.NoCommitData}>
        <div className={styles.Header}>
          There is no timing data to display for the currently selected commit.
        </div>
        <div>
          This can indicate that a render occurred too quickly for the timing
          API to measure. Try selecting another commit in the upper, right-hand
          corner.
        </div>
      </div>
    );
  }
}
