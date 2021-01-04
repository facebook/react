/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useEffect, useMemo, useRef, useState} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeList} from 'react-window';
import SnapshotCommitListItem from './SnapshotCommitListItem';
import {minBarWidth} from './constants';

import styles from './SnapshotCommitList.css';

export type ItemData = {|
  commitDurations: Array<number>,
  commitTimes: Array<number>,
  filteredCommitIndices: Array<number>,
  maxDuration: number,
  selectedCommitIndex: number | null,
  selectedFilteredCommitIndex: number | null,
  selectCommitIndex: (index: number) => void,
  startCommitDrag: (newDragState: DragState) => void,
|};

type Props = {|
  commitDurations: Array<number>,
  commitTimes: Array<number>,
  filteredCommitIndices: Array<number>,
  selectedCommitIndex: number | null,
  selectedFilteredCommitIndex: number | null,
  selectCommitIndex: (index: number) => void,
|};

export default function SnapshotCommitList({
  commitDurations,
  commitTimes,
  filteredCommitIndices,
  selectedCommitIndex,
  selectedFilteredCommitIndex,
  selectCommitIndex,
}: Props) {
  return (
    <AutoSizer>
      {({height, width}) => (
        <List
          commitDurations={commitDurations}
          commitTimes={commitTimes}
          height={height}
          filteredCommitIndices={filteredCommitIndices}
          selectedCommitIndex={selectedCommitIndex}
          selectedFilteredCommitIndex={selectedFilteredCommitIndex}
          selectCommitIndex={selectCommitIndex}
          width={width}
        />
      )}
    </AutoSizer>
  );
}

type ListProps = {|
  commitDurations: Array<number>,
  commitTimes: Array<number>,
  height: number,
  filteredCommitIndices: Array<number>,
  selectedCommitIndex: number | null,
  selectedFilteredCommitIndex: number | null,
  selectCommitIndex: (index: number) => void,
  width: number,
|};

type DragState = {
  commitIndex: number,
  left: number,
  sizeIncrement: number,
};

function List({
  commitDurations,
  selectedCommitIndex,
  commitTimes,
  height,
  filteredCommitIndices,
  selectedFilteredCommitIndex,
  selectCommitIndex,
  width,
}: ListProps) {
  const listRef = useRef<FixedSizeList<ItemData> | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);
  const prevCommitIndexRef = useRef<number | null>(null);

  // Make sure a newly selected snapshot is fully visible within the list.
  useEffect(() => {
    if (selectedFilteredCommitIndex !== prevCommitIndexRef.current) {
      prevCommitIndexRef.current = selectedFilteredCommitIndex;
      if (selectedFilteredCommitIndex !== null && listRef.current !== null) {
        listRef.current.scrollToItem(selectedFilteredCommitIndex);
      }
    }
  }, [listRef, selectedFilteredCommitIndex]);

  const itemSize = useMemo(
    () => Math.max(minBarWidth, width / filteredCommitIndices.length),
    [filteredCommitIndices, width],
  );
  const maxDuration = useMemo(
    () => commitDurations.reduce((max, duration) => Math.max(max, duration), 0),
    [commitDurations],
  );

  const maxCommitIndex = filteredCommitIndices.length - 1;

  const [dragState, setDragState] = useState<DragState | null>(null);

  const handleDragCommit = ({buttons, pageX}: any) => {
    if (buttons === 0) {
      setDragState(null);
      return;
    }

    if (dragState !== null) {
      const {commitIndex, left, sizeIncrement} = dragState;

      let newCommitIndex = commitIndex;
      let newCommitLeft = left;

      if (pageX < newCommitLeft) {
        while (pageX < newCommitLeft) {
          newCommitLeft -= sizeIncrement;
          newCommitIndex -= 1;
        }
      } else {
        let newCommitRectRight = newCommitLeft + sizeIncrement;
        while (pageX > newCommitRectRight) {
          newCommitRectRight += sizeIncrement;
          newCommitIndex += 1;
        }
      }

      if (newCommitIndex < 0) {
        newCommitIndex = 0;
      } else if (newCommitIndex > maxCommitIndex) {
        newCommitIndex = maxCommitIndex;
      }

      selectCommitIndex(newCommitIndex);
    }
  };

  useEffect(() => {
    if (dragState === null) {
      return;
    }

    const element = divRef.current;
    if (element !== null) {
      const ownerDocument = element.ownerDocument;
      ownerDocument.addEventListener('mousemove', handleDragCommit);
      return () => {
        ownerDocument.removeEventListener('mousemove', handleDragCommit);
      };
    }
  }, [dragState]);

  // Pass required contextual data down to the ListItem renderer.
  const itemData = useMemo<ItemData>(
    () => ({
      commitDurations,
      commitTimes,
      filteredCommitIndices,
      maxDuration,
      selectedCommitIndex,
      selectedFilteredCommitIndex,
      selectCommitIndex,
      startCommitDrag: setDragState,
    }),
    [
      commitDurations,
      commitTimes,
      filteredCommitIndices,
      maxDuration,
      selectedCommitIndex,
      selectedFilteredCommitIndex,
      selectCommitIndex,
    ],
  );

  return (
    <div ref={divRef} style={{height, width}}>
      <FixedSizeList
        className={styles.List}
        layout="horizontal"
        height={height}
        itemCount={filteredCommitIndices.length}
        itemData={itemData}
        itemSize={itemSize}
        ref={(listRef: any) /* Flow bug? */}
        width={width}>
        {SnapshotCommitListItem}
      </FixedSizeList>
    </div>
  );
}
