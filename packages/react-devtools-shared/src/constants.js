/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const CHROME_WEBSTORE_EXTENSION_ID = 'fmkadmapgofadopljbjfkapdkoienihi';
export const INTERNAL_EXTENSION_ID = 'dnjnjgbfilfphmojnmhliehogmojhclc';
export const LOCAL_EXTENSION_ID = 'ikiahnapldjmdmpkmfhjdjilojjhgcbf';

// Flip this flag to true to enable verbose console debug logging.
export const __DEBUG__ = false;

// Flip this flag to true to enable performance.mark() and performance.measure() timings.
export const __PERFORMANCE_PROFILE__ = false;

export const TREE_OPERATION_ADD = 1;
export const TREE_OPERATION_REMOVE = 2;
export const TREE_OPERATION_REORDER_CHILDREN = 3;
export const TREE_OPERATION_UPDATE_TREE_BASE_DURATION = 4;
export const TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS = 5;
export const TREE_OPERATION_REMOVE_ROOT = 6;
export const TREE_OPERATION_SET_SUBTREE_MODE = 7;

export const PROFILING_FLAG_BASIC_SUPPORT = 0b01;
export const PROFILING_FLAG_TIMELINE_SUPPORT = 0b10;

export const LOCAL_STORAGE_DEFAULT_TAB_KEY = 'React::DevTools::defaultTab';
export const LOCAL_STORAGE_COMPONENT_FILTER_PREFERENCES_KEY =
  'React::DevTools::componentFilters';
export const SESSION_STORAGE_LAST_SELECTION_KEY =
  'React::DevTools::lastSelection';
export const LOCAL_STORAGE_OPEN_IN_EDITOR_URL =
  'React::DevTools::openInEditorUrl';
export const LOCAL_STORAGE_OPEN_IN_EDITOR_URL_PRESET =
  'React::DevTools::openInEditorUrlPreset';
export const LOCAL_STORAGE_PARSE_HOOK_NAMES_KEY =
  'React::DevTools::parseHookNames';
export const SESSION_STORAGE_RECORD_CHANGE_DESCRIPTIONS_KEY =
  'React::DevTools::recordChangeDescriptions';
export const SESSION_STORAGE_RELOAD_AND_PROFILE_KEY =
  'React::DevTools::reloadAndProfile';
export const LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS =
  'React::DevTools::breakOnConsoleErrors';
export const LOCAL_STORAGE_BROWSER_THEME = 'React::DevTools::theme';
export const LOCAL_STORAGE_SHOULD_APPEND_COMPONENT_STACK_KEY =
  'React::DevTools::appendComponentStack';
export const LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY =
  'React::DevTools::showInlineWarningsAndErrors';
export const LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY =
  'React::DevTools::traceUpdatesEnabled';
export const LOCAL_STORAGE_HIDE_CONSOLE_LOGS_IN_STRICT_MODE =
  'React::DevTools::hideConsoleLogsInStrictMode';
export const LOCAL_STORAGE_SUPPORTS_PROFILING_KEY =
  'React::DevTools::supportsProfiling';

export const PROFILER_EXPORT_VERSION = 5;

export const FIREFOX_CONSOLE_DIMMING_COLOR = 'color: rgba(124, 124, 124, 0.75)';
export const ANSI_STYLE_DIMMING_TEMPLATE = '\x1b[2;38;2;124;124;124m%s\x1b[0m';
export const ANSI_STYLE_DIMMING_TEMPLATE_WITH_COMPONENT_STACK =
  '\x1b[2;38;2;124;124;124m%s %o\x1b[0m';
