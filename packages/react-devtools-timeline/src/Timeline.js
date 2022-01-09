/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ViewState} from './types';

import {isInternalFacebookBuild} from 'react-devtools-feature-flags';
import * as React from 'react';
import {
  Suspense,
  useContext,
  useDeferredValue,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {SettingsContext} from 'react-devtools-shared/src/devtools/views/Settings/SettingsContext';
import {updateColorsToMatchTheme} from './content-views/constants';
import {TimelineContext} from './TimelineContext';
import ImportButton from './ImportButton';
import CanvasPage from './CanvasPage';
import {importFile} from './timelineCache';
import TimelineSearchInput from './TimelineSearchInput';
import {TimelineSearchContextController} from './TimelineSearchContext';

import styles from './Timeline.css';

export function Timeline(_: {||}) {
  const {file, setFile, viewState} = useContext(TimelineContext);

  const ref = useRef(null);

  // HACK: Canvas rendering uses an imperative API,
  // but DevTools colors are stored in CSS variables (see root.css and SettingsContext).
  // When the theme changes, we need to trigger update the imperative colors and re-draw the Canvas.
  const {theme} = useContext(SettingsContext);
  // HACK: SettingsContext also uses a useLayoutEffect to update styles;
  // make sure the theme context in SettingsContext updates before this code.
  const deferredTheme = useDeferredValue(theme);
  // HACK: Schedule a re-render of the Canvas once colors have been updated.
  // The easiest way to guarangee this happens is to recreate the inner Canvas component.
  const [key, setKey] = useState<string>(theme);
  useLayoutEffect(() => {
    const pollForTheme = () => {
      if (updateColorsToMatchTheme(((ref.current: any): HTMLDivElement))) {
        clearInterval(intervalID);
        setKey(deferredTheme);
      }
    };

    const intervalID = setInterval(pollForTheme, 50);

    return () => {
      clearInterval(intervalID);
    };
  }, [deferredTheme]);

  return (
    <div className={styles.Content} ref={ref}>
      {file ? (
        <Suspense fallback={<ProcessingData />}>
          <FileLoader
            file={file}
            key={key}
            onFileSelect={setFile}
            viewState={viewState}
          />
        </Suspense>
      ) : (
        <Welcome onFileSelect={setFile} />
      )}
    </div>
  );
}

const Welcome = ({onFileSelect}: {|onFileSelect: (file: File) => void|}) => (
  <ol className={styles.WelcomeInstructionsList}>
    {isInternalFacebookBuild && (
      <li className={styles.WelcomeInstructionsListItem}>
        Enable the
        <a
          className={styles.WelcomeInstructionsListItemLink}
          href="https://fburl.com/react-devtools-scheduling-profiler-gk"
          rel="noopener noreferrer"
          target="_blank">
          <code>react_enable_scheduling_profiler</code> GK
        </a>
        .
      </li>
    )}
    <li className={styles.WelcomeInstructionsListItem}>
      Open a website that's built with the
      <a
        className={styles.WelcomeInstructionsListItemLink}
        href="https://reactjs.org/link/profiling"
        rel="noopener noreferrer"
        target="_blank">
        profiling build of ReactDOM
      </a>
      (version 18 or newer).
    </li>
    <li className={styles.WelcomeInstructionsListItem}>
      Open the "Performance" tab in Chrome and record some performance data.
    </li>
    <li className={styles.WelcomeInstructionsListItem}>
      Click the "Save profile..." button in Chrome to export the data.
    </li>
    <li className={styles.WelcomeInstructionsListItem}>
      Import the data into the profiler:
      <br />
      <ImportButton onFileSelect={onFileSelect}>
        <span className={styles.ImportButtonLabel}>Import</span>
      </ImportButton>
    </li>
  </ol>
);

const ProcessingData = () => (
  <div className={styles.EmptyStateContainer}>
    <div className={styles.Header}>Processing data...</div>
    <div className={styles.Row}>This should only take a minute.</div>
  </div>
);

const CouldNotLoadProfile = ({error, onFileSelect}) => (
  <div className={styles.EmptyStateContainer}>
    <div className={styles.Header}>Could not load profile</div>
    {error.message && (
      <div className={styles.Row}>
        <div className={styles.ErrorMessage}>{error.message}</div>
      </div>
    )}
    <div className={styles.Row}>
      Try importing
      <ImportButton onFileSelect={onFileSelect} />
      another Chrome performance profile.
    </div>
  </div>
);

const FileLoader = ({
  file,
  onFileSelect,
  viewState,
}: {|
  file: File | null,
  onFileSelect: (file: File) => void,
  viewState: ViewState,
|}) => {
  if (file === null) {
    return null;
  }

  const dataOrError = importFile(file);
  if (dataOrError instanceof Error) {
    return (
      <CouldNotLoadProfile error={dataOrError} onFileSelect={onFileSelect} />
    );
  }

  return (
    <TimelineSearchContextController
      profilerData={dataOrError}
      viewState={viewState}>
      <TimelineSearchInput />
      <CanvasPage profilerData={dataOrError} viewState={viewState} />
    </TimelineSearchContextController>
  );
};
