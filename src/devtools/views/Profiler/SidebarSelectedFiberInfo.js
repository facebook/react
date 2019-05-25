// @flow

import React, { Fragment, useContext } from 'react';
import { ProfilerContext } from './ProfilerContext';
import { formatDuration, formatTime } from './utils';
import { StoreContext } from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';

import styles from './SidebarSelectedFiberInfo.css';

export type Props = {||};

export default function SidebarSelectedFiberInfo(_: Props) {
  const { profilerStore } = useContext(StoreContext);
  const {
    rootID,
    selectCommitIndex,
    selectedCommitIndex,
    selectedFiberID,
    selectedFiberName,
    selectFiber,
  } = useContext(ProfilerContext);
  const { profilingCache } = profilerStore;

  const commitIndices = profilingCache.getFiberCommits({
    fiberID: ((selectedFiberID: any): number),
    rootID: ((rootID: any): number),
  });

  const listItems = [];
  for (let i = 0; i < commitIndices.length; i += 2) {
    const commitIndex = commitIndices[i];

    const { duration, timestamp } = profilerStore.getCommitData(
      ((rootID: any): number),
      commitIndex
    );

    listItems.push(
      <button
        key={commitIndex}
        className={
          selectedCommitIndex === commitIndex
            ? styles.CurrentCommit
            : styles.Commit
        }
        onClick={() => selectCommitIndex(commitIndex)}
      >
        {formatTime(timestamp)}s for {formatDuration(duration)}ms
      </button>
    );
  }

  return (
    <Fragment>
      <div className={styles.Toolbar}>
        <div className={styles.Component}>
          {selectedFiberName || 'Selected component'}
        </div>

        <Button
          className={styles.IconButton}
          onClick={() => selectFiber(null, null)}
          title="Back to commit view"
        >
          <ButtonIcon type="close" />
        </Button>
      </div>
      <div className={styles.Content}>
        <label className={styles.Label}>Rendered at</label>: {listItems}
      </div>
    </Fragment>
  );
}
