/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

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
  LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS,
  LOCAL_STORAGE_SHOULD_PATCH_CONSOLE_KEY,
  LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY,
} from 'react-devtools-shared/src/constants';
import {useLocalStorage} from '../hooks';
import {BridgeContext} from '../context';

import type {BrowserTheme} from '../DevTools';

export type DisplayDensity = 'comfortable' | 'compact';
export type Theme = 'auto' | 'light' | 'dark';

type Context = {|
  displayDensity: DisplayDensity,
  setDisplayDensity(value: DisplayDensity): void,

  // Derived from display density.
  // Specified as a separate prop so it can trigger a re-render of FixedSizeList.
  lineHeight: number,

  appendComponentStack: boolean,
  setAppendComponentStack: (value: boolean) => void,

  breakOnConsoleErrors: boolean,
  setBreakOnConsoleErrors: (value: boolean) => void,

  theme: Theme,
  setTheme(value: Theme): void,

  traceUpdatesEnabled: boolean,
  setTraceUpdatesEnabled: (value: boolean) => void,
|};

const SettingsContext = createContext<Context>(((null: any): Context));
SettingsContext.displayName = 'SettingsContext';

type DocumentElements = Array<HTMLElement>;

type Props = {|
  browserTheme: BrowserTheme,
  children: React$Node,
  componentsPortalContainer?: Element,
  profilerPortalContainer?: Element,
|};

function SettingsContextController({
  browserTheme,
  children,
  componentsPortalContainer,
  profilerPortalContainer,
}: Props) {
  const bridge = useContext(BridgeContext);

  const [displayDensity, setDisplayDensity] = useLocalStorage<DisplayDensity>(
    'React::DevTools::displayDensity',
    'compact',
  );
  const [theme, setTheme] = useLocalStorage<Theme>(
    'React::DevTools::theme',
    'auto',
  );
  const [
    appendComponentStack,
    setAppendComponentStack,
  ] = useLocalStorage<boolean>(LOCAL_STORAGE_SHOULD_PATCH_CONSOLE_KEY, true);
  const [
    breakOnConsoleErrors,
    setBreakOnConsoleErrors,
  ] = useLocalStorage<boolean>(
    LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS,
    false,
  );
  const [
    traceUpdatesEnabled,
    setTraceUpdatesEnabled,
  ] = useLocalStorage<boolean>(LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY, false);

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
    });
  }, [bridge, appendComponentStack, breakOnConsoleErrors]);

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
      setAppendComponentStack,
      setBreakOnConsoleErrors,
      setDisplayDensity,
      setTheme,
      setTraceUpdatesEnabled,
      theme,
      traceUpdatesEnabled,
    }),
    [
      appendComponentStack,
      breakOnConsoleErrors,
      displayDensity,
      setAppendComponentStack,
      setBreakOnConsoleErrors,
      setDisplayDensity,
      setTheme,
      setTraceUpdatesEnabled,
      theme,
      traceUpdatesEnabled,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

function setStyleVariable(
  name: string,
  value: string,
  documentElements: DocumentElements,
) {
  documentElements.forEach(documentElement =>
    documentElement.style.setProperty(name, value),
  );
}

function updateStyleHelper(
  themeKey: string,
  style: string,
  documentElements: DocumentElements,
) {
  setStyleVariable(
    `--${style}`,
    `var(--${themeKey}-${style})`,
    documentElements,
  );
}

export function updateDisplayDensity(
  displayDensity: DisplayDensity,
  documentElements: DocumentElements,
): void {
  updateStyleHelper(
    displayDensity,
    'font-size-monospace-normal',
    documentElements,
  );
  updateStyleHelper(
    displayDensity,
    'font-size-monospace-large',
    documentElements,
  );
  updateStyleHelper(
    displayDensity,
    'font-size-monospace-small',
    documentElements,
  );
  updateStyleHelper(displayDensity, 'font-size-sans-normal', documentElements);
  updateStyleHelper(displayDensity, 'font-size-sans-large', documentElements);
  updateStyleHelper(displayDensity, 'font-size-sans-small', documentElements);
  updateStyleHelper(displayDensity, 'line-height-data', documentElements);

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
  updateStyleHelper(theme, 'color-attribute-name', documentElements);
  updateStyleHelper(
    theme,
    'color-attribute-name-not-editable',
    documentElements,
  );
  updateStyleHelper(theme, 'color-attribute-name-inverted', documentElements);
  updateStyleHelper(theme, 'color-attribute-value', documentElements);
  updateStyleHelper(theme, 'color-attribute-value-inverted', documentElements);
  updateStyleHelper(theme, 'color-attribute-editable-value', documentElements);
  updateStyleHelper(theme, 'color-background', documentElements);
  updateStyleHelper(theme, 'color-background-hover', documentElements);
  updateStyleHelper(theme, 'color-background-inactive', documentElements);
  updateStyleHelper(theme, 'color-background-invalid', documentElements);
  updateStyleHelper(theme, 'color-background-selected', documentElements);
  updateStyleHelper(theme, 'color-border', documentElements);
  updateStyleHelper(theme, 'color-button-background', documentElements);
  updateStyleHelper(theme, 'color-button-background-focus', documentElements);
  updateStyleHelper(theme, 'color-button', documentElements);
  updateStyleHelper(theme, 'color-button-active', documentElements);
  updateStyleHelper(theme, 'color-button-disabled', documentElements);
  updateStyleHelper(theme, 'color-button-focus', documentElements);
  updateStyleHelper(theme, 'color-button-hover', documentElements);
  updateStyleHelper(
    theme,
    'color-commit-did-not-render-fill',
    documentElements,
  );
  updateStyleHelper(
    theme,
    'color-commit-did-not-render-fill-text',
    documentElements,
  );
  updateStyleHelper(
    theme,
    'color-commit-did-not-render-pattern',
    documentElements,
  );
  updateStyleHelper(
    theme,
    'color-commit-did-not-render-pattern-text',
    documentElements,
  );
  updateStyleHelper(theme, 'color-commit-gradient-0', documentElements);
  updateStyleHelper(theme, 'color-commit-gradient-1', documentElements);
  updateStyleHelper(theme, 'color-commit-gradient-2', documentElements);
  updateStyleHelper(theme, 'color-commit-gradient-3', documentElements);
  updateStyleHelper(theme, 'color-commit-gradient-4', documentElements);
  updateStyleHelper(theme, 'color-commit-gradient-5', documentElements);
  updateStyleHelper(theme, 'color-commit-gradient-6', documentElements);
  updateStyleHelper(theme, 'color-commit-gradient-7', documentElements);
  updateStyleHelper(theme, 'color-commit-gradient-8', documentElements);
  updateStyleHelper(theme, 'color-commit-gradient-9', documentElements);
  updateStyleHelper(theme, 'color-commit-gradient-text', documentElements);
  updateStyleHelper(theme, 'color-component-name', documentElements);
  updateStyleHelper(theme, 'color-component-name-inverted', documentElements);
  updateStyleHelper(
    theme,
    'color-component-badge-background',
    documentElements,
  );
  updateStyleHelper(
    theme,
    'color-component-badge-background-inverted',
    documentElements,
  );
  updateStyleHelper(theme, 'color-component-badge-count', documentElements);
  updateStyleHelper(
    theme,
    'color-component-badge-count-inverted',
    documentElements,
  );
  updateStyleHelper(theme, 'color-context-background', documentElements);
  updateStyleHelper(theme, 'color-context-background-hover', documentElements);
  updateStyleHelper(
    theme,
    'color-context-background-selected',
    documentElements,
  );
  updateStyleHelper(theme, 'color-context-border', documentElements);
  updateStyleHelper(theme, 'color-context-text', documentElements);
  updateStyleHelper(theme, 'color-context-text-selected', documentElements);
  updateStyleHelper(theme, 'color-dim', documentElements);
  updateStyleHelper(theme, 'color-dimmer', documentElements);
  updateStyleHelper(theme, 'color-dimmest', documentElements);
  updateStyleHelper(theme, 'color-error-background', documentElements);
  updateStyleHelper(theme, 'color-error-border', documentElements);
  updateStyleHelper(theme, 'color-error-text', documentElements);
  updateStyleHelper(theme, 'color-expand-collapse-toggle', documentElements);
  updateStyleHelper(theme, 'color-link', documentElements);
  updateStyleHelper(theme, 'color-modal-background', documentElements);
  updateStyleHelper(theme, 'color-record-active', documentElements);
  updateStyleHelper(theme, 'color-record-hover', documentElements);
  updateStyleHelper(theme, 'color-record-inactive', documentElements);
  updateStyleHelper(theme, 'color-color-scroll-thumb', documentElements);
  updateStyleHelper(theme, 'color-color-scroll-track', documentElements);
  updateStyleHelper(theme, 'color-search-match', documentElements);
  updateStyleHelper(theme, 'color-shadow', documentElements);
  updateStyleHelper(theme, 'color-search-match-current', documentElements);
  updateStyleHelper(
    theme,
    'color-selected-tree-highlight-active',
    documentElements,
  );
  updateStyleHelper(
    theme,
    'color-selected-tree-highlight-inactive',
    documentElements,
  );
  updateStyleHelper(theme, 'color-tab-selected-border', documentElements);
  updateStyleHelper(theme, 'color-text', documentElements);
  updateStyleHelper(theme, 'color-text-invalid', documentElements);
  updateStyleHelper(theme, 'color-text-selected', documentElements);
  updateStyleHelper(theme, 'color-toggle-background-invalid', documentElements);
  updateStyleHelper(theme, 'color-toggle-background-on', documentElements);
  updateStyleHelper(theme, 'color-toggle-background-off', documentElements);
  updateStyleHelper(theme, 'color-toggle-text', documentElements);
  updateStyleHelper(theme, 'color-tooltip-background', documentElements);
  updateStyleHelper(theme, 'color-tooltip-text', documentElements);

  // Font smoothing varies based on the theme.
  updateStyleHelper(theme, 'font-smoothing', documentElements);

  // Update scrollbar color to match theme.
  // this CSS property is currently only supported in Firefox,
  // but it makes a significant UI improvement in dark mode.
  // https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-color
  documentElements.forEach(documentElement => {
    // $FlowFixMe scrollbarColor is missing in CSSStyleDeclaration
    documentElement.style.scrollbarColor = `var(${`--${theme}-color-scroll-thumb`}) var(${`--${theme}-color-scroll-track`})`;
  });
}

export {SettingsContext, SettingsContextController};
