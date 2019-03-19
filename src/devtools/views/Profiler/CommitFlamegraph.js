// @flow

import React, { useCallback, useContext, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { ProfilerContext } from './ProfilerContext';
import NoCommitData from './NoCommitData';
import CommitFlamegraphListItem from './CommitFlamegraphListItem';
import { barHeight } from './constants';
import { scale } from './utils';
import { StoreContext } from '../context';

import styles from './CommitFlamegraph.css';

import type { ChartData, ChartNode } from './FlamegraphChartBuilder';

export type ItemData = {|
  chartData: ChartData,
  scaleX: (value: number, fallbackValue: number) => number,
  selectedChartNode: ChartNode,
  selectedChartNodeIndex: number,
  selectFiber: (id: number | null) => void,
  width: number,
|};

export default function CommitFlamegraphAutoSizer(_: {||}) {
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
        {({ height, width }) => (
          <CommitFlamegraph height={height} width={width} />
        )}
      </AutoSizer>
    </div>
  );
}

function CommitFlamegraph({
  height,
  width,
}: {|
  height: number,
  width: number,
|}) {
  const {
    rendererID,
    rootID,
    selectedCommitIndex,
    selectFiber,
    selectedFiberID,
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

  const chartData = profilingCache.getFlamegraphChartData({
    commitDetails,
    commitIndex: ((selectedCommitIndex: any): number),
    commitTree,
    rootID: ((rootID: any): number),
  });

  const selectedChartNodeIndex = useMemo<number>(() => {
    if (selectedFiberID === null) {
      return 0;
    }
    // The selected node might not be in the tree for this commit,
    // so it's important that we have a fallback plan.
    const depth = chartData.idToDepthMap.get(selectedFiberID);
    return depth !== undefined ? depth - 1 : 0;
  }, [chartData, selectedFiberID]);

  const selectedChartNode = useMemo(() => {
    let chartNode = null;
    if (selectedFiberID !== null) {
      chartNode = ((chartData.rows[selectedChartNodeIndex].find(
        chartNode => chartNode.id === selectedFiberID
      ): any): ChartNode);
    }
    // The selected node might not be in the tree for this commit,
    // so it's important that we have a fallback plan.
    if (chartNode == null) {
      return chartData.rows[0][0];
    }
    return chartNode;
  }, [chartData, selectedFiberID, selectedChartNodeIndex]);

  const itemData = useMemo<ItemData>(
    () => ({
      chartData,
      scaleX: scale(0, selectedChartNode.treeBaseDuration, 0, width),
      selectedChartNode,
      selectedChartNodeIndex,
      selectFiber,
      width,
    }),
    [chartData, selectedChartNode, selectedChartNodeIndex, selectFiber, width]
  );

  // If a commit contains no fibers with an actualDuration > 0,
  // Display a fallback message.
  if (chartData.depth === 0) {
    return <NoCommitData />;
  }

  return (
    <FixedSizeList
      height={height}
      innerElementType="svg"
      itemCount={chartData.depth}
      itemData={itemData}
      itemSize={barHeight}
      width={width}
    >
      {CommitFlamegraphListItem}
    </FixedSizeList>
  );
}
