// @flow

import React, { useCallback, useContext } from 'react';
import { createPortal } from 'react-dom';
import { SettingsContext } from './SettingsContext';

import styles from './Settings.css';

export type Props = {|
  portalContainer?: Element,
|};

export default function Settings({ portalContainer }: Props) {
  const { displayDensity, setDisplayDensity, theme, setTheme } = useContext(
    SettingsContext
  );

  const updateDisplayDensity = useCallback(
    ({ currentTarget }) => {
      setDisplayDensity(currentTarget.value);
    },
    [setDisplayDensity]
  );

  const updateTheme = useCallback(
    ({ currentTarget }) => {
      setTheme(currentTarget.value);
    },
    [setTheme]
  );

  const children = (
    <div className={styles.Settings}>
      <div className={styles.Section}>
        <div className={styles.Header}>Theme</div>
        <div className={styles.OptionGroup}>
          <label className={styles.Option}>
            <input
              type="radio"
              name="Settings-Settings-theme"
              checked={theme === 'auto'}
              value="auto"
              onChange={updateTheme}
            />{' '}
            Auto
          </label>
          <label className={styles.Option}>
            <input
              type="radio"
              name="Settings-theme"
              checked={theme === 'light'}
              value="light"
              onChange={updateTheme}
            />{' '}
            Light
          </label>
          <label className={styles.Option}>
            <input
              type="radio"
              name="Settings-theme"
              checked={theme === 'dark'}
              value="dark"
              onChange={updateTheme}
            />{' '}
            Dark
          </label>
        </div>
      </div>
      <div className={styles.Section}>
        <div className={styles.Header}>Display density</div>
        <div className={styles.OptionGroup}>
          <label className={styles.Option}>
            <input
              type="radio"
              name="Settings-displayDensity"
              checked={displayDensity === 'compact'}
              value="compact"
              onChange={updateDisplayDensity}
            />{' '}
            Compact
          </label>
          <label className={styles.Option}>
            <input
              type="radio"
              name="Settings-displayDensity"
              checked={displayDensity === 'comfortable'}
              value="comfortable"
              onChange={updateDisplayDensity}
            />{' '}
            Comfortable
          </label>
        </div>
      </div>
    </div>
  );

  return portalContainer != null
    ? createPortal(children, portalContainer)
    : children;
}
