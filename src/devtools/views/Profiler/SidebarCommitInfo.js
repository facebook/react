// @flow

import React, { Fragment, useCallback, useContext, useState } from 'react';
import { ProfilerContext } from './ProfilerContext';
import { formatDuration, formatTime } from './utils';
import { StoreContext } from '../context';

import styles from './SidebarCommitInfo.css';

export type Props = {||};

export default function SidebarCommitInfo(_: Props) {
  const {
    selectedCommitIndex,
    rendererID,
    rootID,
    selectInteraction,
    selectTab,
  } = useContext(ProfilerContext);

  const { profilingCache, profilingScreenshots } = useContext(StoreContext);

  const screenshot =
    selectedCommitIndex !== null
      ? profilingScreenshots.get(selectedCommitIndex)
      : null;
  const [
    isScreenshotModalVisible,
    setIsScreenshotModalVisible,
  ] = useState<boolean>(false);

  const hideScreenshotModal = useCallback(
    () => setIsScreenshotModalVisible(false),
    []
  );
  const showScreenshotModal = useCallback(
    () => setIsScreenshotModalVisible(true),
    []
  );

  if (selectedCommitIndex === null) {
    return <div className={styles.NothingSelected}>Nothing selected</div>;
  }

  const { commitDurations, commitTimes } = profilingCache.ProfilingSummary.read(
    {
      rendererID: ((rendererID: any): number),
      rootID: ((rootID: any): number),
    }
  );

  const { interactions } = profilingCache.CommitDetails.read({
    commitIndex: selectedCommitIndex,
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const viewInteraction = interaction => {
    selectTab('interactions');
    selectInteraction(interaction.id);
  };

  return (
    <Fragment>
      <div className={styles.Toolbar}>Commit information</div>
      <div className={styles.Content}>
        <ul className={styles.List}>
          <li className={styles.ListItem}>
            <label className={styles.Label}>Committed at</label>:{' '}
            <span className={styles.Value}>
              {formatTime(commitTimes[((selectedCommitIndex: any): number)])}s
            </span>
          </li>
          <li className={styles.ListItem}>
            <label className={styles.Label}>Render duration</label>:{' '}
            <span className={styles.Value}>
              {formatDuration(
                commitDurations[((selectedCommitIndex: any): number)]
              )}
              ms
            </span>
          </li>
          <li className={styles.InteractionList}>
            <label className={styles.Label}>Interactions</label>:
            <ul className={styles.InteractionList}>
              {interactions.length === 0 ? (
                <li className={styles.InteractionListItem}>None</li>
              ) : null}
              {interactions.map((interaction, index) => (
                <li
                  key={index}
                  className={styles.InteractionListItem}
                  onClick={() => viewInteraction(interaction)}
                >
                  {interaction.name}
                </li>
              ))}
            </ul>
          </li>
          {screenshot != null && (
            <li>
              <img
                alt="Screenshot"
                className={styles.Screenshot}
                onClick={showScreenshotModal}
                src={screenshot}
              />
            </li>
          )}
          {screenshot != null && isScreenshotModalVisible && (
            <ScreenshotModal
              hideScreenshotModal={hideScreenshotModal}
              screenshot={screenshot}
            />
          )}
        </ul>
      </div>
    </Fragment>
  );
}

function ScreenshotModal({
  hideScreenshotModal,
  screenshot,
}: {|
  hideScreenshotModal: Function,
  screenshot: string,
|}) {
  return (
    <div className={styles.Modal} onClick={hideScreenshotModal}>
      <img alt="Screenshot" className={styles.ModalImage} src={screenshot} />
    </div>
  );
}
