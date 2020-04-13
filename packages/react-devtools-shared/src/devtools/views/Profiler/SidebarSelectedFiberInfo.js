/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useContext, useEffect, useRef} from 'react';
import WhatChanged from './WhatChanged';
import {ProfilerContext} from './ProfilerContext';
import {formatDuration, formatTime} from './utils';
import {StoreContext} from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';

import styles from './SidebarSelectedFiberInfo.css';

export type Props = {||};

export default function SidebarSelectedFiberInfo(_: Props) {
  const {profilerStore} = useContext(StoreContext);
  const {
    rootID,
    selectCommitIndex,
    selectedCommitIndex,
    selectedFiberID,
    selectedFiberName,
    selectFiber,
  } = useContext(ProfilerContext);
  const {profilingCache} = profilerStore;
  const selectedListItemRef = useRef<HTMLElement | null>(null);

  const commitIndices = profilingCache.getFiberCommits({
    fiberID: ((selectedFiberID: any): number),
    rootID: ((rootID: any): number),
  });

  const handleKeyDown = event => {
    switch (event.key) {
      case 'ArrowUp':
        if (selectedCommitIndex !== null) {
          const prevIndex = commitIndices.indexOf(selectedCommitIndex);
          const nextIndex =
            prevIndex > 0 ? prevIndex - 1 : commitIndices.length - 1;
          selectCommitIndex(commitIndices[nextIndex]);
        }
        event.preventDefault();
        break;
      case 'ArrowDown':
        if (selectedCommitIndex !== null) {
          const prevIndex = commitIndices.indexOf(selectedCommitIndex);
          const nextIndex =
            prevIndex < commitIndices.length - 1 ? prevIndex + 1 : 0;
          selectCommitIndex(commitIndices[nextIndex]);
        }
        event.preventDefault();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const selectedElement = selectedListItemRef.current;
    if (
      selectedElement !== null &&
      typeof selectedElement.scrollIntoView === 'function'
    ) {
      selectedElement.scrollIntoView({block: 'nearest', inline: 'nearest'});
    }
  }, [selectedCommitIndex]);

  const listItems = [];
  let i = 0;
  for (i = 0; i < commitIndices.length; i++) {
    const commitIndex = commitIndices[i];

    const {duration, timestamp} = profilerStore.getCommitData(
      ((rootID: any): number),
      commitIndex,
    );

    listItems.push(
      <button
        key={commitIndex}
        ref={selectedCommitIndex === commitIndex ? selectedListItemRef : null}
        className={
          selectedCommitIndex === commitIndex
            ? styles.CurrentCommit
            : styles.Commit
        }
        onClick={() => selectCommitIndex(commitIndex)}>
        {formatTime(timestamp)}s for {formatDuration(duration)}ms
      </button>,
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
          title="Back to commit view">
          <ButtonIcon type="close" />
        </Button>
      </div>
      <div className={styles.Content} onKeyDown={handleKeyDown} tabIndex={0}>
        <WhatChanged fiberID={((selectedFiberID: any): number)} />
        {listItems.length > 0 && (
          <Fragment>
            <label className={styles.Label}>Rendered at</label>: {listItems}
          </Fragment>
        )}
        {listItems.length === 0 && (
          <div>Did not render during this profiling session.</div>
        )}
      </div>
    </Fragment>
  );
}
