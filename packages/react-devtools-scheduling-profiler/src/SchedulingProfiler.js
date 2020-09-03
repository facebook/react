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
import {unstable_batchedUpdates as batchedUpdates} from 'react-dom';
import {createResource} from 'react-devtools-shared/src/devtools/cache';

import ImportButton from './ImportButton';
import ReactLogo from 'react-devtools-shared/src/devtools/views/ReactLogo';

import CanvasPage from './CanvasPage';
import ImportWorker from './import-worker/import.worker';

import profilerBrowser from './assets/profilerBrowser.png';
import styles from './SchedulingProfiler.css';

export type ProfilerDataResource = Resource<void, File, ReactProfilerData>;

function createDataResourceFromImportedFile(file: File): ProfilerDataResource {
  return createResource(
    () => {
      return new Promise<ReactProfilerData>((resolve, reject) => {
        const worker: Worker = new (ImportWorker: any)();
        worker.onmessage = function(event) {
          const data = ((event.data: any): ImportWorkerOutputData);
          switch (data.status) {
            case 'SUCCESS':
              resolve(data.processedData);
              break;
            case 'ERROR':
              reject(data.error);
              break;
          }
        };
        worker.postMessage({file});
      });
    },
    () => file,
    {useWeakMap: true},
  );
}

export function SchedulingProfiler(_: {||}) {
  const [dataResource, setDataResource] = useState<ProfilerDataResource | null>(
    null,
  );

  // A key to safely reset the error boundary
  // See https://github.com/bvaughn/react-error-boundary/issues/23#issuecomment-425470511
  const [importErrorBoundaryKey, setImportErrorBoundaryKey] = useState(0);

  const handleFileSelect = useCallback(
    (file: File) => {
      batchedUpdates(() => {
        setDataResource(createDataResourceFromImportedFile(file));
        setImportErrorBoundaryKey(importErrorBoundaryKey + 1);
      });
    },
    [importErrorBoundaryKey],
  );

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
          <ImportErrorBoundary
            key={importErrorBoundaryKey}
            onFileSelect={handleFileSelect}>
            <Suspense fallback={<ProcessingData />}>
              <CanvasPage dataResource={dataResource} />
            </Suspense>
          </ImportErrorBoundary>
        ) : (
          <Welcome onFileSelect={handleFileSelect} />
        )}
      </div>
    </div>
  );
}

type WelcomeProps = {|
  onFileSelect: (file: File) => void,
|};

const Welcome = ({onFileSelect}: WelcomeProps) => (
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

class ImportErrorBoundary extends React.Component {
  state: {|error: Error | null|} = {error: null};

  static getDerivedStateFromError(error) {
    return {error};
  }

  render() {
    const {children, onFileSelect} = this.props;
    const {error} = this.state;

    if (error) {
      return (
        <div className={styles.EmptyStateContainer}>
          <div className={styles.Header}>Could not load profile</div>
          <div className={styles.Row}>
            <div className={styles.ErrorMessage}>{error.message}</div>
          </div>
          <div className={styles.Row}>
            Try importing
            <ImportButton onFileSelect={onFileSelect} />
            another Chrome performance profile.
          </div>
        </div>
      );
    }

    return children;
  }
}
