// @flow

import React, { memo, useCallback } from 'react';
import { areEqual } from 'react-window';
import { getGradientColor, formatDuration, formatTime } from './utils';

import type { ItemData } from './SnapshotCommitList';

type Props = {
  data: ItemData,
  index: number,
  style: Object,
};

function SnapshotCommitListItem({ data: itemData, index, style }: Props) {
  const {
    commitDurations,
    commitTimes,
    isMouseDown,
    maxDuration,
    selectedCommitIndex,
    setCommitIndex,
  } = itemData;

  const commitDuration = commitDurations[index];
  const commitTime = commitTimes[index];

  const handleClick = useCallback(() => setCommitIndex(index), [
    index,
    setCommitIndex,
  ]);

  // Guard against commits with duration 0
  const percentage =
    Math.min(1, Math.max(0, commitDuration / maxDuration)) || 0;
  const isSelected = selectedCommitIndex === index;

  // Leave a 1px gap between snapshots
  const width = parseFloat(style.width) - 1;

  return (
    <div
      onClick={handleClick}
      onMouseEnter={isMouseDown ? handleClick : null}
      style={{
        ...style,
        width,
        userSelect: 'none',
        cursor: 'pointer',
        borderBottom: isSelected
          ? '3px solid var(--color-tree-node-selected)'
          : '3px solid transparent',
        paddingTop: 4,
        paddingBottom: 1,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      title={`Duration ${formatDuration(commitDuration)}ms at ${formatTime(
        commitTime
      )}s`}
    >
      <div
        style={{
          width,
          height: `${Math.round(percentage * 100)}%`,
          minHeight: 5,
          backgroundColor:
            percentage === 0
              ? 'var(--color-commit-did-not-render)'
              : getGradientColor(percentage),
        }}
      />
    </div>
  );
}

export default memo<Props>(SnapshotCommitListItem, areEqual);
