/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useContext} from 'react';
import {ProfilerContext} from './ProfilerContext';
import {formatDuration, formatTime} from './utils';
import {StoreContext} from '../context';

import styles from './SidebarCommitInfo.css';

export type Props = {||};

export default function SidebarCommitInfo(_: Props) {
  const {
    selectedCommitIndex,
    rootID,
    selectInteraction,
    selectTab,
  } = useContext(ProfilerContext);

  const {profilerStore} = useContext(StoreContext);

  if (rootID === null || selectedCommitIndex === null) {
    return <div className={styles.NothingSelected}>Nothing selected</div>;
  }

  const {interactions} = profilerStore.getDataForRoot(rootID);
  const {
    duration,
    interactionIDs,
    priorityLevel,
    timestamp,
  } = profilerStore.getCommitData(rootID, selectedCommitIndex);

  const viewInteraction = interactionID => {
    selectTab('interactions');
    selectInteraction(interactionID);
  };

  return (
    <Fragment>
      <div className={styles.Toolbar}>Commit information</div>
      <div className={styles.Content}>
        <ul className={styles.List}>
          {priorityLevel !== null && (
            <li className={styles.ListItem}>
              <label className={styles.Label}>Priority</label>:{' '}
              <span className={styles.Value}>{priorityLevel}</span>
            </li>
          )}
          <li className={styles.ListItem}>
            <label className={styles.Label}>Committed at</label>:{' '}
            <span className={styles.Value}>{formatTime(timestamp)}s</span>
          </li>
          <li className={styles.ListItem}>
            <label className={styles.Label}>Render duration</label>:{' '}
            <span className={styles.Value}>{formatDuration(duration)}ms</span>
          </li>
          <li className={styles.Interactions}>
            <label className={styles.Label}>Interactions</label>:
            <div className={styles.InteractionList}>
              {interactionIDs.length === 0 ? (
                <div className={styles.NoInteractions}>None</div>
              ) : null}
              {interactionIDs.map(interactionID => {
                const interaction = interactions.get(interactionID);
                if (interaction == null) {
                  throw Error(`Invalid interaction "${interactionID}"`);
                }
                return (
                  <button
                    key={interactionID}
                    className={styles.Interaction}
                    onClick={() => viewInteraction(interactionID)}>
                    {interaction.name}
                  </button>
                );
              })}
            </div>
          </li>
        </ul>
      </div>
    </Fragment>
  );
}
