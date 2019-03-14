// @flow

import React, { Fragment, Suspense, useContext } from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { StoreContext } from '../context';
import { ProfilerContext } from './ProfilerContext';
import SnapshotCommitList from './SnapshotCommitList';

import styles from './SnapshotSelector.css';

export type Props = {||};

export default function SnapshotSelectorSuspense(_: Props) {
  return (
    <Suspense fallback={<SnapshotSelectorFallback />}>
      <SnapshotSelector />
    </Suspense>
  );
}

function SnapshotSelector(_: Props) {
  const { profilingCache } = useContext(StoreContext);
  const {
    commitIndex,
    isMinCommitDurationEnabled,
    minCommitDuration,
    rendererID,
    rootID,
    setCommitIndex,
  } = useContext(ProfilerContext);

  if (rendererID === null || rootID === null) {
    return null;
  }

  const { commitDurations, commitTimes } = profilingCache.ProfilingSummary.read(
    {
      rendererID: ((rendererID: any): number),
      rootID: ((rootID: any): number),
    }
  );

  // TODO (profiling) This is not sufficient; index here doesn't map to a meaningful index in the profiling data.
  let filteredCommitDurations = commitDurations;
  let filteredCommitTimes = commitTimes;
  if (isMinCommitDurationEnabled) {
    filteredCommitDurations = [];
    filteredCommitTimes = [];
    for (let i = 0; i < commitDurations.length; i++) {
      if (commitDurations[i] >= minCommitDuration) {
        filteredCommitDurations.push(commitDurations[i]);
        filteredCommitTimes.push(commitTimes[i]);
      }
    }
  }

  const numCommits = filteredCommitDurations.length;
  const currentCommitNumber = `${
    numCommits > 0 ? commitIndex + 1 : '-'
  }`.padStart(`${numCommits}`.length, '0');

  // TODO (profiler) We need to guard commit index and share filterd statuses in a better way.

  const viewNextCommit = () => {
    setCommitIndex(Math.min(commitIndex + 1, numCommits - 1));
  };
  const viewPrevCommit = () => {
    setCommitIndex(Math.max(commitIndex - 1, 0));
  };

  return (
    <Fragment>
      <div className={styles.VRule} />
      <div className={styles.SnapshotSelector}>
        <span className={styles.Number}>
          {currentCommitNumber} / {numCommits}
        </span>
        <Button
          className={styles.Button}
          disabled={numCommits === 0 || commitIndex <= 0}
          onClick={viewPrevCommit}
        >
          <ButtonIcon type="previous" />
        </Button>
        <div className={styles.Commits}>
          {numCommits > 0 && (
            <SnapshotCommitList
              commitDurations={filteredCommitDurations}
              commitTimes={filteredCommitTimes}
              selectedCommitIndex={commitIndex}
              setCommitIndex={setCommitIndex}
              viewNextCommit={viewNextCommit}
              viewPrevCommit={viewPrevCommit}
            />
          )}
          {numCommits === 0 && (
            <div className={styles.NoCommits}>No commits</div>
          )}
        </div>
        <Button
          className={styles.Button}
          disabled={commitIndex >= numCommits - 1}
          onClick={viewNextCommit}
        >
          <ButtonIcon type="next" />
        </Button>
      </div>
    </Fragment>
  );
}

function SnapshotSelectorFallback() {
  // TODO (profiling) Better loading UI
  return <div className={styles.SnapshotSelector}>Loading...</div>;
}
