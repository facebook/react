/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Resource} from 'react-devtools-shared/src/devtools/cache';
import type {ReactProfilerData} from './types';
import type {ImportWorkerOutputData} from './import-worker/import.worker';

import * as React from 'react';
import {Suspense, useCallback, useState} from 'react';
import {createResource} from 'react-devtools-shared/src/devtools/cache';
import ReactLogo from 'react-devtools-shared/src/devtools/views/ReactLogo';

import ImportButton from './ImportButton';
import CanvasPage from './CanvasPage';
import ImportWorker from './import-worker/import.worker';

import profilerBrowser from './assets/profilerBrowser.png';
import styles from './SchedulingProfiler.css';

type DataResource = Resource<void, File, ReactProfilerData | Error>;

function createDataResourceFromImportedFile(file: File): DataResource {
  return createResource(
    () => {
      return new Promise<ReactProfilerData | Error>((resolve, reject) => {
        const worker: Worker = new (ImportWorker: any)();

        worker.onmessage = function(event) {
          const data = ((event.data: any): ImportWorkerOutputData);
          switch (data.status) {
            case 'SUCCESS':
              resolve(data.processedData);
              break;
            case 'INVALID_PROFILE_ERROR':
              resolve(data.error);
              break;
            case 'UNEXPECTED_ERROR':
              reject(data.error);
              break;
          }
          worker.terminate();
        };

        worker.postMessage({file});
      });
    },
    () => file,
    {useWeakMap: true},
  );
}

export function SchedulingProfiler(_: {||}) {
  const [dataResource, setDataResource] = useState<DataResource | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setDataResource(createDataResourceFromImportedFile(file));
  }, []);

  return (
    <div className={styles.SchedulingProfiler}>
      <div className={styles.Toolbar}>
        <ReactLogo />
        <span className={styles.AppName}>Concurrent Mode Profiler</span>
        <div className={styles.VRule} />
        <ImportButton onFileSelect={handleFileSelect} />
        <div className={styles.Spacer} />
      </div>
      <div className={styles.Content}>
        {dataResource ? (
          <Suspense fallback={<ProcessingData />}>
            <DataResourceComponent
              dataResource={dataResource}
              onFileSelect={handleFileSelect}
            />
          </Suspense>
        ) : (
          <Welcome onFileSelect={handleFileSelect} />
        )}
      </div>
    </div>
  );
}

const Welcome = ({onFileSelect}: {|onFileSelect: (file: File) => void|}) => (
  <div className={styles.EmptyStateContainer}>
    <div className={styles.ScreenshotWrapper}>
      <img
        src={profilerBrowser}
        className={styles.Screenshot}
        alt="Profiler screenshot"
      />
    </div>
    <div className={styles.Header}>Welcome!</div>
    <div className={styles.Row}>
      Click the import button
      <ImportButton onFileSelect={onFileSelect} /> to import a Chrome
      performance profile.
    </div>
  </div>
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
