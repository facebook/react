// @flow

import React, { useContext } from 'react';
import { SettingsContext } from './SettingsContext';

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

  const updateDisplayDensity = ({ currentTarget }) =>
    setDisplayDensity(currentTarget.value);
  const updateTheme = ({ currentTarget }) => setTheme(currentTarget.value);
  const updateappendComponentStack = ({ currentTarget }) =>
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
          onChange={updateDisplayDensity}
        >
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
    </div>
  );
}
