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
  setSelectedCommitIndex: (index: number) => void,
|};

type Props = {|
  commitDurations: Array<number>,
  commitTimes: Array<number>,
  filteredCommitIndices: Array<number>,
  selectedCommitIndex: number | null,
  selectedFilteredCommitIndex: number | null,
  setSelectedCommitIndex: (index: number) => void,
|};

export default function SnapshotCommitList({
  commitDurations,
  commitTimes,
  filteredCommitIndices,
  selectedCommitIndex,
  selectedFilteredCommitIndex,
  setSelectedCommitIndex,
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
          setSelectedCommitIndex={setSelectedCommitIndex}
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
  setSelectedCommitIndex: (index: number) => void,
  width: number,
|};

function List({
  commitDurations,
  selectedCommitIndex,
  commitTimes,
  height,
  filteredCommitIndices,
  selectedFilteredCommitIndex,
  setSelectedCommitIndex,
  width,
}: ListProps) {
  const listRef = useRef<FixedSizeList<ItemData> | null>(null);
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
  // TODO (profiling) This interaction may not feel as nice with suspense; reconsider it?
  const [isMouseDown, setIsMouseDown] = useState(false);
  const handleMouseDown = useCallback(() => {
    setIsMouseDown(true);
  }, []);
  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
  }, []);
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

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
      setSelectedCommitIndex,
    }),
    [
      commitDurations,
      commitTimes,
      filteredCommitIndices,
      isMouseDown,
      maxDuration,
      selectedCommitIndex,
      selectedFilteredCommitIndex,
      setSelectedCommitIndex,
    ]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
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
