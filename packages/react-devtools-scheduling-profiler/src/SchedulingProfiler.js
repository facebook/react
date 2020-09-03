/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactProfilerData} from './types';

import * as React from 'react';
import {useState} from 'react';

import ImportButton from './ImportButton';
import {ModalDialog} from 'react-devtools-shared/src/devtools/views/ModalDialog';
import ReactLogo from 'react-devtools-shared/src/devtools/views/ReactLogo';

import CanvasPage from './CanvasPage';

import profilerBrowser from './assets/profilerBrowser.png';
import styles from './SchedulingProfiler.css';

export function SchedulingProfiler(_: {||}) {
  const [profilerData, setProfilerData] = useState<ReactProfilerData | null>(
    null,
  );

  const view = profilerData ? (
    <CanvasPage profilerData={profilerData} />
  ) : (
    <Welcome onDataImported={setProfilerData} />
  );

  return (
    <div className={styles.SchedulingProfiler}>
      <div className={styles.Toolbar}>
        <ReactLogo />
        <span className={styles.AppName}>Concurrent Mode Profiler</span>
        <div className={styles.VRule} />
        <ImportButton onDataImported={setProfilerData} />
        <div className={styles.Spacer} />
      </div>
      <div className={styles.Content}>
        {view}
        <ModalDialog />
      </div>
    </div>
  );
}

type WelcomeProps = {|
  onDataImported: (profilerData: ReactProfilerData) => void,
|};

const Welcome = ({onDataImported}: WelcomeProps) => (
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
      <ImportButton onDataImported={onDataImported} /> to import a Chrome
      performance profile.
    </div>
  </div>
);
