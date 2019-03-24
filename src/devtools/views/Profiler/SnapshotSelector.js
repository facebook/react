// @flow

import React, { Fragment, useCallback, useContext, useMemo } from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { ProfilerContext } from './ProfilerContext';
import SnapshotCommitList from './SnapshotCommitList';
import { maxBarWidth } from './constants';
import { StoreContext } from '../context';

import styles from './SnapshotSelector.css';

export type Props = {||};

// TODO (profiling) Left/right arrow navigation.

export default function SnapshotSelector(_: Props) {
  const {
    isCommitFilterEnabled,
    minCommitDuration,
    rendererID,
    rootID,
    selectedCommitIndex,
    selectCommitIndex,
  } = useContext(ProfilerContext);

  const { profilingCache } = useContext(StoreContext);
  const { commitDurations, commitTimes } = profilingCache.ProfilingSummary.read(
    {
      rendererID: ((rendererID: any): number),
      rootID: ((rootID: any): number),
    }
  );

  const filteredCommitIndices = useMemo(
    () =>
      commitDurations.reduce((reduced, commitDuration, index) => {
        if (!isCommitFilterEnabled || commitDuration >= minCommitDuration) {
          reduced.push(index);
        }
        return reduced;
      }, []),
    [commitDurations, isCommitFilterEnabled, minCommitDuration]
  );

  const numFilteredCommits = filteredCommitIndices.length;

  // Map the (unfiltered) selected commit index to an index within the filtered data.
  const selectedFilteredCommitIndex = useMemo(() => {
    if (selectedCommitIndex !== null) {
      for (let i = 0; i < filteredCommitIndices.length; i++) {
        if (filteredCommitIndices[i] === selectedCommitIndex) {
          return i;
        }
      }
    }
    return null;
  }, [filteredCommitIndices, selectedCommitIndex]);

  // TODO (profiling) This should be managed by the context controller (reducer).
  // It doesn't currently know about the filtered commits though (since it doesn't suspend).
  // Maybe this component should pass filteredCommitIndices up?
  if (selectedFilteredCommitIndex === null) {
    if (numFilteredCommits > 0) {
      selectCommitIndex(0);
    }
  } else if (selectedFilteredCommitIndex >= numFilteredCommits) {
    selectCommitIndex(numFilteredCommits === 0 ? null : numFilteredCommits - 1);
  }

  let label = null;
  if (numFilteredCommits > 0) {
    label =
      `${selectedFilteredCommitIndex + 1}`.padStart(
        `${numFilteredCommits}`.length,
        '0'
      ) +
      ' / ' +
      numFilteredCommits;
  }

  const viewNextCommit = useCallback(() => {
    const nextCommitIndex = Math.min(
      ((selectedFilteredCommitIndex: any): number) + 1,
      filteredCommitIndices.length - 1
    );
    selectCommitIndex(filteredCommitIndices[nextCommitIndex]);
  }, [selectedFilteredCommitIndex, filteredCommitIndices, selectCommitIndex]);
  const viewPrevCommit = useCallback(() => {
    const nextCommitIndex = Math.max(
      ((selectedFilteredCommitIndex: any): number) - 1,
      0
    );
    selectCommitIndex(filteredCommitIndices[nextCommitIndex]);
  }, [selectedFilteredCommitIndex, filteredCommitIndices, selectCommitIndex]);

  if (rendererID === null || rootID === null) {
    return null;
  }

  return (
    <Fragment>
      <div className={styles.VRule} />
      <span className={styles.IndexLabel}>{label}</span>
      <Button
        className={styles.Button}
        disabled={selectedFilteredCommitIndex === 0 || numFilteredCommits === 0}
        onClick={viewPrevCommit}
      >
        <ButtonIcon type="previous" />
      </Button>
      <div
        className={styles.Commits}
        style={{
          flex: numFilteredCommits > 0 ? '1 1 auto' : '0 0 auto',
          maxWidth:
            numFilteredCommits > 0
              ? numFilteredCommits * maxBarWidth
              : undefined,
        }}
      >
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
      >
        <ButtonIcon type="next" />
      </Button>
    </Fragment>
  );
}
