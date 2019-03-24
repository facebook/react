// @flow

import React, { Fragment, useContext } from 'react';
import { ProfilerContext } from './ProfilerContext';
import { formatDuration, formatTime } from './utils';
import { StoreContext } from '../context';

import styles from './SidebarCommitInfo.css';

export type Props = {||};

export default function SidebarCommitInfo(_: Props) {
  const {
    selectedCommitIndex,
    rendererID,
    rootID,
    selectInteraction,
    selectTab,
  } = useContext(ProfilerContext);

  const { profilingCache } = useContext(StoreContext);

  if (selectedCommitIndex === null) {
    return null; // TODO (profiling) Use a better UI
  }

  const { commitDurations, commitTimes } = profilingCache.ProfilingSummary.read(
    {
      rendererID: ((rendererID: any): number),
      rootID: ((rootID: any): number),
    }
  );

  const { interactions } = profilingCache.CommitDetails.read({
    commitIndex: ((selectedCommitIndex: any): number),
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const viewInteraction = interaction => {
    selectTab('interactions');
    selectInteraction(interaction.id);
  };

  return (
    <Fragment>
      <div className={styles.Toolbar}>Commit information</div>
      <div className={styles.Content}>
        <ul className={styles.List}>
          <li className={styles.ListItem}>
            <label className={styles.Label}>Committed at</label>:{' '}
            <span className={styles.Value}>
              {formatTime(commitTimes[((selectedCommitIndex: any): number)])}s
            </span>
          </li>
          <li className={styles.ListItem}>
            <label className={styles.Label}>Render duration</label>:{' '}
            <span className={styles.Value}>
              {formatDuration(
                commitDurations[((selectedCommitIndex: any): number)]
              )}
              ms
            </span>
          </li>
          <li className={styles.InteractionList}>
            <label className={styles.Label}>Interactions</label>:
            <ul className={styles.InteractionList}>
              {interactions.length === 0 ? (
                <li className={styles.InteractionListItem}>None</li>
              ) : null}
              {interactions.map((interaction, index) => (
                <li
                  key={index}
                  className={styles.InteractionListItem}
                  onClick={() => viewInteraction(interaction)}
                >
                  {interaction.name}
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
    </Fragment>
  );
}
