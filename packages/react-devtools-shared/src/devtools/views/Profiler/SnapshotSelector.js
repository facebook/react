/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {Fragment, useCallback, useContext, useMemo} from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import {ProfilerContext} from './ProfilerContext';
import SnapshotCommitList from './SnapshotCommitList';
import {maxBarWidth} from './constants';
import {StoreContext} from '../context';

import styles from './SnapshotSelector.css';

export type Props = {||};

export default function SnapshotSelector(_: Props) {
  const {
    isCommitFilterEnabled,
    minCommitDuration,
    rootID,
    selectedCommitIndex,
    selectCommitIndex,
  } = useContext(ProfilerContext);

  const {profilerStore} = useContext(StoreContext);
  const {commitData} = profilerStore.getDataForRoot(((rootID: any): number));

  const commitDurations: Array<number> = [];
  const commitTimes: Array<number> = [];
  commitData.forEach(commitDatum => {
    commitDurations.push(commitDatum.duration);
    commitTimes.push(commitDatum.timestamp);
  });

  const filteredCommitIndices = useMemo(
    () =>
      commitData.reduce((reduced, commitDatum, index) => {
        if (
          !isCommitFilterEnabled ||
          commitDatum.duration >= minCommitDuration
        ) {
          reduced.push(index);
        }
        return reduced;
      }, []),
    [commitData, isCommitFilterEnabled, minCommitDuration],
  );

  const numFilteredCommits = filteredCommitIndices.length;

  // Map the (unfiltered) selected commit index to an index within the filtered data.
  const selectedFilteredCommitIndex = useMemo(
    () => {
      if (selectedCommitIndex !== null) {
        for (let i = 0; i < filteredCommitIndices.length; i++) {
          if (filteredCommitIndices[i] === selectedCommitIndex) {
            return i;
          }
        }
      }
      return null;
    },
    [filteredCommitIndices, selectedCommitIndex],
  );

  // TODO (ProfilerContext) This should be managed by the context controller (reducer).
  // It doesn't currently know about the filtered commits though (since it doesn't suspend).
  // Maybe this component should pass filteredCommitIndices up?
  if (selectedFilteredCommitIndex === null) {
    if (numFilteredCommits > 0) {
      selectCommitIndex(0);
    } else {
      selectCommitIndex(null);
    }
  } else if (selectedFilteredCommitIndex >= numFilteredCommits) {
    selectCommitIndex(numFilteredCommits === 0 ? null : numFilteredCommits - 1);
  }

  let label = null;
  if (numFilteredCommits > 0) {
    label =
      `${selectedFilteredCommitIndex + 1}`.padStart(
        `${numFilteredCommits}`.length,
        '0',
      ) +
      ' / ' +
      numFilteredCommits;
  }

  const viewNextCommit = useCallback(
    () => {
      const nextCommitIndex = Math.min(
        ((selectedFilteredCommitIndex: any): number) + 1,
        filteredCommitIndices.length - 1,
      );
      selectCommitIndex(filteredCommitIndices[nextCommitIndex]);
    },
    [selectedFilteredCommitIndex, filteredCommitIndices, selectCommitIndex],
  );
  const viewPrevCommit = useCallback(
    () => {
      const nextCommitIndex = Math.max(
        ((selectedFilteredCommitIndex: any): number) - 1,
        0,
      );
      selectCommitIndex(filteredCommitIndices[nextCommitIndex]);
    },
    [selectedFilteredCommitIndex, filteredCommitIndices, selectCommitIndex],
  );

  const handleKeyDown = useCallback(
    event => {
      switch (event.key) {
        case 'ArrowLeft':
          viewPrevCommit();
          event.stopPropagation();
          break;
        case 'ArrowRight':
          viewNextCommit();
          event.stopPropagation();
          break;
        default:
          break;
      }
    },
    [viewNextCommit, viewPrevCommit],
  );

  if (commitData.length === 0) {
    return null;
  }

  return (
    <Fragment>
      <span className={styles.IndexLabel}>{label}</span>
      <Button
        className={styles.Button}
        disabled={selectedFilteredCommitIndex === 0 || numFilteredCommits === 0}
        onClick={viewPrevCommit}
        title="Select previous commit">
        <ButtonIcon type="previous" />
      </Button>
      <div
        className={styles.Commits}
        onKeyDown={handleKeyDown}
        style={{
          flex: numFilteredCommits > 0 ? '1 1 auto' : '0 0 auto',
          maxWidth:
            numFilteredCommits > 0
              ? numFilteredCommits * maxBarWidth
              : undefined,
        }}
        tabIndex={0}>
        {numFilteredCommits > 0 && (
          <SnapshotCommitList
            commitDurations={commitDurations}
            commitTimes={commitTimes}
            filteredCommitIndices={filteredCommitIndices}
            selectedCommitIndex={selectedCommitIndex}
            selectedFilteredCommitIndex={selectedFilteredCommitIndex}
            selectCommitIndex={selectCommitIndex}
          />
        )}
        {numFilteredCommits === 0 && (
          <div className={styles.NoCommits}>No commits</div>
        )}
      </div>
      <Button
        className={styles.Button}
        disabled={
          selectedFilteredCommitIndex === null ||
          selectedFilteredCommitIndex >= numFilteredCommits - 1
        }
        onClick={viewNextCommit}
        title="Select next commit">
        <ButtonIcon type="next" />
      </Button>
    </Fragment>
  );
}
