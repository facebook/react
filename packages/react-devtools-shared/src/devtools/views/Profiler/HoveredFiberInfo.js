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
import WhatChanged from './WhatChanged';
import {StoreContext} from '../context';

import styles from './HoveredFiberInfo.css';

import type {ChartNode} from './FlamegraphChartBuilder';

export type TooltipFiberData = {|
  id: number,
  name: string,
|};

export type Props = {
  fiberData: ChartNode,
};

export default function HoveredFiberInfo({fiberData}: Props) {
  const {profilerStore} = useContext(StoreContext);
  const {rootID, selectedCommitIndex} = useContext(ProfilerContext);

  const {id, name} = fiberData;
  const {profilingCache} = profilerStore;

  const commitIndices = profilingCache.getFiberCommits({
    fiberID: ((id: any): number),
    rootID: ((rootID: any): number),
  });

  let renderDurationInfo;
  let i = 0;
  for (i = 0; i < commitIndices.length; i++) {
    const commitIndex = commitIndices[i];
    if (selectedCommitIndex === commitIndex) {
      const {duration, timestamp} = profilerStore.getCommitData(
        ((rootID: any): number),
        commitIndex,
      );

      renderDurationInfo = (
        <Fragment>
          <label className={styles.Label}>Rendered at:</label>
          <div key={commitIndex} className={styles.CurrentCommit}>
            {formatTime(timestamp)}s for {formatDuration(duration)}ms
          </div>
        </Fragment>
      );

      break;
    }
  }

  return (
    <Fragment>
      <div className={styles.Toolbar}>
        <div className={styles.Component}>{name}</div>
      </div>
      <div className={styles.Content}>
        <WhatChanged fiberID={((id: any): number)} />
        {renderDurationInfo || (
          <div>Did not render during this profiling session.</div>
        )}
      </div>
    </Fragment>
  );
}
