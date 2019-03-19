// @flow

import React, { Fragment, useContext } from 'react';
import { ProfilerContext } from './ProfilerContext';
import { formatDuration, formatTime } from './utils';
import { StoreContext } from '../context';

import styles from './SidebarCommitInfo.css';

export type Props = {||};

export default function SidebarCommitInfo(_: Props) {
  const { selectedCommitIndex, rendererID, rootID } = useContext(
    ProfilerContext
  );

  const { profilingCache } = useContext(StoreContext);
  const { commitDurations, commitTimes } = profilingCache.ProfilingSummary.read(
    {
      rendererID: ((rendererID: any): number),
      rootID: ((rootID: any): number),
    }
  );

  if (selectedCommitIndex === null) {
    return 'TODO';
  }

  return (
    <Fragment>
      <div className={styles.Toolbar}>Commit information</div>
      <div className={styles.Content}>
        <ul className={styles.List}>
          <li className={styles.ListItem}>
            <label className={styles.Label}>Committed at</label>:{' '}
            <span className={styles.Value}>
              {formatTime(commitTimes[selectedCommitIndex])}s
            </span>
          </li>
          <li className={styles.ListItem}>
            <label className={styles.Label}>Render duration</label>:{' '}
            <span className={styles.Value}>
              {formatDuration(commitDurations[selectedCommitIndex])}ms
            </span>
          </li>
          <li className={styles.ListItem}>
            <label className={styles.Label}>Interactions</label>:
            <ul className={styles.List}>
              <li className={styles.ListItem}>
                <div>Coming soon</div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </Fragment>
  );
}
