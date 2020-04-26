/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeList} from 'react-window';
import {ProfilerContext} from './ProfilerContext';
import NoCommitData from './NoCommitData';
import CommitFlamegraphListItem from './CommitFlamegraphListItem';
import HoveredFiberInfo from './HoveredFiberInfo';
import {scale} from './utils';
import {StoreContext} from '../context';
import {SettingsContext} from '../Settings/SettingsContext';
import Tooltip from './Tooltip';

import styles from './CommitFlamegraph.css';

import type {TooltipFiberData} from './HoveredFiberInfo';
import type {ChartData, ChartNode} from './FlamegraphChartBuilder';
import type {CommitTree} from './types';

export type ItemData = {|
  chartData: ChartData,
  hoverFiber: (fiberData: TooltipFiberData | null) => void,
  scaleX: (value: number, fallbackValue: number) => number,
  selectedChartNode: ChartNode | null,
  selectedChartNodeIndex: number,
  selectFiber: (id: number | null, name: string | null) => void,
  width: number,
|};

export default function CommitFlamegraphAutoSizer(_: {||}) {
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
          {({height, width}) => (
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

function CommitFlamegraph({chartData, commitTree, height, width}: Props) {
  const [hoveredFiberData, hoverFiber] = useState<TooltipFiberData | null>(
    null,
  );
  const {lineHeight} = useContext(SettingsContext);
  const {selectFiber, selectedFiberID} = useContext(ProfilerContext);
  const chartList = useRef(null);

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
    if (selectedFiberID !== null) {
      return (
        chartData.rows[selectedChartNodeIndex].find(
          chartNode => chartNode.id === selectedFiberID,
        ) || null
      );
    }
    return null;
  }, [chartData, selectedFiberID, selectedChartNodeIndex]);

  const itemData = useMemo<ItemData>(
    () => ({
      chartData,
      hoverFiber,
      scaleX: scale(
        0,
        selectedChartNode !== null
          ? selectedChartNode.treeBaseDuration
          : chartData.baseDuration,
        0,
        width,
      ),
      selectedChartNode,
      selectedChartNodeIndex,
      selectFiber,
      width,
    }),
    [
      chartData,
      hoverFiber,
      selectedChartNode,
      selectedChartNodeIndex,
      selectFiber,
      width,
    ],
  );

  // Tooltip used to show summary of fiber info on hover
  const tooltipLabel = useMemo(
    () =>
      hoveredFiberData !== null ? (
        <HoveredFiberInfo fiberData={hoveredFiberData} />
      ) : null,
    [hoveredFiberData],
  );

  const goToNextFiberID = useCallback(
    changeIndexInRowBy => {
      const currentRow = chartData.rows[selectedChartNodeIndex];
      const indexInCurrentRow = selectedFiberID
        ? currentRow.findIndex(node => node.id === selectedFiberID)
        : 0;

      let nextIndexInRow = indexInCurrentRow + changeIndexInRowBy;
      let nextChartNodeIndex = selectedChartNodeIndex;
      if (nextIndexInRow < 0) {
        nextChartNodeIndex =
          nextChartNodeIndex === chartData.rows.length - 1
            ? 0
            : nextChartNodeIndex + 1;
        nextIndexInRow = chartData.rows[nextChartNodeIndex].length - 1;
      } else if (nextIndexInRow > currentRow.length - 1) {
        nextChartNodeIndex -= 1;
        nextIndexInRow = 0;
      }

      if (nextChartNodeIndex < 0) {
        nextChartNodeIndex = chartData.rows.length - 1;
        nextIndexInRow = 0;
      }

      if (nextChartNodeIndex > chartData.rows.length - 1) {
        nextChartNodeIndex = 0;
        nextIndexInRow = chartData.rows[0].length - 1;
      }

      selectFiber(chartData.rows[nextChartNodeIndex][nextIndexInRow].id, null);
      if (chartList.current) {
        chartList.current.scrollToItem(nextChartNodeIndex);
      }
    },
    [chartData, selectedChartNodeIndex, selectedFiberID, selectFiber],
  );

  const handleKeyDown = useCallback(
    event => {
      switch (event.key) {
        case 'ArrowUp':
          if (selectedChartNodeIndex > 0 && selectedChartNode) {
            const [parentNode] = chartData.rows[selectedChartNodeIndex - 1]
              .filter(row => row.offset <= selectedChartNode.offset)
              .slice(-1);
            if (parentNode && chartList.current) {
              selectFiber(parentNode.id, parentNode.name);
              chartList.current.scrollToItem(selectedChartNodeIndex - 1);
            }
          }
          event.preventDefault();
          break;
        case 'ArrowRight':
          goToNextFiberID(-1);
          event.preventDefault();
          break;
        case 'ArrowLeft':
          goToNextFiberID(1);
          event.preventDefault();
          break;
        default:
          break;
      }
    },
    [
      chartData,
      selectedChartNodeIndex,
      selectFiber,
      selectedChartNode,
      goToNextFiberID,
    ],
  );

  return (
    <div
      tabIndex={0}
      className={styles.FocusedContainer}
      onKeyDown={handleKeyDown}>
      <Tooltip label={tooltipLabel}>
        <FixedSizeList
          ref={chartList}
          height={height}
          innerElementType={InnerElementType}
          itemCount={chartData.depth}
          itemData={itemData}
          itemSize={lineHeight}
          width={width}>
          {CommitFlamegraphListItem}
        </FixedSizeList>
      </Tooltip>
    </div>
  );
}

const InnerElementType = forwardRef(({children, ...rest}, ref) => (
  <svg ref={ref} {...rest}>
    <defs>
      <pattern
        id="didNotRenderPattern"
        patternUnits="userSpaceOnUse"
        width="4"
        height="4">
        <path
          d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
          className={styles.PatternPath}
        />
      </pattern>
    </defs>
    {children}
  </svg>
));
