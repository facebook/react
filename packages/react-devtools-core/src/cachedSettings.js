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
import {sessionStorageSetItem} from 'react-devtools-shared/src/storage';
import {
  SESSION_STORAGE_RELOAD_AND_PROFILE_KEY,
  SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY,
} from 'react-devtools-shared/src/constants';
import {initialProfileRef} from 'react-devtools-shared/src/backend/agent';

// Note: all keys should be optional in this type, because users can use newer
// versions of React DevTools with older versions of React Native, and the object
// provided by React Native may not include all of this type's fields.
export type DevToolsSettingsManager = {
  getConsolePatchSettings: ?() => string,
  setConsolePatchSettings: ?(settings: string) => void,

  getProfilingSettings: ?() => string,
  setProfilingSettings: ?(settings: string) => void,
  reload: ?() => void,
};

export function initializeUsingCachedSettings(
  devToolsSettingsManager: DevToolsSettingsManager,
) {
  initializeConsolePatchSettings(devToolsSettingsManager);
  initializeProfilingSettings(devToolsSettingsManager);
}

function initializeConsolePatchSettings(
  devToolsSettingsManager: DevToolsSettingsManager,
) {
  if (devToolsSettingsManager.getConsolePatchSettings == null) {
    return;
  }
  const consolePatchSettingsString = devToolsSettingsManager.getConsolePatchSettings();
  if (consolePatchSettingsString == null) {
    return;
  }
  const parsedConsolePatchSettings = parseConsolePatchSettings(
    consolePatchSettingsString,
  );
  if (parsedConsolePatchSettings == null) {
    return;
  }
  writeConsolePatchSettingsToWindow(parsedConsolePatchSettings);
}

function parseConsolePatchSettings(
  consolePatchSettingsString: string,
): ?ConsolePatchSettings {
  const parsedValue = JSON.parse(consolePatchSettingsString ?? '{}');
  const {
    appendComponentStack,
    breakOnConsoleErrors,
    showInlineWarningsAndErrors,
    hideConsoleLogsInStrictMode,
    browserTheme,
  } = parsedValue;
  return {
    appendComponentStack: castBool(appendComponentStack) ?? true,
    breakOnConsoleErrors: castBool(breakOnConsoleErrors) ?? false,
    showInlineWarningsAndErrors: castBool(showInlineWarningsAndErrors) ?? true,
    hideConsoleLogsInStrictMode: castBool(hideConsoleLogsInStrictMode) ?? false,
    browserTheme: castBrowserTheme(browserTheme) ?? 'dark',
  };
}

export function cacheConsolePatchSettings(
  devToolsSettingsManager: DevToolsSettingsManager,
  value: ConsolePatchSettings,
): void {
  if (devToolsSettingsManager.setConsolePatchSettings == null) {
    return;
  }
  devToolsSettingsManager.setConsolePatchSettings(JSON.stringify(value));
}

type ProfilingSettings = {
  isReloadingAndProfiling: boolean,
};

function initializeProfilingSettings(
  devToolsSettingsManager: DevToolsSettingsManager,
): void {
  if (devToolsSettingsManager.getProfilingSettings == null) {
    return;
  }

  const profilingDataString = devToolsSettingsManager.getProfilingSettings();
  const profilingData = parseProfilingSettings(profilingDataString);

  if (profilingData.isReloadingAndProfiling) {
    // For whatever reason, sessionStorage changes are not synchronously picked up in Agent
    initialProfileRef.shouldInitiallyProfile = true;
    sessionStorageSetItem(SESSION_STORAGE_RELOAD_AND_PROFILE_KEY, true);
    sessionStorageSetItem(SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY, true);

    cacheProfilingSettings(devToolsSettingsManager, {
      isReloadingAndProfiling: false,
    });
  }
}

function parseProfilingSettings(
  profilingDataString: string,
): ProfilingSettings {
  const parsedValue = JSON.parse(profilingDataString ?? '{}');
  return {
    isReloadingAndProfiling:
      castBool(parsedValue.isReloadingAndProfiling) ?? false,
  };
}

export function cacheProfilingSettings(
  devToolsSettingsManager: DevToolsSettingsManager,
  value: ProfilingSettings,
): void {
  if (devToolsSettingsManager.setProfilingSettings == null) {
    return;
  }
  devToolsSettingsManager.setProfilingSettings(JSON.stringify(value));
}
