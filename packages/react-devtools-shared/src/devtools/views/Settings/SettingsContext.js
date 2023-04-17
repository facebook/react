/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';

import * as React from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import {
  COMFORTABLE_LINE_HEIGHT,
  COMPACT_LINE_HEIGHT,
  LOCAL_STORAGE_BROWSER_THEME,
  LOCAL_STORAGE_PARSE_HOOK_NAMES_KEY,
  LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS,
  LOCAL_STORAGE_SHOULD_APPEND_COMPONENT_STACK_KEY,
  LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY,
  LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY,
  LOCAL_STORAGE_HIDE_CONSOLE_LOGS_IN_STRICT_MODE,
} from 'react-devtools-shared/src/constants';
import {useLocalStorage} from '../hooks';
import {BridgeContext} from '../context';
import {logEvent} from 'react-devtools-shared/src/Logger';

import type {BrowserTheme} from '../DevTools';

export type DisplayDensity = 'comfortable' | 'compact';
export type Theme = 'auto' | 'light' | 'dark';

type Context = {
  displayDensity: DisplayDensity,
  setDisplayDensity(value: DisplayDensity): void,

  // Derived from display density.
  // Specified as a separate prop so it can trigger a re-render of FixedSizeList.
  lineHeight: number,

  appendComponentStack: boolean,
  setAppendComponentStack: (value: boolean) => void,

  breakOnConsoleErrors: boolean,
  setBreakOnConsoleErrors: (value: boolean) => void,

  parseHookNames: boolean,
  setParseHookNames: (value: boolean) => void,

  hideConsoleLogsInStrictMode: boolean,
  setHideConsoleLogsInStrictMode: (value: boolean) => void,

  showInlineWarningsAndErrors: boolean,
  setShowInlineWarningsAndErrors: (value: boolean) => void,

  theme: Theme,
  setTheme(value: Theme): void,

  browserTheme: Theme,

  traceUpdatesEnabled: boolean,
  setTraceUpdatesEnabled: (value: boolean) => void,
};

const SettingsContext: ReactContext<Context> = createContext<Context>(
  ((null: any): Context),
);
SettingsContext.displayName = 'SettingsContext';

function useLocalStorageWithLog<T>(
  key: string,
  initialValue: T | (() => T),
): [T, (value: T | (() => T)) => void] {
  return useLocalStorage<T>(key, initialValue, (v, k) => {
    logEvent({
      event_name: 'settings-changed',
      metadata: {
        source: 'localStorage setter',
        key: k,
        value: v,
      },
    });
  });
}

type DocumentElements = Array<HTMLElement>;

type Props = {
  browserTheme: BrowserTheme,
  children: React$Node,
  componentsPortalContainer?: Element,
  profilerPortalContainer?: Element,
};

function SettingsContextController({
  browserTheme,
  children,
  componentsPortalContainer,
  profilerPortalContainer,
}: Props): React.Node {
  const bridge = useContext(BridgeContext);

  const [displayDensity, setDisplayDensity] =
    useLocalStorageWithLog<DisplayDensity>(
      'React::DevTools::displayDensity',
      'compact',
    );
  const [theme, setTheme] = useLocalStorageWithLog<Theme>(
    LOCAL_STORAGE_BROWSER_THEME,
    'auto',
  );
  const [appendComponentStack, setAppendComponentStack] =
    useLocalStorageWithLog<boolean>(
      LOCAL_STORAGE_SHOULD_APPEND_COMPONENT_STACK_KEY,
      true,
    );
  const [breakOnConsoleErrors, setBreakOnConsoleErrors] =
    useLocalStorageWithLog<boolean>(
      LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS,
      false,
    );
  const [parseHookNames, setParseHookNames] = useLocalStorageWithLog<boolean>(
    LOCAL_STORAGE_PARSE_HOOK_NAMES_KEY,
    false,
  );
  const [hideConsoleLogsInStrictMode, setHideConsoleLogsInStrictMode] =
    useLocalStorageWithLog<boolean>(
      LOCAL_STORAGE_HIDE_CONSOLE_LOGS_IN_STRICT_MODE,
      false,
    );
  const [showInlineWarningsAndErrors, setShowInlineWarningsAndErrors] =
    useLocalStorageWithLog<boolean>(
      LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY,
      true,
    );
  const [traceUpdatesEnabled, setTraceUpdatesEnabled] =
    useLocalStorageWithLog<boolean>(
      LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY,
      false,
    );

  const documentElements = useMemo<DocumentElements>(() => {
    const array: Array<HTMLElement> = [
      ((document.documentElement: any): HTMLElement),
    ];
    if (componentsPortalContainer != null) {
      array.push(
        ((componentsPortalContainer.ownerDocument
          .documentElement: any): HTMLElement),
      );
    }
    if (profilerPortalContainer != null) {
      array.push(
        ((profilerPortalContainer.ownerDocument
          .documentElement: any): HTMLElement),
      );
    }
    return array;
  }, [componentsPortalContainer, profilerPortalContainer]);

  useLayoutEffect(() => {
    switch (displayDensity) {
      case 'comfortable':
        updateDisplayDensity('comfortable', documentElements);
        break;
      case 'compact':
        updateDisplayDensity('compact', documentElements);
        break;
      default:
        throw Error(`Unsupported displayDensity value "${displayDensity}"`);
    }
  }, [displayDensity, documentElements]);

  useLayoutEffect(() => {
    switch (theme) {
      case 'light':
        updateThemeVariables('light', documentElements);
        break;
      case 'dark':
        updateThemeVariables('dark', documentElements);
        break;
      case 'auto':
        updateThemeVariables(browserTheme, documentElements);
        break;
      default:
        throw Error(`Unsupported theme value "${theme}"`);
    }
  }, [browserTheme, theme, documentElements]);

  useEffect(() => {
    bridge.send('updateConsolePatchSettings', {
      appendComponentStack,
      breakOnConsoleErrors,
      showInlineWarningsAndErrors,
      hideConsoleLogsInStrictMode,
      browserTheme,
    });
  }, [
    bridge,
    appendComponentStack,
    breakOnConsoleErrors,
    showInlineWarningsAndErrors,
    hideConsoleLogsInStrictMode,
    browserTheme,
  ]);

  useEffect(() => {
    bridge.send('setTraceUpdatesEnabled', traceUpdatesEnabled);
  }, [bridge, traceUpdatesEnabled]);

  const value = useMemo(
    () => ({
      appendComponentStack,
      breakOnConsoleErrors,
      displayDensity,
      lineHeight:
        displayDensity === 'compact'
          ? COMPACT_LINE_HEIGHT
          : COMFORTABLE_LINE_HEIGHT,
      parseHookNames,
      setAppendComponentStack,
      setBreakOnConsoleErrors,
      setDisplayDensity,
      setParseHookNames,
      setTheme,
      setTraceUpdatesEnabled,
      setShowInlineWarningsAndErrors,
      showInlineWarningsAndErrors,
      setHideConsoleLogsInStrictMode,
      hideConsoleLogsInStrictMode,
      theme,
      browserTheme,
      traceUpdatesEnabled,
    }),
    [
      appendComponentStack,
      breakOnConsoleErrors,
      displayDensity,
      parseHookNames,
      setAppendComponentStack,
      setBreakOnConsoleErrors,
      setDisplayDensity,
      setParseHookNames,
      setTheme,
      setTraceUpdatesEnabled,
      setShowInlineWarningsAndErrors,
      showInlineWarningsAndErrors,
      setHideConsoleLogsInStrictMode,
      hideConsoleLogsInStrictMode,
      theme,
      browserTheme,
      traceUpdatesEnabled,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function updateDisplayDensity(
  displayDensity: DisplayDensity,
  documentElements: DocumentElements,
): void {
  // Sizes and paddings/margins are all rem-based,
  // so update the root font-size as well when the display preference changes.
  const computedStyle = getComputedStyle((document.body: any));
  const fontSize = computedStyle.getPropertyValue(
    `--${displayDensity}-root-font-size`,
  );
  const root = ((document.querySelector(':root'): any): HTMLElement);
  root.style.fontSize = fontSize;
}

export function updateThemeVariables(
  theme: Theme,
  documentElements: DocumentElements,
): void {
  // Update scrollbar color to match theme.
  // this CSS property is currently only supported in Firefox,
  // but it makes a significant UI improvement in dark mode.
  // https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-color
  documentElements.forEach(documentElement => {
    // $FlowFixMe[prop-missing] scrollbarColor is missing in CSSStyleDeclaration
    documentElement.style.scrollbarColor = `var(${`--${theme}-color-scroll-thumb`}) var(${`--${theme}-color-scroll-track`})`;
  });
}

export {SettingsContext, SettingsContextController};
