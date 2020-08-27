/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Reach styles need to come before any component styles.
// This makes overriding the styles simpler.
import '@reach/menu-button/styles.css';
import '@reach/tooltip/styles.css';

import * as React from 'react';

import {ModalDialogContextController} from './ModalDialog';
import {SettingsContextController} from './Settings/SettingsContext';
import {SchedulingProfiler} from './SchedulingProfiler';
import {useBrowserTheme} from './hooks';

import styles from './App.css';
import './root.css';

export default function App() {
  const theme = useBrowserTheme();
  return (
    <ModalDialogContextController>
      <SettingsContextController browserTheme={theme}>
        <div className={styles.DevTools}>
          <div className={styles.TabContent}>
            <SchedulingProfiler />
          </div>
        </div>
      </SettingsContextController>
    </ModalDialogContextController>
  );
}
