// @flow

import React, { Fragment, useContext } from 'react';
import { ProfilerContext } from './ProfilerContext';
import { formatDuration, formatTime } from './utils';
import { StoreContext } from '../context';
import { getGradientColor } from './utils';

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

  const profilingSummary = profilingCache.ProfilingSummary.read({
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const { maxCommitDuration } = profilingCache.getInteractionsChartData({
    interactions,
    profilingSummary,
    rootID: ((rootID: any): number),
  });

  const { commitDurations, commitTimes } = profilingSummary;

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
        <div className={styles.Commits}>Commits:</div>
        <ul className={styles.List}>
          {interaction.commits.map(commitIndex => (
            <li
              key={commitIndex}
              className={styles.ListItem}
              onClick={() => viewCommit(commitIndex)}
            >
              <div
                className={styles.CommitBox}
                style={{
                  backgroundColor: getGradientColor(
                    Math.min(
                      1,
                      Math.max(
                        0,
                        commitDurations[commitIndex] / maxCommitDuration
                      )
                    ) || 0
                  ),
                }}
              />
              <div>
                timestamp: {formatTime(commitTimes[commitIndex])}s
                <br />
                duration: {formatDuration(commitDurations[commitIndex])}ms
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Fragment>
  );
}
