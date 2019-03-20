// @flow

import React, { useCallback, useContext, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { ProfilerContext } from './ProfilerContext';
import NoCommitData from './NoCommitData';
import CommitRankedListItem from './CommitRankedListItem';
import { barHeight } from './constants';
import { scale } from './utils';
import { StoreContext } from '../context';

import styles from './CommitRanked.css';

import type { ChartData } from './RankedChartBuilder';

export type ItemData = {|
  chartData: ChartData,
  scaleX: (value: number, fallbackValue: number) => number,
  selectedFiberID: number | null,
  selectedFiberIndex: number,
  selectFiber: (id: number | null) => void,
  width: number,
|};

export default function CommitRankedAutoSizer(_: {||}) {
  const { selectFiber } = useContext(ProfilerContext);
  const deselectCurrentFiber = useCallback(
    event => {
      event.stopPropagation();
      selectFiber(null);
    },
    [selectFiber]
  );

  return (
    <div className={styles.Container} onClick={deselectCurrentFiber}>
      <AutoSizer>
        {({ height, width }) => <CommitRanked height={height} width={width} />}
      </AutoSizer>
    </div>
  );
}

function CommitRanked({ height, width }: {| height: number, width: number |}) {
  const {
    rendererID,
    rootID,
    selectedCommitIndex,
    selectedFiberID,
    selectFiber,
  } = useContext(ProfilerContext);

  const { profilingCache } = useContext(StoreContext);

  const profilingSummary = profilingCache.ProfilingSummary.read({
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const commitDetails = profilingCache.CommitDetails.read({
    commitIndex: ((selectedCommitIndex: any): number),
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const commitTree = profilingCache.getCommitTree({
    commitIndex: ((selectedCommitIndex: any): number),
    profilingSummary,
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const chartData = profilingCache.getRankedChartData({
    commitDetails,
    commitIndex: ((selectedCommitIndex: any): number),
    commitTree,
    rootID: ((rootID: any): number),
  });

  const selectedFiberIndex = useMemo(
    () => getNodeIndex(chartData, selectedFiberID),
    [chartData, selectedFiberID]
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
    [chartData, selectedFiberID, selectedFiberIndex, selectFiber, width]
  );

  // If a commit contains no fibers with an actualDuration > 0,
  // Display a fallback message.
  if (chartData.nodes.length === 0) {
    return <NoCommitData height={height} width={width} />;
  }

  return (
    <FixedSizeList
      height={height}
      innerElementType="svg"
      itemCount={chartData.nodes.length}
      itemData={itemData}
      itemSize={barHeight}
      width={width}
    >
      {CommitRankedListItem}
    </FixedSizeList>
  );
}

const getNodeIndex = (chartData: ChartData, id: number | null): number => {
  if (id === null) {
    return 0;
  }
  const { nodes } = chartData;
  for (let index = 0; index < nodes.length; index++) {
    if (nodes[index].id === id) {
      return index;
    }
  }
  return 0;
};
