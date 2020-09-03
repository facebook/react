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

import {ModalDialogContextController} from 'react-devtools-shared/src/devtools/views/ModalDialog';
import {SchedulingProfiler} from './SchedulingProfiler';
import {useBrowserTheme} from './hooks';

import styles from './App.css';
import 'react-devtools-shared/src/devtools/views/root.css';

export default function App() {
  useBrowserTheme();

  return (
    <ModalDialogContextController>
      <div className={styles.DevTools}>
        <div className={styles.TabContent}>
          <SchedulingProfiler />
        </div>
      </div>
    </ModalDialogContextController>
  );
}
