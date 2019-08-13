// @flow

import React, { forwardRef, useCallback, useContext, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { ProfilerContext } from './ProfilerContext';
import NoCommitData from './NoCommitData';
import CommitFlamegraphListItem from './CommitFlamegraphListItem';
import { scale } from './utils';
import { StoreContext } from '../context';
import { SettingsContext } from '../Settings/SettingsContext';

import styles from './CommitFlamegraph.css';

import type { ChartData, ChartNode } from './FlamegraphChartBuilder';
import type { CommitTree } from './types';

export type ItemData = {|
  chartData: ChartData,
  scaleX: (value: number, fallbackValue: number) => number,
  selectedChartNode: ChartNode | null,
  selectedChartNodeIndex: number,
  selectFiber: (id: number | null, name: string | null) => void,
  width: number,
|};

export default function CommitFlamegraphAutoSizer(_: {||}) {
  const { profilerStore } = useContext(StoreContext);
  const { rootID, selectedCommitIndex, selectFiber } = useContext(
    ProfilerContext
  );
  const { profilingCache } = profilerStore;

  const deselectCurrentFiber = useCallback(
    event => {
      event.stopPropagation();
      selectFiber(null, null);
    },
    [selectFiber]
  );

  let commitTree: CommitTree | null = null;
  let chartData: ChartData | null = null;
  if (selectedCommitIndex !== null) {
    commitTree = profilingCache.getCommitTree({
      commitIndex: selectedCommitIndex,
      rootID: ((rootID: any): number),
    });

    chartData = profilingCache.getFlamegraphChartData({
      commitIndex: selectedCommitIndex,
      commitTree,
      rootID: ((rootID: any): number),
    });
  }

  if (commitTree != null && chartData != null && chartData.depth > 0) {
    return (
      <div className={styles.Container} onClick={deselectCurrentFiber}>
        <AutoSizer>
          {({ height, width }) => (
            // Force Flow types to avoid checking for `null` here because there's no static proof that
            // by the time this render prop function is called, the values of the `let` variables have not changed.
            <CommitFlamegraph
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

function CommitFlamegraph({ chartData, commitTree, height, width }: Props) {
  const { lineHeight } = useContext(SettingsContext);
  const { selectFiber, selectedFiberID } = useContext(ProfilerContext);

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
      const foundChartNode = chartData.rows[selectedChartNodeIndex].find(
        chartNode => chartNode.id === selectedFiberID
      );

      if (foundChartNode !== undefined) {
        chartNode = foundChartNode;
      }
    }
    return chartNode;
  }, [chartData, selectedFiberID, selectedChartNodeIndex]);

  const itemData = useMemo<ItemData>(
    () => ({
      chartData,
      scaleX: scale(
        0,
        selectedChartNode !== null
          ? selectedChartNode.treeBaseDuration
          : chartData.baseDuration,
        0,
        width
      ),
      selectedChartNode,
      selectedChartNodeIndex,
      selectFiber,
      width,
    }),
    [chartData, selectedChartNode, selectedChartNodeIndex, selectFiber, width]
  );

  return (
    <FixedSizeList
      height={height}
      innerElementType={InnerElementType}
      itemCount={chartData.depth}
      itemData={itemData}
      itemSize={lineHeight}
      width={width}
    >
      {CommitFlamegraphListItem}
    </FixedSizeList>
  );
}

const InnerElementType = forwardRef(({ children, ...rest }, ref) => (
  <svg ref={ref} {...rest}>
    <defs>
      <pattern
        id="didNotRenderPattern"
        patternUnits="userSpaceOnUse"
        width="4"
        height="4"
      >
        <path
          d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
          className={styles.PatternPath}
        />
      </pattern>
    </defs>
    {children}
  </svg>
));
