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
    rootID,
    selectInteraction,
    selectTab,
  } = useContext(ProfilerContext);

  const { captureScreenshots, profilerStore } = useContext(StoreContext);

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

  if (rootID === null || selectedCommitIndex === null) {
    return <div className={styles.NothingSelected}>Nothing selected</div>;
  }

  const { interactions } = profilerStore.getDataForRoot(rootID);
  const {
    duration,
    interactionIDs,
    priorityLevel,
    screenshot,
    timestamp,
  } = profilerStore.getCommitData(rootID, selectedCommitIndex);

  const viewInteraction = interactionID => {
    selectTab('interactions');
    selectInteraction(interactionID);
  };

  return (
    <Fragment>
      <div className={styles.Toolbar}>Commit information</div>
      <div className={styles.Content}>
        <ul className={styles.List}>
          {priorityLevel !== null && (
            <li className={styles.ListItem}>
              <label className={styles.Label}>Priority</label>:{' '}
              <span className={styles.Value}>{priorityLevel}</span>
            </li>
          )}
          <li className={styles.ListItem}>
            <label className={styles.Label}>Committed at</label>:{' '}
            <span className={styles.Value}>{formatTime(timestamp)}s</span>
          </li>
          <li className={styles.ListItem}>
            <label className={styles.Label}>Render duration</label>:{' '}
            <span className={styles.Value}>{formatDuration(duration)}ms</span>
          </li>
          <li className={styles.Interactions}>
            <label className={styles.Label}>Interactions</label>:
            <div className={styles.InteractionList}>
              {interactionIDs.length === 0 ? (
                <div className={styles.NoInteractions}>None</div>
              ) : null}
              {interactionIDs.map(interactionID => {
                const interaction = interactions.get(interactionID);
                if (interaction == null) {
                  throw Error(`Invalid interaction "${interactionID}"`);
                }
                return (
                  <button
                    key={interactionID}
                    className={styles.Interaction}
                    onClick={() => viewInteraction(interactionID)}
                  >
                    {interaction.name}
                  </button>
                );
              })}
            </div>
          </li>
          {captureScreenshots && (
            <li>
              <label className={styles.Label}>Screenshot</label>:
              {screenshot != null ? (
                <img
                  alt="Screenshot"
                  className={styles.Screenshot}
                  onClick={showScreenshotModal}
                  src={screenshot}
                />
              ) : (
                <div className={styles.NoScreenshot}>
                  No screenshot available
                </div>
              )}
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
