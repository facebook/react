// @flow

import React, {
  Fragment,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';
import { useSubscription } from '../hooks';
import { StoreContext } from '../context';
import { ProfilerContext } from 'src/devtools/views/Profiler/ProfilerContext';
import Store from 'src/devtools/store';

import styles from './SettingsShared.css';

export default function ProfilerSettings(_: {||}) {
  const {
    isCommitFilterEnabled,
    minCommitDuration,
    setIsCommitFilterEnabled,
    setMinCommitDuration,
  } = useContext(ProfilerContext);
  const store = useContext(StoreContext);

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

  const recordChangeDescriptionsSubscription = useMemo(
    () => ({
      getCurrentValue: () => store.recordChangeDescriptions,
      subscribe: (callback: Function) => {
        store.addListener('recordChangeDescriptions', callback);
        return () => store.removeListener('recordChangeDescriptions', callback);
      },
    }),
    [store]
  );
  const recordChangeDescriptions = useSubscription<boolean, Store>(
    recordChangeDescriptionsSubscription
  );

  const updateCaptureScreenshotsWhileProfiling = useCallback(
    ({ currentTarget }) => {
      store.captureScreenshots = currentTarget.checked;
    },
    [store]
  );
  const updateRecordChangeDescriptions = useCallback(
    ({ currentTarget }) => {
      store.recordChangeDescriptions = currentTarget.checked;
    },
    [store]
  );
  const updateMinCommitDuration = useCallback(
    (event: SyntheticEvent<HTMLInputElement>) => {
      const newValue = parseFloat(event.currentTarget.value);
      setMinCommitDuration(
        Number.isNaN(newValue) || newValue <= 0 ? 0 : newValue
      );
    },
    [setMinCommitDuration]
  );
  const updateIsCommitFilterEnabled = useCallback(
    (event: SyntheticEvent<HTMLInputElement>) => {
      const checked = event.currentTarget.checked;
      setIsCommitFilterEnabled(checked);
      if (checked) {
        if (minCommitDurationInputRef.current !== null) {
          minCommitDurationInputRef.current.focus();
        }
      }
    },
    [setIsCommitFilterEnabled]
  );

  const minCommitDurationInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className={styles.Settings}>
      <div className={styles.Setting}>
        <label>
          <input
            type="checkbox"
            checked={recordChangeDescriptions}
            onChange={updateRecordChangeDescriptions}
          />{' '}
          Record why each component rendered while profiling.
        </label>
      </div>

      <div className={styles.Setting}>
        <label>
          <input
            checked={isCommitFilterEnabled}
            onChange={updateIsCommitFilterEnabled}
            type="checkbox"
          />{' '}
          Hide commits below
        </label>{' '}
        <input
          className={styles.Input}
          onChange={updateMinCommitDuration}
          ref={minCommitDurationInputRef}
          type="number"
          value={minCommitDuration}
        />{' '}
        (ms)
      </div>

      {store.supportsCaptureScreenshots && (
        <Fragment>
          <div className={styles.Setting}>
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
        </Fragment>
      )}
    </div>
  );
}
