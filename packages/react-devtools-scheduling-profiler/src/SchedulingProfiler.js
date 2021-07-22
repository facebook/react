/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DataResource} from './createDataResourceFromImportedFile';

import * as React from 'react';
import {
  Suspense,
  useContext,
  useDeferredValue,
  useLayoutEffect,
  useState,
} from 'react';
import {SettingsContext} from 'react-devtools-shared/src/devtools/views/Settings/SettingsContext';
import {updateColorsToMatchTheme} from './content-views/constants';
import {SchedulingProfilerContext} from './SchedulingProfilerContext';
import ImportButton from './ImportButton';
import CanvasPage from './CanvasPage';

import styles from './SchedulingProfiler.css';

export function SchedulingProfiler(_: {||}) {
  const {importSchedulingProfilerData, schedulingProfilerData} = useContext(
    SchedulingProfilerContext,
  );

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
    updateColorsToMatchTheme();
    setKey(deferredTheme);
  }, [deferredTheme]);

  return (
    <div className={styles.Content}>
      {schedulingProfilerData ? (
        <Suspense fallback={<ProcessingData />}>
          <DataResourceComponent
            dataResource={schedulingProfilerData}
            key={key}
            onFileSelect={importSchedulingProfilerData}
          />
        </Suspense>
      ) : (
        <Welcome onFileSelect={importSchedulingProfilerData} />
      )}
    </div>
  );
}

const Welcome = ({onFileSelect}: {|onFileSelect: (file: File) => void|}) => (
  <ol className={styles.WelcomeInstructionsList}>
    <li className={styles.WelcomeInstructionsListItem}>
      Open a website that's built with the
      <a
        className={styles.WelcomeInstructionsListItemLink}
        href="https://reactjs.org/link/profiling"
        rel="noopener noreferrer"
        target="_blank">
        profiling build of ReactDOM
      </a>
      .
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

const DataResourceComponent = ({
  dataResource,
  onFileSelect,
}: {|
  dataResource: DataResource,
  onFileSelect: (file: File) => void,
|}) => {
  const dataOrError = dataResource.read();
  if (dataOrError instanceof Error) {
    return (
      <CouldNotLoadProfile error={dataOrError} onFileSelect={onFileSelect} />
    );
  }
  return <CanvasPage profilerData={dataOrError} />;
};
