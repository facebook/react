// @flow

import React, { useCallback, useContext, useMemo } from 'react';
import { useSubscription } from '../hooks';
import { StoreContext } from '../context';
import { SettingsContext } from './SettingsContext';
import Store from 'src/devtools/store';
import portaledContent from '../portaledContent';

import styles from './Settings.css';

function Settings(_: {||}) {
  const store = useContext(StoreContext);
  const { displayDensity, setDisplayDensity, theme, setTheme } = useContext(
    SettingsContext
  );

  const captureScreenshotsSubscription = useMemo(
    () => ({
      getCurrentValue: () => store.captureScreenshots,
      subscribe: (callback: Function) => {
        store.addListener('captureScreenshots', callback);
        return () => store.removeListener('captureScreenshots', callback);
      },
    }),
    [store]
  );
  const captureScreenshots = useSubscription<boolean, Store>(
    captureScreenshotsSubscription
  );

  const collapseNodesByDefaultSubscription = useMemo(
    () => ({
      getCurrentValue: () => store.collapseNodesByDefault,
      subscribe: (callback: Function) => {
        store.addListener('collapseNodesByDefault', callback);
        return () => store.removeListener('collapseNodesByDefault', callback);
      },
    }),
    [store]
  );
  const collapseNodesByDefault = useSubscription<boolean, Store>(
    collapseNodesByDefaultSubscription
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

  const updateCaptureScreenshotsWhileProfiling = useCallback(
    ({ currentTarget }) => {
      store.captureScreenshots = currentTarget.checked;
    },
    [store]
  );
  const updateCollapseNodesByDefault = useCallback(
    ({ currentTarget }) => {
      store.collapseNodesByDefault = currentTarget.checked;
    },
    [store]
  );

  return (
    <div className={styles.Settings}>
      <div className={styles.Section}>
        <div className={styles.Header}>Theme</div>
        <div className={styles.OptionGroup}>
          <label className={styles.Option}>
            <input
              type="radio"
              name="Settings-theme"
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
        <div className={styles.Header}>Components tree</div>
        <label>
          <input
            type="checkbox"
            checked={collapseNodesByDefault}
            onChange={updateCollapseNodesByDefault}
          />{' '}
          Collapse tree by default
        </label>
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
      {store.supportsCaptureScreenshots && (
        <div>
          <div className={styles.Section}>
            <div className={styles.Header}>Profiler</div>
            <label>
              <input
                type="checkbox"
                checked={captureScreenshots}
                onChange={updateCaptureScreenshotsWhileProfiling}
              />{' '}
              Capture screenshots while profiling
            </label>
          </div>
          {captureScreenshots && (
            <div className={styles.ScreenshotThrottling}>
              Screenshots will be throttled in order to reduce the negative
              impact on performance.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default portaledContent(Settings);
