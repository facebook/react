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
import type { CommitDetailsFrontend, CommitTreeFrontend } from './types';

export type ItemData = {|
  chartData: ChartData,
  scaleX: (value: number, fallbackValue: number) => number,
  selectedFiberID: number | null,
  selectedFiberIndex: number,
  selectFiber: (id: number | null, name: string | null) => void,
  width: number,
|};

export default function CommitRankedAutoSizer(_: {||}) {
  const { profilingCache } = useContext(StoreContext);
  const { rendererID, rootID, selectedCommitIndex, selectFiber } = useContext(
    ProfilerContext
  );

  const deselectCurrentFiber = useCallback(
    event => {
      event.stopPropagation();
      selectFiber(null, null);
    },
    [selectFiber]
  );

  const profilingSummary = profilingCache.ProfilingSummary.read({
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  let commitDetails: CommitDetailsFrontend | null = null;
  let commitTree: CommitTreeFrontend | null = null;
  let chartData: ChartData | null = null;
  if (selectedCommitIndex !== null) {
    commitDetails = profilingCache.CommitDetails.read({
      commitIndex: selectedCommitIndex,
      rendererID: ((rendererID: any): number),
      rootID: ((rootID: any): number),
    });

    commitTree = profilingCache.getCommitTree({
      commitIndex: selectedCommitIndex,
      profilingSummary,
    });

    chartData = profilingCache.getRankedChartData({
      commitDetails,
      commitIndex: selectedCommitIndex,
      commitTree,
    });
  }

  if (
    commitDetails != null &&
    commitTree != null &&
    chartData != null &&
    chartData.nodes.length > 0
  ) {
    return (
      <div className={styles.Container} onClick={deselectCurrentFiber}>
        <AutoSizer>
          {({ height, width }) => (
            <CommitRanked
              chartData={((chartData: any): ChartData)}
              commitDetails={((commitDetails: any): CommitDetailsFrontend)}
              commitTree={((commitTree: any): CommitTreeFrontend)}
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
  commitDetails: CommitDetailsFrontend,
  commitTree: CommitTreeFrontend,
  height: number,
  width: number,
|};

function CommitRanked({
  chartData,
  commitDetails,
  commitTree,
  height,
  width,
}: Props) {
  const { selectedFiberID, selectFiber } = useContext(ProfilerContext);

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
