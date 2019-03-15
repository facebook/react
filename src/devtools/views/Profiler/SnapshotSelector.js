// @flow

import React, { Fragment, useCallback, useContext } from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { ProfilerDataContext } from './ProfilerDataContext';
import SnapshotCommitList from './SnapshotCommitList';

import styles from './SnapshotSelector.css';

export type Props = {||};

export default function SnapshotSelector(_: Props) {
  const {
    commitIndex,
    filteredCommitIndices,
    rendererID,
    rootID,
    setCommitIndex,
  } = useContext(ProfilerDataContext);

  const numCommits = filteredCommitIndices.length;
  let currentCommitNumber = '-';
  if (numCommits > 0) {
    currentCommitNumber = `${commitIndex + 1}`.padStart(
      `${numCommits}`.length,
      '0'
    );
  }

  const viewNextCommit = useCallback(() => {
    const nextCommitIndex = Math.min(
      ((commitIndex: any): number) + 1,
      filteredCommitIndices.length - 1
    );
    setCommitIndex(filteredCommitIndices[nextCommitIndex]);
  }, [commitIndex, filteredCommitIndices, setCommitIndex]);
  const viewPrevCommit = useCallback(() => {
    const nextCommitIndex = Math.max(((commitIndex: any): number) - 1, 0);
    setCommitIndex(filteredCommitIndices[nextCommitIndex]);
  }, [commitIndex, filteredCommitIndices, setCommitIndex]);

  if (rendererID === null || rootID === null) {
    return null;
  }

  return (
    <Fragment>
      <div className={styles.VRule} />
      <div className={styles.SnapshotSelector}>
        <span className={styles.Number}>
          {numCommits > 0 ? `${currentCommitNumber} / ${numCommits}` : '-'}
        </span>
        <Button
          className={styles.Button}
          disabled={commitIndex === null || commitIndex <= 0}
          onClick={viewPrevCommit}
        >
          <ButtonIcon type="previous" />
        </Button>
        <div className={styles.Commits}>
          {numCommits > 0 && <SnapshotCommitList />}
          {numCommits === 0 && (
            <div className={styles.NoCommits}>No commits</div>
          )}
        </div>
        <Button
          className={styles.Button}
          disabled={commitIndex === null || commitIndex >= numCommits - 1}
          onClick={viewNextCommit}
        >
          <ButtonIcon type="next" />
        </Button>
      </div>
    </Fragment>
  );
}
