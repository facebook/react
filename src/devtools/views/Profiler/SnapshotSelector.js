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

export default function SnapshotSelector(_: Props) {
  const {
    isCommitFilterEnabled,
    minCommitDuration,
    rendererID,
    rootID,
    selectedCommitIndex,
    setSelectedCommitIndex,
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

  const numCommits = filteredCommitIndices.length;
  let currentCommitNumber = '-';
  if (numCommits > 0) {
    currentCommitNumber = `${selectedCommitIndex + 1}`.padStart(
      `${numCommits}`.length,
      '0'
    );
  }

  const viewNextCommit = useCallback(() => {
    const nextCommitIndex = Math.min(
      ((selectedCommitIndex: any): number) + 1,
      filteredCommitIndices.length - 1
    );
    setSelectedCommitIndex(filteredCommitIndices[nextCommitIndex]);
  }, [selectedCommitIndex, filteredCommitIndices, setSelectedCommitIndex]);
  const viewPrevCommit = useCallback(() => {
    const nextCommitIndex = Math.max(
      ((selectedCommitIndex: any): number) - 1,
      0
    );
    setSelectedCommitIndex(filteredCommitIndices[nextCommitIndex]);
  }, [selectedCommitIndex, filteredCommitIndices, setSelectedCommitIndex]);

  if (rendererID === null || rootID === null) {
    return null;
  }

  return (
    <Fragment>
      <div className={styles.VRule} />
      <span className={styles.IndexLabel}>
        {numCommits > 0 ? `${currentCommitNumber} / ${numCommits}` : '-'}
      </span>
      <Button
        className={styles.Button}
        disabled={selectedCommitIndex === 0 || numCommits === 0}
        onClick={viewPrevCommit}
      >
        <ButtonIcon type="previous" />
      </Button>
      <div
        className={styles.Commits}
        style={{
          flex: numCommits > 0 ? '1 1 auto' : '0 0 auto',
          maxWidth: numCommits > 0 ? numCommits * maxBarWidth : undefined,
        }}
      >
        {numCommits > 0 && (
          <SnapshotCommitList
            commitDurations={commitDurations}
            commitTimes={commitTimes}
            filteredCommitIndices={filteredCommitIndices}
            selectedCommitIndex={selectedCommitIndex}
            setSelectedCommitIndex={setSelectedCommitIndex}
          />
        )}
        {numCommits === 0 && <div className={styles.NoCommits}>No commits</div>}
      </div>
      <Button
        className={styles.Button}
        disabled={
          selectedCommitIndex === null || selectedCommitIndex >= numCommits - 1
        }
        onClick={viewNextCommit}
      >
        <ButtonIcon type="next" />
      </Button>
    </Fragment>
  );
}
