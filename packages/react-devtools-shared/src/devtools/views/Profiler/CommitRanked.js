/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {useCallback, useContext, useMemo} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeList} from 'react-window';
import {ProfilerContext} from './ProfilerContext';
import NoCommitData from './NoCommitData';
import CommitRankedListItem from './CommitRankedListItem';
import {scale} from './utils';
import {StoreContext} from '../context';
import {SettingsContext} from '../Settings/SettingsContext';

import styles from './CommitRanked.css';

import type {ChartData} from './RankedChartBuilder';
import type {CommitTree} from './types';

export type ItemData = {|
  chartData: ChartData,
  scaleX: (value: number, fallbackValue: number) => number,
  selectedFiberID: number | null,
  selectedFiberIndex: number,
  selectFiber: (id: number | null, name: string | null) => void,
  width: number,
|};

export default function CommitRankedAutoSizer(_: {||}) {
  const {profilerStore} = useContext(StoreContext);
  const {rootID, selectedCommitIndex, selectFiber} = useContext(
    ProfilerContext,
  );
  const {profilingCache} = profilerStore;

  const deselectCurrentFiber = useCallback(
    event => {
      event.stopPropagation();
      selectFiber(null, null);
    },
    [selectFiber],
  );

  let commitTree: CommitTree | null = null;
  let chartData: ChartData | null = null;
  if (selectedCommitIndex !== null) {
    commitTree = profilingCache.getCommitTree({
      commitIndex: selectedCommitIndex,
      rootID: ((rootID: any): number),
    });

    chartData = profilingCache.getRankedChartData({
      commitIndex: selectedCommitIndex,
      commitTree,
      rootID: ((rootID: any): number),
    });
  }

  if (commitTree != null && chartData != null && chartData.nodes.length > 0) {
    return (
      <div className={styles.Container} onClick={deselectCurrentFiber}>
        <AutoSizer>
          {({height, width}) => (
            <CommitRanked
              chartData={((chartData: any): ChartData)}
              commitTree={((commitTree: any): CommitTree)}
              height={height}
              width={width}
            />
          )}
        </AutoSizer>
      </div>
    );
  } else {
    return <NoCommitData />;
  }
}

type Props = {|
  chartData: ChartData,
  commitTree: CommitTree,
  height: number,
  width: number,
|};

function CommitRanked({chartData, commitTree, height, width}: Props) {
  const {lineHeight} = useContext(SettingsContext);
  const {selectedFiberID, selectFiber} = useContext(ProfilerContext);

  const selectedFiberIndex = useMemo(
    () => getNodeIndex(chartData, selectedFiberID),
    [chartData, selectedFiberID],
  );

  const itemData = useMemo<ItemData>(
    () => ({
      chartData,
      scaleX: scale(0, chartData.nodes[selectedFiberIndex].value, 0, width),
      selectedFiberID,
      selectedFiberIndex,
      selectFiber,
      width,
    }),
    [chartData, selectedFiberID, selectedFiberIndex, selectFiber, width],
  );

  return (
    <FixedSizeList
      height={height}
      innerElementType="svg"
      itemCount={chartData.nodes.length}
      itemData={itemData}
      itemSize={lineHeight}
      width={width}>
      {CommitRankedListItem}
    </FixedSizeList>
  );
}

const getNodeIndex = (chartData: ChartData, id: number | null): number => {
  if (id === null) {
    return 0;
  }
  const {nodes} = chartData;
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].id === id) {
      return index;
    }
  }
  return 0;
};
