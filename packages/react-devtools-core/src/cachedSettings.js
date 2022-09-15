/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  type ConsolePatchSettings,
  writeConsolePatchSettingsToWindow,
} from 'react-devtools-shared/src/backend/console';
import {castBool, castBrowserTheme} from 'react-devtools-shared/src/utils';

export type CachedSettingsStore = {
  setValue: (value: string) => void,
  getValue: () => ?string,
};

export type CachedSettings = {
  consolePatchSettings: ?ConsolePatchSettings,
};

export function initializeUsingCachedSettings(
  cachedSettingsStore: CachedSettingsStore,
) {
  const cachedSettingsString = cachedSettingsStore.getValue();
  if (cachedSettingsString == null) {
    return;
  }
  const cachedSettings = parseCachedSettings(cachedSettingsString);
  if (cachedSettings != null && cachedSettings.consolePatchSettings != null) {
    writeConsolePatchSettingsToWindow(cachedSettings.consolePatchSettings);
  }
}

function parseCachedSettings(cachedSettingsString: string): ?CachedSettings {
  const parsedValue = JSON.parse(cachedSettingsString);

  if (typeof parsedValue === 'object' && parsedValue != null) {
    const consolePatchSettings = parseConsolePatchSettings(
      parsedValue.consolePatchSettings,
    );
    return {
      consolePatchSettings,
    };
  }
}

function parseConsolePatchSettings(value: any): ?ConsolePatchSettings {
  if (typeof value !== 'object' || value === null) {
    return;
  }
  const {
    appendComponentStack,
    breakOnConsoleErrors,
    showInlineWarningsAndErrors,
    hideConsoleLogsInStrictMode,
    browserTheme,
  } = value;
  return {
    appendComponentStack: castBool(appendComponentStack) ?? true,
    breakOnConsoleErrors: castBool(breakOnConsoleErrors) ?? false,
    showInlineWarningsAndErrors: castBool(showInlineWarningsAndErrors) ?? true,
    hideConsoleLogsInStrictMode: castBool(hideConsoleLogsInStrictMode) ?? false,
    browserTheme: castBrowserTheme(browserTheme) ?? 'dark',
  };
}

export function cacheSettings(
  cachedSettings: CachedSettingsStore,
  value: CachedSettings,
): void {
  cachedSettings.setValue(JSON.stringify(value));
}
