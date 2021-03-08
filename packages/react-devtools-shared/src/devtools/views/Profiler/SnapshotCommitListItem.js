/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {memo} from 'react';
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

function SnapshotCommitListItem({data: itemData, index, style}: Props) {
  const {
    commitDurations,
    commitTimes,
    filteredCommitIndices,
    maxDuration,
    selectedCommitIndex,
    selectCommitIndex,
    setHoveredCommitIndex,
    startCommitDrag,
  } = itemData;

  index = filteredCommitIndices[index];

  const commitDuration = commitDurations[index];
  const commitTime = commitTimes[index];

  // Use natural log for bar height.
  // This prevents one (or a few) outliers from squishing the majority of other commits.
  // So rather than e.g. _█_ we get something more like e.g. ▄█_
  const heightScale =
    Math.min(
      1,
      Math.max(0, Math.log(commitDuration) / Math.log(maxDuration)),
    ) || 0;

  // Use a linear scale for color.
  // This gives some visual contrast between cheaper and more expensive commits
  // and somewhat compensates for the log scale height.
  const colorScale =
    Math.min(1, Math.max(0, commitDuration / maxDuration)) || 0;

  const isSelected = selectedCommitIndex === index;

  // Leave a 1px gap between snapshots
  const width = parseFloat(style.width) - 1;

  const handleMouseDown = ({buttons, target}: any) => {
    if (buttons === 1) {
      selectCommitIndex(index);
      startCommitDrag({
        commitIndex: index,
        left: target.getBoundingClientRect().left,
        sizeIncrement: parseFloat(style.width),
      });
    }
  };

  return (
    <div
      className={styles.Outer}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHoveredCommitIndex(index)}
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
          height: `${Math.round(heightScale * 100)}%`,
          backgroundColor:
            commitDuration > 0 ? getGradientColor(colorScale) : undefined,
        }}
      />
    </div>
  );
}

export default memo<Props>(SnapshotCommitListItem, areEqual);
