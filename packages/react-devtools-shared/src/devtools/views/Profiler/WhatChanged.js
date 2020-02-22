/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext} from 'react';
import {ProfilerContext} from '../Profiler/ProfilerContext';
import {StoreContext} from '../context';

import styles from './WhatChanged.css';

type Props = {|
  fiberID: number,
|};

export default function WhatChanged({fiberID}: Props) {
  const {profilerStore} = useContext(StoreContext);
  const {rootID, selectedCommitIndex} = useContext(ProfilerContext);

  // TRICKY
  // Handle edge case where no commit is selected because of a min-duration filter update.
  // If the commit index is null, suspending for data below would throw an error.
  // TODO (ProfilerContext) This check should not be necessary.
  if (selectedCommitIndex === null) {
    return null;
  }

  const {changeDescriptions} = profilerStore.getCommitData(
    ((rootID: any): number),
    selectedCommitIndex,
  );

  if (changeDescriptions === null) {
    return null;
  }

  const changeDescription = changeDescriptions.get(fiberID);
  if (changeDescription == null) {
    return null;
  }

  if (changeDescription.isFirstMount) {
    return (
      <div className={styles.Component}>
        <label className={styles.Label}>Why did this render?</label>
        <div className={styles.Item}>
          This is the first time the component rendered.
        </div>
      </div>
    );
  }

  const changes = [];

  if (changeDescription.context === true) {
    changes.push(
      <div key="context" className={styles.Item}>
        • Context changed
      </div>,
    );
  } else if (
    typeof changeDescription.context === 'object' &&
    changeDescription.context !== null &&
    changeDescription.context.length !== 0
  ) {
    changes.push(
      <div key="context" className={styles.Item}>
        • Context changed:
        {changeDescription.context.map(key => (
          <span key={key} className={styles.Key}>
            {key}
          </span>
        ))}
      </div>,
    );
  }

  if (changeDescription.didHooksChange) {
    changes.push(
      <div key="hooks" className={styles.Item}>
        • Hooks changed
      </div>,
    );
  }

  if (
    changeDescription.props !== null &&
    changeDescription.props.length !== 0
  ) {
    changes.push(
      <div key="props" className={styles.Item}>
        • Props changed:
        {changeDescription.props.map(key => (
          <span key={key} className={styles.Key}>
            {key}
          </span>
        ))}
      </div>,
    );
  }

  if (
    changeDescription.state !== null &&
    changeDescription.state.length !== 0
  ) {
    changes.push(
      <div key="state" className={styles.Item}>
        • State changed:
        {changeDescription.state.map(key => (
          <span key={key} className={styles.Key}>
            {key}
          </span>
        ))}
      </div>,
    );
  }

  if (changes.length === 0) {
    changes.push(
      <div key="nothing" className={styles.Item}>
        The parent component rendered.
      </div>,
    );
  }

  return (
    <div className={styles.Component}>
      <label className={styles.Label}>Why did this render?</label>
      {changes}
    </div>
  );
}
