// @flow

import React, { Fragment, useContext } from 'react';
import { ProfilerContext } from './ProfilerContext';
import { formatDuration, formatTime } from './utils';
import { StoreContext } from '../context';

import styles from './SidebarInteractions.css';

import type { InteractionWithCommits } from './types';

export type Props = {||};

export default function SidebarInteractions(_: Props) {
  const {
    selectedInteractionID,
    rendererID,
    rootID,
    selectCommitIndex,
    selectTab,
  } = useContext(ProfilerContext);

  const { profilingCache } = useContext(StoreContext);

  if (selectedInteractionID === null) {
    return <div className={styles.NothingSelected}>Nothing selected</div>;
  }

  const interactions = profilingCache.Interactions.read({
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });
  const { commitDurations, commitTimes } = profilingCache.ProfilingSummary.read(
    {
      rendererID: ((rendererID: any): number),
      rootID: ((rootID: any): number),
    }
  );

  const interaction = ((interactions.find(
    interaction => interaction.id === selectedInteractionID
  ): any): InteractionWithCommits);

  const viewCommit = (commitIndex: number) => {
    selectTab('flame-chart');
    selectCommitIndex(commitIndex);
  };

  return (
    <Fragment>
      <div className={styles.Toolbar}>
        <div className={styles.Name}>{interaction.name}</div>
      </div>
      <div className={styles.Content}>
        <ul className={styles.List}>
          {interaction.commits.map(commitIndex => (
            <li
              key={commitIndex}
              className={styles.ListItem}
              onClick={() => viewCommit(commitIndex)}
            >
              timestamp: {formatTime(commitTimes[commitIndex])}s
              <br />
              duration: {formatDuration(commitDurations[commitIndex])}ms
            </li>
          ))}
        </ul>
      </div>
    </Fragment>
  );
}
