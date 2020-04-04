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
import {StoreContext} from '../context';
import {CHANGE_LOG_URL} from 'react-devtools-shared/src/constants';

import styles from './SettingsShared.css';

export default function GeneralSettings(_: {||}) {
  const {
    appendComponentStack,
    displayDensity,
    setAppendComponentStack,
    setDisplayDensity,
    setTheme,
    setTraceUpdatesEnabled,
    theme,
    traceUpdatesEnabled,
  } = useContext(SettingsContext);

  const {supportsTraceUpdates} = useContext(StoreContext);

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

      {supportsTraceUpdates && (
        <div className={styles.Setting}>
          <label>
            <input
              type="checkbox"
              checked={traceUpdatesEnabled}
              onChange={({currentTarget}) =>
                setTraceUpdatesEnabled(currentTarget.checked)
              }
            />{' '}
            Highlight updates when components render.
          </label>
        </div>
      )}

      <div className={styles.Setting}>
        <label>
          <input
            type="checkbox"
            checked={appendComponentStack}
            onChange={({currentTarget}) =>
              setAppendComponentStack(currentTarget.checked)
            }
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
