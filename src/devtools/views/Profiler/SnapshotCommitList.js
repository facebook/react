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
  isMouseDown: boolean,
  maxDuration: number,
  selectedCommitIndex: number,
  setCommitIndex: (index: number) => void,
|};

type Props = {|
  commitDurations: Array<number>,
  commitTimes: Array<number>,
  selectedCommitIndex: number,
  setCommitIndex: (index: number) => void,
  viewNextCommit: () => void,
  viewPrevCommit: () => void,
|};

export default function SnapshotCommitList(props: Props) {
  return (
    <AutoSizer>
      {({ height, width }) => <List height={height} width={width} {...props} />}
    </AutoSizer>
  );
}

type ListProps = {|
  height: number,
  commitDurations: Array<number>,
  commitTimes: Array<number>,
  selectedCommitIndex: number,
  setCommitIndex: (index: number) => void,
  viewNextCommit: () => void,
  viewPrevCommit: () => void,
  width: number,
|};

function List({
  height,
  commitDurations,
  commitTimes,
  selectedCommitIndex,
  setCommitIndex,
  viewNextCommit,
  viewPrevCommit,
  width,
}: ListProps) {
  const listRef = useRef<FixedSizeList<ItemData> | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const prevSelectedCommitIndexRef = useRef<number>(-1);

  // Make sure any newly selected snapshot is visible within the list.
  useEffect(() => {
    if (selectedCommitIndex !== prevSelectedCommitIndexRef.current) {
      prevSelectedCommitIndexRef.current = selectedCommitIndex;
      if (listRef.current !== null) {
        listRef.current.scrollToItem(selectedCommitIndex);
      }
    }
  }, [listRef, selectedCommitIndex]);

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
    () => Math.max(minBarWidth, width / commitDurations.length),
    [commitDurations, width]
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
      isMouseDown,
      maxDuration,
      selectedCommitIndex,
      setCommitIndex,
    }),
    [
      commitDurations,
      commitTimes,
      isMouseDown,
      maxDuration,
      selectedCommitIndex,
      setCommitIndex,
    ]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{ height, width }}
    >
      {commitDurations.length > 0 && (
        <FixedSizeList
          direction="horizontal"
          height={height}
          itemCount={commitDurations.length}
          itemData={itemData}
          itemSize={itemSize}
          ref={(listRef: any) /* Flow bug? */}
          width={width}
        >
          {SnapshotCommitListItem}
        </FixedSizeList>
      )}
    </div>
  );
}
