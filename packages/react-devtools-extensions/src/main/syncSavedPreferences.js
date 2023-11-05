/* global chrome */

import {
  getAppendComponentStack,
  getBreakOnConsoleErrors,
  getSavedComponentFilters,
  getShowInlineWarningsAndErrors,
  getHideConsoleLogsInStrictMode,
} from 'react-devtools-shared/src/utils';
import {getBrowserTheme} from 'react-devtools-extensions/src/utils';

// The renderer interface can't read saved component filters directly,
// because they are stored in localStorage within the context of the extension.
// Instead it relies on the extension to pass filters through.
function syncSavedPreferences() {
  chrome.devtools.inspectedWindow.eval(
    `window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = ${JSON.stringify(
      getAppendComponentStack(),
    )};
    window.__REACT_DEVTOOLS_BREAK_ON_CONSOLE_ERRORS__ = ${JSON.stringify(
      getBreakOnConsoleErrors(),
    )};
    window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = ${JSON.stringify(
      getSavedComponentFilters(),
    )};
    window.__REACT_DEVTOOLS_SHOW_INLINE_WARNINGS_AND_ERRORS__ = ${JSON.stringify(
      getShowInlineWarningsAndErrors(),
    )};
    window.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ = ${JSON.stringify(
      getHideConsoleLogsInStrictMode(),
    )};
    window.__REACT_DEVTOOLS_BROWSER_THEME__ = ${JSON.stringify(
      getBrowserTheme(),
    )};`,
  );
}

export default syncSavedPreferences;
