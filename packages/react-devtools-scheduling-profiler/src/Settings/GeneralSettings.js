/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext} from 'react';
import {SettingsContext} from './SettingsContext';

import styles from './SettingsShared.css';

export default function GeneralSettings(_: {||}) {
  const {displayDensity, setDisplayDensity, setTheme, theme} = useContext(
    SettingsContext,
  );

  return (
    <div className={styles.Settings}>
      <div className={styles.Setting}>
        <div className={styles.RadioLabel}>Theme</div>
        <select
          className={styles.Select}
          value={theme}
          onChange={({currentTarget}) => setTheme(currentTarget.value)}>
          <option value="auto">Auto</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className={styles.Setting}>
        <div className={styles.RadioLabel}>Display density</div>
        <select
          className={styles.Select}
          value={displayDensity}
          onChange={({currentTarget}) =>
            setDisplayDensity(currentTarget.value)
          }>
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
        </select>
      </div>

      <div className={styles.ReleaseNotes}>
        <a
          className={styles.ReleaseNotesLink}
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/facebook/react/tree/master/packages/react-devtools-scheduling-profiler">
          Concurrent Mode Profiler
        </a>{' '}
        version {process.env.DEVTOOLS_VERSION}
      </div>
    </div>
  );
}
