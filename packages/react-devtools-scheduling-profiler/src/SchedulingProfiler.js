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
import {ModalDialog} from './ModalDialog';
import ReactLogo from './ReactLogo';

import SettingsModalContextToggle from './Settings/SettingsModalContextToggle';
import {SettingsModalContextController} from './Settings/SettingsModalContext';
import SettingsModal from './Settings/SettingsModal';
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
    <SettingsModalContextController>
      <div className={styles.SchedulingProfiler}>
        <div className={styles.Toolbar}>
          <ReactLogo />
          <span className={styles.DevToolsVersion}>
            {process.env.DEVTOOLS_VERSION}
          </span>
          <div className={styles.VRule} />
          <ImportButton onDataImported={setProfilerData} />
          <div className={styles.Spacer} />
          <SettingsModalContextToggle />
        </div>
        <div className={styles.Content}>
          {view}
          <ModalDialog />
        </div>
        <SettingsModal />
      </div>
    </SettingsModalContextController>
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
