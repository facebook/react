/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useContext} from 'react';
import {ProfilerContext} from './ProfilerContext';
import Updaters from './Updaters';
import {formatDuration, formatTime} from './utils';
import {StoreContext} from '../context';
import {getCommitTree} from './CommitTreeBuilder';

import styles from './SidebarCommitInfo.css';

export type Props = {};

export default function SidebarCommitInfo(_: Props): React.Node {
  const {selectedCommitIndex, rootID} = useContext(ProfilerContext);

  const {profilerStore} = useContext(StoreContext);

  if (rootID === null || selectedCommitIndex === null) {
    return <div className={styles.NothingSelected}>Nothing selected</div>;
  }

  const {
    duration,
    effectDuration,
    passiveEffectDuration,
    priorityLevel,
    timestamp,
    updaters,
  } = profilerStore.getCommitData(rootID, selectedCommitIndex);

  const hasCommitPhaseDurations =
    effectDuration !== null || passiveEffectDuration !== null;

  const commitTree =
    updaters !== null
      ? getCommitTree({
          commitIndex: selectedCommitIndex,
          profilerStore,
          rootID,
        })
      : null;

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

          {!hasCommitPhaseDurations && (
            <li className={styles.ListItem}>
              <label className={styles.Label}>Render duration</label>:{' '}
              <span className={styles.Value}>{formatDuration(duration)}ms</span>
            </li>
          )}

          {hasCommitPhaseDurations && (
            <li className={styles.ListItem}>
              <label className={styles.Label}>Durations</label>
              <ul className={styles.DurationsList}>
                <li className={styles.DurationsListItem}>
                  <label className={styles.Label}>Render</label>:{' '}
                  <span className={styles.Value}>
                    {formatDuration(duration)}ms
                  </span>
                </li>
                {effectDuration !== null && (
                  <li className={styles.DurationsListItem}>
                    <label className={styles.Label}>Layout effects</label>:{' '}
                    <span className={styles.Value}>
                      {formatDuration(effectDuration)}ms
                    </span>
                  </li>
                )}
                {passiveEffectDuration !== null && (
                  <li className={styles.DurationsListItem}>
                    <label className={styles.Label}>Passive effects</label>:{' '}
                    <span className={styles.Value}>
                      {formatDuration(passiveEffectDuration)}ms
                    </span>
                  </li>
                )}
              </ul>
            </li>
          )}

          {updaters !== null && commitTree !== null && (
            <li className={styles.ListItem}>
              <label className={styles.Label}>What caused this update</label>?
              <Updaters commitTree={commitTree} updaters={updaters} />
            </li>
          )}
        </ul>
      </div>
    </Fragment>
  );
}
