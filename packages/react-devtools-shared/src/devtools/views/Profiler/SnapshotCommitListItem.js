/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {memo, useCallback} from 'react';
import {areEqual} from 'react-window';
import {getGradientColor, formatDuration, formatTime} from './utils';

import styles from './SnapshotCommitListItem.css';

import type {ItemData} from './SnapshotCommitList';

type Props = {
  data: ItemData,
  index: number,
  style: Object,
  ...
};

type DragStartCommit = {
  dragStartCommitIndex: number,
  rectLeft: number,
};

function SnapshotCommitListItem({data: itemData, index, style}: Props) {
  const {
    commitDurations,
    commitTimes,
    filteredCommitIndices,
    maxDuration,
    selectedCommitIndex,
    selectCommitIndex,
  } = itemData;

  index = filteredCommitIndices[index];

  const commitDuration = commitDurations[index];
  const commitTime = commitTimes[index];

  const handleClick = useCallback(() => selectCommitIndex(index), [
    index,
    selectCommitIndex,
  ]);

  let dragStartCommit: DragStartCommit | null = null;
  const maxCommitIndex = filteredCommitIndices.length - 1;

  const handleDrag = (e: any) => {
    if (e.buttons === 0) {
      document.removeEventListener('mousemove', handleDrag);
      const iframe = document.querySelector('iframe');
      if (iframe) iframe.style.pointerEvents = 'auto';
      dragStartCommit = null;
      return;
    }
    if (dragStartCommit === null) return;

    let newCommitIndex = index;
    let newCommitRectLeft = dragStartCommit.rectLeft;

    if (e.pageX < dragStartCommit.rectLeft) {
      while (e.pageX < newCommitRectLeft) {
        newCommitRectLeft = newCommitRectLeft - 1 - width;
        newCommitIndex -= 1;
      }
    } else {
      let newCommitRectRight = newCommitRectLeft + 1 + width;
      while (e.pageX > newCommitRectRight) {
        newCommitRectRight = newCommitRectRight + 1 + width;
        newCommitIndex += 1;
      }
    }

    if (newCommitIndex < 0) {
      newCommitIndex = 0;
    } else if (newCommitIndex > maxCommitIndex) {
      newCommitIndex = maxCommitIndex;
    }
    selectCommitIndex(newCommitIndex);
  };

  const handleMouseDown = (e: any) => {
    handleClick();
    document.addEventListener('mousemove', handleDrag);
    const iframe = document.querySelector('iframe');
    if (iframe) iframe.style.pointerEvents = 'none';
    const rect = e.target.getBoundingClientRect();
    dragStartCommit = {
      dragStartCommitIndex: index,
      rectLeft: rect.left,
    };
  };

  // Guard against commits with duration 0
  const percentage =
    Math.min(1, Math.max(0, commitDuration / maxDuration)) || 0;
  const isSelected = selectedCommitIndex === index;

  // Leave a 1px gap between snapshots
  const width = parseFloat(style.width) - 1;

  return (
    <div
      className={styles.Outer}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      style={{
        ...style,
        width,
        borderBottom: isSelected
          ? '3px solid var(--color-tab-selected-border)'
          : undefined,
      }}
      title={`Duration ${formatDuration(commitDuration)}ms at ${formatTime(
        commitTime,
      )}s`}>
      <div
        className={styles.Inner}
        style={{
          height: `${Math.round(percentage * 100)}%`,
          backgroundColor:
            percentage > 0 ? getGradientColor(percentage) : undefined,
        }}
      />
    </div>
  );
}

export default memo<Props>(SnapshotCommitListItem, areEqual);
