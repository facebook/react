/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {use, useState, useEffect} from 'react';

import type {DevToolsHookSettings} from 'react-devtools-shared/src/backend/types';
import type Store from 'react-devtools-shared/src/devtools/store';

import styles from './SettingsShared.css';

type Props = {
  hookSettings: Promise<$ReadOnly<DevToolsHookSettings>>,
  store: Store,
};

export default function DebuggingSettings({
  hookSettings,
  store,
}: Props): React.Node {
  const usedHookSettings = use(hookSettings);

  const [appendComponentStack, setAppendComponentStack] = useState(
    usedHookSettings.appendComponentStack,
  );
  const [breakOnConsoleErrors, setBreakOnConsoleErrors] = useState(
    usedHookSettings.breakOnConsoleErrors,
  );
  const [hideConsoleLogsInStrictMode, setHideConsoleLogsInStrictMode] =
    useState(usedHookSettings.hideConsoleLogsInStrictMode);
  const [showInlineWarningsAndErrors, setShowInlineWarningsAndErrors] =
    useState(usedHookSettings.showInlineWarningsAndErrors);

  useEffect(() => {
    store.setShouldShowWarningsAndErrors(showInlineWarningsAndErrors);
  }, [showInlineWarningsAndErrors]);

  useEffect(() => {
    store.updateHookSettings({
      appendComponentStack,
      breakOnConsoleErrors,
      showInlineWarningsAndErrors,
      hideConsoleLogsInStrictMode,
    });
  }, [
    store,
    appendComponentStack,
    breakOnConsoleErrors,
    showInlineWarningsAndErrors,
    hideConsoleLogsInStrictMode,
  ]);

  return (
    <div className={styles.SettingList}>
      <div className={styles.SettingWrapper}>
        <label className={styles.SettingRow}>
          <input
            type="checkbox"
            checked={appendComponentStack}
            onChange={({currentTarget}) =>
              setAppendComponentStack(currentTarget.checked)
            }
            className={styles.SettingRowCheckbox}
          />
          Append component stacks to console warnings and errors
        </label>
      </div>

      <div className={styles.SettingWrapper}>
        <label className={styles.SettingRow}>
          <input
            type="checkbox"
            checked={showInlineWarningsAndErrors}
            onChange={({currentTarget}) =>
              setShowInlineWarningsAndErrors(currentTarget.checked)
            }
            className={styles.SettingRowCheckbox}
          />
          Show inline warnings and errors
        </label>
      </div>

      <div className={styles.SettingWrapper}>
        <label className={styles.SettingRow}>
          <input
            type="checkbox"
            checked={breakOnConsoleErrors}
            onChange={({currentTarget}) =>
              setBreakOnConsoleErrors(currentTarget.checked)
            }
            className={styles.SettingRowCheckbox}
          />
          Break on warnings
        </label>
      </div>

      <div className={styles.SettingWrapper}>
        <label className={styles.SettingRow}>
          <input
            type="checkbox"
            checked={hideConsoleLogsInStrictMode}
            onChange={({currentTarget}) =>
              setHideConsoleLogsInStrictMode(currentTarget.checked)
            }
            className={styles.SettingRowCheckbox}
          />
          Hide logs during additional invocations in&nbsp;
          <a
            className={styles.StrictModeLink}
            target="_blank"
            rel="noopener noreferrer"
            href="https://react.dev/reference/react/StrictMode">
            Strict Mode
          </a>
        </label>
      </div>
    </div>
  );
}
