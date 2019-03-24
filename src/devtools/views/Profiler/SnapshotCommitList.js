// @flow

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import SnapshotCommitListItem from './SnapshotCommitListItem';
import { minBarWidth } from './constants';

export type ItemData = {|
  commitDurations: Array<number>,
  commitTimes: Array<number>,
  filteredCommitIndices: Array<number>,
  isMouseDown: boolean,
  maxDuration: number,
  selectedCommitIndex: number | null,
  selectedFilteredCommitIndex: number | null,
  selectCommitIndex: (index: number) => void,
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
      {({ height, width }) => (
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

  // When the mouse is down, dragging over a commit should auto-select it.
  // This provides a nice way for users to swipe across a range of commits to compare them.
  const [isMouseDown, setIsMouseDown] = useState(false);
  const handleMouseDown = useCallback(() => {
    setIsMouseDown(true);
  }, []);
  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
  }, []);
  useEffect(() => {
    if (divRef.current === null) {
      return () => {};
    }

    // It's important to listen to the ownerDocument to support the browser extension.
    // Here we use portals to render individual tabs (e.g. Profiler),
    // and the root document might belong to a different window.
    const ownerDocument = divRef.current.ownerDocument;
    ownerDocument.addEventListener('mouseup', handleMouseUp);
    return () => ownerDocument.removeEventListener('mouseup', handleMouseUp);
  }, [divRef, handleMouseUp]);

  const itemSize = useMemo(
    () => Math.max(minBarWidth, width / filteredCommitIndices.length),
    [filteredCommitIndices, width]
  );
  const maxDuration = useMemo(
    () =>
      commitDurations.reduce(
        (maxDuration, duration) => Math.max(maxDuration, duration),
        0
      ),
    [commitDurations]
  );

  // Pass required contextual data down to the ListItem renderer.
  const itemData = useMemo<ItemData>(
    () => ({
      commitDurations,
      commitTimes,
      filteredCommitIndices,
      isMouseDown,
      maxDuration,
      selectedCommitIndex,
      selectedFilteredCommitIndex,
      selectCommitIndex,
    }),
    [
      commitDurations,
      commitTimes,
      filteredCommitIndices,
      isMouseDown,
      maxDuration,
      selectedCommitIndex,
      selectedFilteredCommitIndex,
      selectCommitIndex,
    ]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      ref={divRef}
      style={{ height, width }}
    >
      <FixedSizeList
        direction="horizontal"
        height={height}
        itemCount={filteredCommitIndices.length}
        itemData={itemData}
        itemSize={itemSize}
        ref={(listRef: any) /* Flow bug? */}
        width={width}
      >
        {SnapshotCommitListItem}
      </FixedSizeList>
    </div>
  );
}
