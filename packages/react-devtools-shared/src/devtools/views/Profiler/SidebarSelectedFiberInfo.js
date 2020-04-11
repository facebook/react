/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useContext, useCallback, useEffect, useRef} from 'react';
import WhatChanged from './WhatChanged';
import {ProfilerContext} from './ProfilerContext';
import {formatDuration, formatTime} from './utils';
import {StoreContext} from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';

import styles from './SidebarSelectedFiberInfo.css';

export type Props = {||};

const renderedAtButtonId = 'renderedAtButton';

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
  const listContainer = useRef<HTMLElement | null>(null);

  const commitIndices = profilingCache.getFiberCommits({
    fiberID: ((selectedFiberID: any): number),
    rootID: ((rootID: any): number),
  });

  const handleKeyDown = useCallback(
    event => {
      switch (event.key) {
        case 'ArrowUp':
          if (selectedCommitIndex !== null && selectedCommitIndex > 0) {
            selectCommitIndex(selectedCommitIndex - 1);
          }
          event.preventDefault();
          break;
        case 'ArrowDown':
          if (
            selectedCommitIndex !== null &&
            selectedCommitIndex < commitIndices.length - 1
          ) {
            selectCommitIndex(selectedCommitIndex + 1);
          }
          event.preventDefault();
          break;
        default:
          break;
      }
    },
    [selectCommitIndex, selectedCommitIndex, commitIndices],
  );

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
        id={`${renderedAtButtonId}${commitIndex}`}
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

  useEffect(() => {
    if (listContainer.current === null || selectedCommitIndex === null) {
      return;
    }

    const list: any = listContainer.current;
    const selectedElement = document.getElementById(
      `${renderedAtButtonId}${selectedCommitIndex}`,
    );

    if (selectedElement === null) {
      return;
    }

    const {
      top: buttonTop,
      bottom: buttonBottom,
    } = selectedElement.getBoundingClientRect();
    const {top: listTop, bottom: listBottom} = list.getBoundingClientRect();
    if (buttonTop < listTop) {
      selectedElement.scrollIntoView();
    } else if (buttonBottom > listBottom) {
      list.scrollBy({top: buttonBottom - listBottom});
    }
  }, [selectedCommitIndex]);

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
      <div
        ref={listContainer}
        className={styles.Content}
        onKeyDown={handleKeyDown}>
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
