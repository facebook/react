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
  const { profilingCache } = useContext(StoreContext);
  const {
    rendererID,
    rootID,
    selectCommitIndex,
    selectedCommitIndex,
    selectedFiberID,
    selectedFiberName,
    selectFiber,
  } = useContext(ProfilerContext);

  const { commitTimes } = profilingCache.ProfilingSummary.read({
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const { commitDurations } = profilingCache.FiberCommits.read({
    fiberID: ((selectedFiberID: any): number),
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const listItems = [];
  for (let i = 0; i < commitDurations.length; i += 2) {
    const commitIndex = commitDurations[i];
    const duration = commitDurations[i + 1];
    const time = commitTimes[commitIndex];

    listItems.push(
      <li
        key={commitIndex}
        className={
          selectedCommitIndex === commitIndex
            ? styles.CurrentListItem
            : styles.ListItem
        }
        onClick={() => selectCommitIndex(commitIndex)}
      >
        {formatTime(time)}s for {formatDuration(duration)}ms
      </li>
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
        <label className={styles.Label}>Rendered at</label>:
        <ul className={styles.List}>{listItems}</ul>
      </div>
    </Fragment>
  );
}
