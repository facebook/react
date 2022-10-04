/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

export const PROFILER_EXPORT_VERSION = 5;

export const CHANGE_LOG_URL =
  'https://github.com/facebook/react/blob/main/packages/react-devtools/CHANGELOG.md';

export const UNSUPPORTED_VERSION_URL =
  'https://reactjs.org/blog/2019/08/15/new-react-devtools.html#how-do-i-get-the-old-version-back';

export const REACT_DEVTOOLS_WORKPLACE_URL =
  'https://fburl.com/react-devtools-workplace-group';

import type {
  Theme,
  DisplayDensity,
} from './devtools/views/Settings/SettingsContext';

export const THEME_STYLES: {[style: Theme | DisplayDensity]: any, ...} = {
  light: {
    '--color-attribute-name': '#ef6632',
    '--color-attribute-name-not-editable': '#23272f',
    '--color-attribute-name-inverted': 'rgba(255, 255, 255, 0.7)',
    '--color-attribute-value': '#1a1aa6',
    '--color-attribute-value-inverted': '#ffffff',
    '--color-attribute-editable-value': '#1a1aa6',
    '--color-background': '#ffffff',
    '--color-background-hover': 'rgba(0, 136, 250, 0.1)',
    '--color-background-inactive': '#e5e5e5',
    '--color-background-invalid': '#fff0f0',
    '--color-background-selected': '#0088fa',
    '--color-button-background': '#ffffff',
    '--color-button-background-focus': '#ededed',
    '--color-button': '#5f6673',
    '--color-button-disabled': '#cfd1d5',
    '--color-button-active': '#0088fa',
    '--color-button-focus': '#23272f',
    '--color-button-hover': '#23272f',
    '--color-border': '#eeeeee',
    '--color-commit-did-not-render-fill': '#cfd1d5',
    '--color-commit-did-not-render-fill-text': '#000000',
    '--color-commit-did-not-render-pattern': '#cfd1d5',
    '--color-commit-did-not-render-pattern-text': '#333333',
    '--color-commit-gradient-0': '#37afa9',
    '--color-commit-gradient-1': '#63b19e',
    '--color-commit-gradient-2': '#80b393',
    '--color-commit-gradient-3': '#97b488',
    '--color-commit-gradient-4': '#abb67d',
    '--color-commit-gradient-5': '#beb771',
    '--color-commit-gradient-6': '#cfb965',
    '--color-commit-gradient-7': '#dfba57',
    '--color-commit-gradient-8': '#efbb49',
    '--color-commit-gradient-9': '#febc38',
    '--color-commit-gradient-text': '#000000',
    '--color-component-name': '#6a51b2',
    '--color-component-name-inverted': '#ffffff',
    '--color-component-badge-background': 'rgba(0, 0, 0, 0.1)',
    '--color-component-badge-background-inverted': 'rgba(255, 255, 255, 0.25)',
    '--color-component-badge-count': '#777d88',
    '--color-component-badge-count-inverted': 'rgba(255, 255, 255, 0.7)',
    '--color-console-error-badge-text': '#ffffff',
    '--color-console-error-background': '#fff0f0',
    '--color-console-error-border': '#ffd6d6',
    '--color-console-error-icon': '#eb3941',
    '--color-console-error-text': '#fe2e31',
    '--color-console-warning-badge-text': '#000000',
    '--color-console-warning-background': '#fffbe5',
    '--color-console-warning-border': '#fff5c1',
    '--color-console-warning-icon': '#f4bd00',
    '--color-console-warning-text': '#64460c',
    '--color-context-background': 'rgba(0,0,0,.9)',
    '--color-context-background-hover': 'rgba(255, 255, 255, 0.1)',
    '--color-context-background-selected': '#178fb9',
    '--color-context-border': '#3d424a',
    '--color-context-text': '#ffffff',
    '--color-context-text-selected': '#ffffff',
    '--color-dim': '#777d88',
    '--color-dimmer': '#cfd1d5',
    '--color-dimmest': '#eff0f1',
    '--color-error-background': 'hsl(0, 100%, 97%)',
    '--color-error-border': 'hsl(0, 100%, 92%)',
    '--color-error-text': '#ff0000',
    '--color-expand-collapse-toggle': '#777d88',
    '--color-link': '#0000ff',
    '--color-modal-background': 'rgba(255, 255, 255, 0.75)',
    '--color-bridge-version-npm-background': '#eff0f1',
    '--color-bridge-version-npm-text': '#000000',
    '--color-bridge-version-number': '#0088fa',
    '--color-primitive-hook-badge-background': '#e5e5e5',
    '--color-primitive-hook-badge-text': '#5f6673',
    '--color-record-active': '#fc3a4b',
    '--color-record-hover': '#3578e5',
    '--color-record-inactive': '#0088fa',
    '--color-resize-bar': '#eeeeee',
    '--color-resize-bar-active': '#dcdcdc',
    '--color-resize-bar-border': '#d1d1d1',
    '--color-resize-bar-dot': '#333333',
    '--color-timeline-internal-module': '#d1d1d1',
    '--color-timeline-internal-module-hover': '#c9c9c9',
    '--color-timeline-internal-module-text': '#444',
    '--color-timeline-native-event': '#ccc',
    '--color-timeline-native-event-hover': '#aaa',
    '--color-timeline-network-primary': '#fcf3dc',
    '--color-timeline-network-primary-hover': '#f0e7d1',
    '--color-timeline-network-secondary': '#efc457',
    '--color-timeline-network-secondary-hover': '#e3ba52',
    '--color-timeline-priority-background': '#f6f6f6',
    '--color-timeline-priority-border': '#eeeeee',
    '--color-timeline-user-timing': '#c9cacd',
    '--color-timeline-user-timing-hover': '#93959a',
    '--color-timeline-react-idle': '#d3e5f6',
    '--color-timeline-react-idle-hover': '#c3d9ef',
    '--color-timeline-react-render': '#9fc3f3',
    '--color-timeline-react-render-hover': '#83afe9',
    '--color-timeline-react-render-text': '#11365e',
    '--color-timeline-react-commit': '#c88ff0',
    '--color-timeline-react-commit-hover': '#b281d6',
    '--color-timeline-react-commit-text': '#3e2c4a',
    '--color-timeline-react-layout-effects': '#b281d6',
    '--color-timeline-react-layout-effects-hover': '#9d71bd',
    '--color-timeline-react-layout-effects-text': '#3e2c4a',
    '--color-timeline-react-passive-effects': '#b281d6',
    '--color-timeline-react-passive-effects-hover': '#9d71bd',
    '--color-timeline-react-passive-effects-text': '#3e2c4a',
    '--color-timeline-react-schedule': '#9fc3f3',
    '--color-timeline-react-schedule-hover': '#2683E2',
    '--color-timeline-react-suspense-rejected': '#f1cc14',
    '--color-timeline-react-suspense-rejected-hover': '#ffdf37',
    '--color-timeline-react-suspense-resolved': '#a6e59f',
    '--color-timeline-react-suspense-resolved-hover': '#89d281',
    '--color-timeline-react-suspense-unresolved': '#c9cacd',
    '--color-timeline-react-suspense-unresolved-hover': '#93959a',
    '--color-timeline-thrown-error': '#ee1638',
    '--color-timeline-thrown-error-hover': '#da1030',
    '--color-timeline-text-color': '#000000',
    '--color-timeline-text-dim-color': '#ccc',
    '--color-timeline-react-work-border': '#eeeeee',
    '--color-search-match': 'yellow',
    '--color-search-match-current': '#f7923b',
    '--color-selected-tree-highlight-active': 'rgba(0, 136, 250, 0.1)',
    '--color-selected-tree-highlight-inactive': 'rgba(0, 0, 0, 0.05)',
    '--color-scroll-caret': 'rgba(150, 150, 150, 0.5)',
    '--color-tab-selected-border': '#0088fa',
    '--color-text': '#000000',
    '--color-text-invalid': '#ff0000',
    '--color-text-selected': '#ffffff',
    '--color-toggle-background-invalid': '#fc3a4b',
    '--color-toggle-background-on': '#0088fa',
    '--color-toggle-background-off': '#cfd1d5',
    '--color-toggle-text': '#ffffff',
    '--color-warning-background': '#fb3655',
    '--color-warning-background-hover': '#f82042',
    '--color-warning-text-color': '#ffffff',
    '--color-warning-text-color-inverted': '#fd4d69',

    // The styles below should be kept in sync with 'root.css'
    // They are repeated there because they're used by e.g. tooltips or context menus
    // which get rendered outside of the DOM subtree (where normal theme/styles are written).
    '--color-scroll-thumb': '#c2c2c2',
    '--color-scroll-track': '#fafafa',
    '--color-tooltip-background': 'rgba(0, 0, 0, 0.9)',
    '--color-tooltip-text': '#ffffff',
  },
  dark: {
    '--color-attribute-name': '#9d87d2',
    '--color-attribute-name-not-editable': '#ededed',
    '--color-attribute-name-inverted': '#282828',
    '--color-attribute-value': '#cedae0',
    '--color-attribute-value-inverted': '#ffffff',
    '--color-attribute-editable-value': 'yellow',
    '--color-background': '#282c34',
    '--color-background-hover': 'rgba(255, 255, 255, 0.1)',
    '--color-background-inactive': '#3d424a',
    '--color-background-invalid': '#5c0000',
    '--color-background-selected': '#178fb9',
    '--color-button-background': '#282c34',
    '--color-button-background-focus': '#3d424a',
    '--color-button': '#afb3b9',
    '--color-button-active': '#61dafb',
    '--color-button-disabled': '#4f5766',
    '--color-button-focus': '#a2e9fc',
    '--color-button-hover': '#ededed',
    '--color-border': '#3d424a',
    '--color-commit-did-not-render-fill': '#777d88',
    '--color-commit-did-not-render-fill-text': '#000000',
    '--color-commit-did-not-render-pattern': '#666c77',
    '--color-commit-did-not-render-pattern-text': '#ffffff',
    '--color-commit-gradient-0': '#37afa9',
    '--color-commit-gradient-1': '#63b19e',
    '--color-commit-gradient-2': '#80b393',
    '--color-commit-gradient-3': '#97b488',
    '--color-commit-gradient-4': '#abb67d',
    '--color-commit-gradient-5': '#beb771',
    '--color-commit-gradient-6': '#cfb965',
    '--color-commit-gradient-7': '#dfba57',
    '--color-commit-gradient-8': '#efbb49',
    '--color-commit-gradient-9': '#febc38',
    '--color-commit-gradient-text': '#000000',
    '--color-component-name': '#61dafb',
    '--color-component-name-inverted': '#282828',
    '--color-component-badge-background': 'rgba(255, 255, 255, 0.25)',
    '--color-component-badge-background-inverted': 'rgba(0, 0, 0, 0.25)',
    '--color-component-badge-count': '#8f949d',
    '--color-component-badge-count-inverted': 'rgba(255, 255, 255, 0.7)',
    '--color-console-error-badge-text': '#000000',
    '--color-console-error-background': '#290000',
    '--color-console-error-border': '#5c0000',
    '--color-console-error-icon': '#eb3941',
    '--color-console-error-text': '#fc7f7f',
    '--color-console-warning-badge-text': '#000000',
    '--color-console-warning-background': '#332b00',
    '--color-console-warning-border': '#665500',
    '--color-console-warning-icon': '#f4bd00',
    '--color-console-warning-text': '#f5f2ed',
    '--color-context-background': 'rgba(255,255,255,.95)',
    '--color-context-background-hover': 'rgba(0, 136, 250, 0.1)',
    '--color-context-background-selected': '#0088fa',
    '--color-context-border': '#eeeeee',
    '--color-context-text': '#000000',
    '--color-context-text-selected': '#ffffff',
    '--color-dim': '#8f949d',
    '--color-dimmer': '#777d88',
    '--color-dimmest': '#4f5766',
    '--color-error-background': '#200',
    '--color-error-border': '#900',
    '--color-error-text': '#f55',
    '--color-expand-collapse-toggle': '#8f949d',
    '--color-link': '#61dafb',
    '--color-modal-background': 'rgba(0, 0, 0, 0.75)',
    '--color-bridge-version-npm-background': 'rgba(0, 0, 0, 0.25)',
    '--color-bridge-version-npm-text': '#ffffff',
    '--color-bridge-version-number': 'yellow',
    '--color-primitive-hook-badge-background': 'rgba(0, 0, 0, 0.25)',
    '--color-primitive-hook-badge-text': 'rgba(255, 255, 255, 0.7)',
    '--color-record-active': '#fc3a4b',
    '--color-record-hover': '#a2e9fc',
    '--color-record-inactive': '#61dafb',
    '--color-resize-bar': '#282c34',
    '--color-resize-bar-active': '#31363f',
    '--color-resize-bar-border': '#3d424a',
    '--color-resize-bar-dot': '#cfd1d5',
    '--color-timeline-internal-module': '#303542',
    '--color-timeline-internal-module-hover': '#363b4a',
    '--color-timeline-internal-module-text': '#7f8899',
    '--color-timeline-native-event': '#b2b2b2',
    '--color-timeline-native-event-hover': '#949494',
    '--color-timeline-network-primary': '#fcf3dc',
    '--color-timeline-network-primary-hover': '#e3dbc5',
    '--color-timeline-network-secondary': '#efc457',
    '--color-timeline-network-secondary-hover': '#d6af4d',
    '--color-timeline-priority-background': '#1d2129',
    '--color-timeline-priority-border': '#282c34',
    '--color-timeline-user-timing': '#c9cacd',
    '--color-timeline-user-timing-hover': '#93959a',
    '--color-timeline-react-idle': '#3d485b',
    '--color-timeline-react-idle-hover': '#465269',
    '--color-timeline-react-render': '#2683E2',
    '--color-timeline-react-render-hover': '#1a76d4',
    '--color-timeline-react-render-text': '#11365e',
    '--color-timeline-react-commit': '#731fad',
    '--color-timeline-react-commit-hover': '#611b94',
    '--color-timeline-react-commit-text': '#e5c1ff',
    '--color-timeline-react-layout-effects': '#611b94',
    '--color-timeline-react-layout-effects-hover': '#51167a',
    '--color-timeline-react-layout-effects-text': '#e5c1ff',
    '--color-timeline-react-passive-effects': '#611b94',
    '--color-timeline-react-passive-effects-hover': '#51167a',
    '--color-timeline-react-passive-effects-text': '#e5c1ff',
    '--color-timeline-react-schedule': '#2683E2',
    '--color-timeline-react-schedule-hover': '#1a76d4',
    '--color-timeline-react-suspense-rejected': '#f1cc14',
    '--color-timeline-react-suspense-rejected-hover': '#e4c00f',
    '--color-timeline-react-suspense-resolved': '#a6e59f',
    '--color-timeline-react-suspense-resolved-hover': '#89d281',
    '--color-timeline-react-suspense-unresolved': '#c9cacd',
    '--color-timeline-react-suspense-unresolved-hover': '#93959a',
    '--color-timeline-thrown-error': '#fb3655',
    '--color-timeline-thrown-error-hover': '#f82042',
    '--color-timeline-text-color': '#282c34',
    '--color-timeline-text-dim-color': '#555b66',
    '--color-timeline-react-work-border': '#3d424a',
    '--color-search-match': 'yellow',
    '--color-search-match-current': '#f7923b',
    '--color-selected-tree-highlight-active': 'rgba(23, 143, 185, 0.15)',
    '--color-selected-tree-highlight-inactive': 'rgba(255, 255, 255, 0.05)',
    '--color-scroll-caret': '#4f5766',
    '--color-shadow': 'rgba(0, 0, 0, 0.5)',
    '--color-tab-selected-border': '#178fb9',
    '--color-text': '#ffffff',
    '--color-text-invalid': '#ff8080',
    '--color-text-selected': '#ffffff',
    '--color-toggle-background-invalid': '#fc3a4b',
    '--color-toggle-background-on': '#178fb9',
    '--color-toggle-background-off': '#777d88',
    '--color-toggle-text': '#ffffff',
    '--color-warning-background': '#ee1638',
    '--color-warning-background-hover': '#da1030',
    '--color-warning-text-color': '#ffffff',
    '--color-warning-text-color-inverted': '#ee1638',

    // The styles below should be kept in sync with 'root.css'
    // They are repeated there because they're used by e.g. tooltips or context menus
    // which get rendered outside of the DOM subtree (where normal theme/styles are written).
    '--color-scroll-thumb': '#afb3b9',
    '--color-scroll-track': '#313640',
    '--color-tooltip-background': 'rgba(255, 255, 255, 0.95)',
    '--color-tooltip-text': '#000000',
  },
  compact: {
    '--font-size-monospace-small': '9px',
    '--font-size-monospace-normal': '11px',
    '--font-size-monospace-large': '15px',
    '--font-size-sans-small': '10px',
    '--font-size-sans-normal': '12px',
    '--font-size-sans-large': '14px',
    '--line-height-data': '18px',
  },
  comfortable: {
    '--font-size-monospace-small': '10px',
    '--font-size-monospace-normal': '13px',
    '--font-size-monospace-large': '17px',
    '--font-size-sans-small': '12px',
    '--font-size-sans-normal': '14px',
    '--font-size-sans-large': '16px',
    '--line-height-data': '22px',
  },
};

// HACK
//
// Sometimes the inline target is rendered before root styles are applied,
// which would result in e.g. NaN itemSize being passed to react-window list.
const COMFORTABLE_LINE_HEIGHT: number = parseInt(
  THEME_STYLES.comfortable['--line-height-data'],
  10,
);
const COMPACT_LINE_HEIGHT: number = parseInt(
  THEME_STYLES.compact['--line-height-data'],
  10,
);

export {COMFORTABLE_LINE_HEIGHT, COMPACT_LINE_HEIGHT};
