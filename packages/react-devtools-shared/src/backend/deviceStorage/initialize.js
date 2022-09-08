/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {patch as patchConsole} from 'react-devtools-shared/src/backend/console';
import type {InjectedDeviceStorageMethods} from 'react-devtools-shared/src/backend/types';
import {
  LOCAL_STORAGE_SHOULD_APPEND_COMPONENT_STACK_KEY,
  LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS,
  LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY,
  LOCAL_STORAGE_HIDE_CONSOLE_LOGS_IN_STRICT_MODE,
  LOCAL_STORAGE_BROWSER_THEME,
} from 'react-devtools-shared/src/constants';
import type {BrowserTheme} from 'react-devtools-shared/src/devtools/views/DevTools';

export function initializeFromDeviceStorage() {
  patchConsole(getConsolePatchValues());
}

function getConsolePatchValues(): {
  appendComponentStack: boolean,
  breakOnConsoleErrors: boolean,
  showInlineWarningsAndErrors: boolean,
  hideConsoleLogsInStrictMode: boolean,
  browserTheme: BrowserTheme,
} {
  return {
    appendComponentStack:
      castBool(window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__) ?? true,
    breakOnConsoleErrors:
      castBool(window.__REACT_DEVTOOLS_BREAK_ON_CONSOLE_ERRORS__) ?? false,
    showInlineWarningsAndErrors:
      castBool(window.__REACT_DEVTOOLS_SHOW_INLINE_WARNINGS_AND_ERRORS__) ??
      true,
    hideConsoleLogsInStrictMode:
      castBool(window.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__) ??
      false,
    browserTheme:
      castBrowserTheme(window.__REACT_DEVTOOLS_BROWSER_THEME__) ?? 'dark',
  };
}

function castBool(v: any): ?boolean {
  if (v === true || v === false) {
    return v;
  }
}

function castBrowserTheme(v: any): ?BrowserTheme {
  if (v === 'light' || v === 'dark' || v === 'auto') {
    return v;
  }
}
