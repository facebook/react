/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ConsolePatchSettings} from './types';

// After receiving cached console patch settings from React Native, we set them on window.
// When the console is initially patched (in renderer.js and hook.js), these values are read.
// The browser extension (etc.) sets these values on window, but through another method.
export function writeConsolePatchSettingsToWindow(
  settings: ConsolePatchSettings,
): void {
  window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ =
    settings.appendComponentStack;
  window.__REACT_DEVTOOLS_BREAK_ON_CONSOLE_ERRORS__ =
    settings.breakOnConsoleErrors;
  window.__REACT_DEVTOOLS_SHOW_INLINE_WARNINGS_AND_ERRORS__ =
    settings.showInlineWarningsAndErrors;
  window.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ =
    settings.hideConsoleLogsInStrictMode;
}
