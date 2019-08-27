/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {useContext} from 'react';
import {SettingsContext} from './SettingsContext';
import {CHANGE_LOG_URL} from 'react-devtools-shared/src/constants';

import styles from './SettingsShared.css';

export default function GeneralSettings(_: {||}) {
  const {
    displayDensity,
    setDisplayDensity,
    theme,
    setTheme,
    appendComponentStack,
    setAppendComponentStack,
  } = useContext(SettingsContext);

  const updateDisplayDensity = ({currentTarget}) =>
    setDisplayDensity(currentTarget.value);
  const updateTheme = ({currentTarget}) => setTheme(currentTarget.value);
  const updateappendComponentStack = ({currentTarget}) =>
    setAppendComponentStack(currentTarget.checked);

  return (
    <div className={styles.Settings}>
      <div className={styles.Setting}>
        <div className={styles.RadioLabel}>Theme</div>
        <select className={styles.Select} value={theme} onChange={updateTheme}>
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
          onChange={updateDisplayDensity}>
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
        </select>
      </div>

      <div className={styles.Setting}>
        <label>
          <input
            type="checkbox"
            checked={appendComponentStack}
            onChange={updateappendComponentStack}
          />{' '}
          Append component stacks to console warnings and errors.
        </label>
      </div>

      <div className={styles.ReleaseNotes}>
        <a
          className={styles.ReleaseNotesLink}
          target="_blank"
          rel="noopener noreferrer"
          href={CHANGE_LOG_URL}>
          View release notes
        </a>{' '}
        for DevTools version {process.env.DEVTOOLS_VERSION}
      </div>
    </div>
  );
}
