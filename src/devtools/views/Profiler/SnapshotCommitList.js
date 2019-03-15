// @flow

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import SnapshotCommitListItem from './SnapshotCommitListItem';
import { minBarWidth } from './constants';
import { ProfilerDataContext } from './ProfilerDataContext';
import { StoreContext } from '../context';

export type ItemData = {|
  commitDurations: Array<number>,
  commitIndex: number | null,
  commitTimes: Array<number>,
  filteredCommitIndices: Array<number>,
  isMouseDown: boolean,
  maxDuration: number,
  setCommitIndex: (index: number) => void,
|};

type Props = {||};

export default function SnapshotCommitList(_: Props) {
  return (
    <AutoSizer>
      {({ height, width }) => <List height={height} width={width} />}
    </AutoSizer>
  );
}

type ListProps = {|
  height: number,
  width: number,
|};

function List({ height, width }: ListProps) {
  const listRef = useRef<FixedSizeList<ItemData> | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const prevCommitIndexRef = useRef<number | null>(null);

  const { profilingCache } = useContext(StoreContext);
  const {
    commitIndex,
    filteredCommitIndices,
    rendererID,
    rootID,
    setCommitIndex,
  } = useContext(ProfilerDataContext);

  const { commitDurations, commitTimes } = profilingCache.ProfilingSummary.read(
    {
      rendererID: ((rendererID: any): number),
      rootID: ((rootID: any): number),
    }
  );

  // Make sure any newly selected snapshot is visible within the list.
  useEffect(() => {
    if (commitIndex !== prevCommitIndexRef.current) {
      prevCommitIndexRef.current = commitIndex;
      if (commitIndex !== null && listRef.current !== null) {
        listRef.current.scrollToItem(commitIndex);
      }
    }
  }, [listRef, commitIndex]);

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
      commitIndex,
      commitTimes,
      filteredCommitIndices,
      isMouseDown,
      maxDuration,
      setCommitIndex,
    }),
    [
      commitDurations,
      commitIndex,
      commitTimes,
      filteredCommitIndices,
      isMouseDown,
      maxDuration,
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
          itemCount={filteredCommitIndices.length}
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
