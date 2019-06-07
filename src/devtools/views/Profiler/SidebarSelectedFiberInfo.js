// @flow

import React, { Fragment, useContext } from 'react';
import ProfilerStore from 'src/devtools/ProfilerStore';
import { ProfilerContext } from './ProfilerContext';
import { formatDuration, formatTime } from './utils';
import { StoreContext } from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';

import styles from './SidebarSelectedFiberInfo.css';

export type Props = {||};

export default function SidebarSelectedFiberInfo(_: Props) {
  const { profilerStore } = useContext(StoreContext);
  const {
    rootID,
    selectCommitIndex,
    selectedCommitIndex,
    selectedFiberID,
    selectedFiberName,
    selectFiber,
  } = useContext(ProfilerContext);
  const { profilingCache } = profilerStore;

  const commitIndices = profilingCache.getFiberCommits({
    fiberID: ((selectedFiberID: any): number),
    rootID: ((rootID: any): number),
  });

  const listItems = [];
  for (let i = 0; i < commitIndices.length; i += 2) {
    const commitIndex = commitIndices[i];

    const { duration, timestamp } = profilerStore.getCommitData(
      ((rootID: any): number),
      commitIndex
    );

    listItems.push(
      <button
        key={commitIndex}
        className={
          selectedCommitIndex === commitIndex
            ? styles.CurrentCommit
            : styles.Commit
        }
        onClick={() => selectCommitIndex(commitIndex)}
      >
        {formatTime(timestamp)}s for {formatDuration(duration)}ms
      </button>
    );
  }

  return (
    <Fragment>
      <div className={styles.Toolbar}>
        <div className={styles.Component}>
          {selectedFiberName || 'Selected component'}
        </div>

        <Button
          className={styles.IconButton}
          onClick={() => selectFiber(null, null)}
          title="Back to commit view"
        >
          <ButtonIcon type="close" />
        </Button>
      </div>
      <WhatChanged
        commitIndex={((selectedCommitIndex: any): number)}
        fiberID={((selectedFiberID: any): number)}
        profilerStore={profilerStore}
        rootID={((rootID: any): number)}
      />
      <div className={styles.Content}>
        <label className={styles.Label}>Rendered at</label>: {listItems}
      </div>
    </Fragment>
  );
}

type WhatChangedProps = {|
  commitIndex: number,
  fiberID: number,
  profilerStore: ProfilerStore,
  rootID: number,
|};

function WhatChanged({
  commitIndex,
  fiberID,
  profilerStore,
  rootID,
}: WhatChangedProps) {
  const { changeDescriptions } = profilerStore.getCommitData(
    ((rootID: any): number),
    commitIndex
  );
  if (changeDescriptions === null) {
    return null;
  }

  const changeDescription = changeDescriptions.get(fiberID);
  if (changeDescription == null) {
    return null;
  }

  const changes = [];
  if (changeDescription.didHooksChange) {
    changes.push(
      <div key="hooks" className={styles.WhatChangedItem}>
        • Hooks
      </div>
    );
  }
  if (changeDescription.props.length !== 0) {
    changes.push(
      <div key="props" className={styles.WhatChangedItem}>
        • Props
        {changeDescription.props.map(key => (
          <span key={key} className={styles.WhatChangedKey}>
            {key}
          </span>
        ))}
      </div>
    );
  }
  if (changeDescription.state.length !== 0) {
    changes.push(
      <div key="state" className={styles.WhatChangedItem}>
        • State
        {changeDescription.state.map(key => (
          <span key={key} className={styles.WhatChangedKey}>
            {key}
          </span>
        ))}
      </div>
    );
  }

  if (changes.length === 0) {
    changes.push(<div className={styles.WhatChangedItem}>Nothing</div>);
  }

  return (
    <div className={styles.Content}>
      <label className={styles.Label}>What changed?</label>
      {changes}
    </div>
  );
}
