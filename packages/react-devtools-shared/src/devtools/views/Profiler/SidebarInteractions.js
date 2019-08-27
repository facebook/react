/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {Fragment, useContext} from 'react';
import {ProfilerContext} from './ProfilerContext';
import {formatDuration, formatTime} from './utils';
import {StoreContext} from '../context';
import {getGradientColor} from './utils';

import styles from './SidebarInteractions.css';

export type Props = {||};

export default function SidebarInteractions(_: Props) {
  const {
    selectedInteractionID,
    rootID,
    selectCommitIndex,
    selectTab,
  } = useContext(ProfilerContext);

  const {profilerStore} = useContext(StoreContext);
  const {profilingCache} = profilerStore;

  if (selectedInteractionID === null) {
    return <div className={styles.NothingSelected}>Nothing selected</div>;
  }

  const {interactionCommits, interactions} = profilerStore.getDataForRoot(
    ((rootID: any): number),
  );
  const interaction = interactions.get(selectedInteractionID);
  if (interaction == null) {
    throw Error(
      `Could not find interaction by selected interaction id "${selectedInteractionID}"`,
    );
  }

  const {maxCommitDuration} = profilingCache.getInteractionsChartData({
    rootID: ((rootID: any): number),
  });

  const viewCommit = (commitIndex: number) => {
    selectTab('flame-chart');
    selectCommitIndex(commitIndex);
  };

  const listItems: Array<React$Node> = [];
  const commitIndices = interactionCommits.get(selectedInteractionID);
  if (commitIndices != null) {
    commitIndices.forEach(commitIndex => {
      const {duration, timestamp} = profilerStore.getCommitData(
        ((rootID: any): number),
        commitIndex,
      );

      listItems.push(
        <li
          key={commitIndex}
          className={styles.ListItem}
          onClick={() => viewCommit(commitIndex)}>
          <div
            className={styles.CommitBox}
            style={{
              backgroundColor: getGradientColor(
                Math.min(1, Math.max(0, duration / maxCommitDuration)) || 0,
              ),
            }}
          />
          <div>
            timestamp: {formatTime(timestamp)}s
            <br />
            duration: {formatDuration(duration)}ms
          </div>
        </li>,
      );
    });
  }

  return (
    <Fragment>
      <div className={styles.Toolbar}>
        <div className={styles.Name}>{interaction.name}</div>
      </div>
      <div className={styles.Content}>
        <div className={styles.Commits}>Commits:</div>
        <ul className={styles.List}>{listItems}</ul>
      </div>
    </Fragment>
  );
}
