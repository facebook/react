/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Flip this flag to true to enable verbose console debug logging.
export const __DEBUG__ = false;

export const TREE_OPERATION_ADD = 1;
export const TREE_OPERATION_REMOVE = 2;
export const TREE_OPERATION_REORDER_CHILDREN = 3;
export const TREE_OPERATION_UPDATE_TREE_BASE_DURATION = 4;
export const TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS = 5;
export const TREE_OPERATION_REMOVE_ROOT = 6;

export const LOCAL_STORAGE_FILTER_PREFERENCES_KEY =
  'React::DevTools::componentFilters';

export const SESSION_STORAGE_LAST_SELECTION_KEY =
  'React::DevTools::lastSelection';

export const LOCAL_STORAGE_PARSE_HOOK_NAMES_KEY =
  'React::DevTools::parseHookNames';

export const SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY =
  'React::DevTools::recordChangeDescriptions';

export const SESSION_STORAGE_RELOAD_AND_PROFILE_KEY =
  'React::DevTools::reloadAndProfile';

export const LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS =
  'React::DevTools::breakOnConsoleErrors';

export const LOCAL_STORAGE_SHOULD_PATCH_CONSOLE_KEY =
  'React::DevTools::appendComponentStack';

export const LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY =
  'React::DevTools::showInlineWarningsAndErrors';

export const LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY =
  'React::DevTools::traceUpdatesEnabled';

export const PROFILER_EXPORT_VERSION = 5;

export const CHANGE_LOG_URL =
  'https://github.com/facebook/react/blob/main/packages/react-devtools/CHANGELOG.md';

export const UNSUPPORTED_VERSION_URL =
  'https://reactjs.org/blog/2019/08/15/new-react-devtools.html#how-do-i-get-the-old-version-back';

export const REACT_DEVTOOLS_WORKPLACE_URL =
  'https://fburl.com/react-devtools-workplace-group';

// HACK
//
// Sometimes the inline target is rendered before root styles are applied,
// which would result in e.g. NaN itemSize being passed to react-window list.
const {styles} = require ('react-devtools-shared/src/devtools/views/ThemeProvider');
const COMFORTABLE_LINE_HEIGHT = parseInt(styles.comfortable['--line-height-data'], 10);
const COMPACT_LINE_HEIGHT = parseInt(styles.compact['--line-height-data'], 10);

export {COMFORTABLE_LINE_HEIGHT, COMPACT_LINE_HEIGHT};
