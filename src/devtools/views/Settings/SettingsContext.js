// @flow

import React, { createContext, useLayoutEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks';

import type { BrowserTheme } from '../DevTools';

export type DisplayDensity = 'compact' | 'comfortable';
export type Theme = 'auto' | 'light' | 'dark';

type Context = {|
  displayDensity: DisplayDensity,
  setDisplayDensity(value: DisplayDensity): void,

  // Derived from display density.
  // Specified as a separate prop so it can trigger a re-render of FixedSizeList.
  lineHeight: number,

  theme: Theme,
  setTheme(value: Theme): void,
|};

const SettingsContext = createContext<Context>(((null: any): Context));
SettingsContext.displayName = 'SettingsContext';

type Props = {|
  browserTheme: BrowserTheme,
  children: React$Node,
|};

function SettingsContextController({ browserTheme, children }: Props) {
  const [displayDensity, setDisplayDensity] = useLocalStorage<DisplayDensity>(
    'displayDensity',
    'compact'
  );
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'auto');

  const comfortableLineHeight = parseInt(
    getComputedStyle((document.body: any)).getPropertyValue(
      '--comfortable-line-height-data'
    ),
    10
  );
  const compactLineHeight = parseInt(
    getComputedStyle((document.body: any)).getPropertyValue(
      '--compact-line-height-data'
    ),
    10
  );

  useLayoutEffect(() => {
    switch (displayDensity) {
      case 'compact':
        updateDisplayDensity('compact');
        break;
      case 'comfortable':
        updateDisplayDensity('comfortable');
        break;
      default:
        throw Error(`Unsupported displayDensity value "${displayDensity}"`);
    }
  }, [displayDensity]);

  useLayoutEffect(() => {
    switch (theme) {
      case 'light':
        updateThemeVariables('light');
        break;
      case 'dark':
        updateThemeVariables('dark');
        break;
      case 'auto':
        updateThemeVariables(browserTheme);
        break;
      default:
        throw Error(`Unsupported theme value "${theme}"`);
    }
  }, [browserTheme, theme]);

  const value = useMemo(
    () => ({
      displayDensity,
      setDisplayDensity,
      theme,
      setTheme,
      lineHeight:
        displayDensity === 'compact'
          ? compactLineHeight
          : comfortableLineHeight,
    }),
    [
      comfortableLineHeight,
      compactLineHeight,
      displayDensity,
      setDisplayDensity,
      setTheme,
      theme,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

function setStyleVariable(name: string, value: string) {
  (document.documentElement: any).style.setProperty(name, value);
}

function updateStyleHelper(themeKey: string, style: string) {
  setStyleVariable(`--${style}`, `var(--${themeKey}-${style})`);
}

function updateDisplayDensity(displayDensity: DisplayDensity): void {
  updateStyleHelper(displayDensity, 'font-size-monospace-normal');
  updateStyleHelper(displayDensity, 'font-size-monospace-large');
  updateStyleHelper(displayDensity, 'font-size-sans-normal');
  updateStyleHelper(displayDensity, 'font-size-sans-large');
  updateStyleHelper(displayDensity, 'line-height-data');
}

function updateThemeVariables(theme: Theme): void {
  updateStyleHelper(theme, 'color-attribute-name');
  updateStyleHelper(theme, 'color-attribute-value');
  updateStyleHelper(theme, 'color-attribute-editable-value');
  updateStyleHelper(theme, 'color-background');
  updateStyleHelper(theme, 'color-border');
  updateStyleHelper(theme, 'color-button-background');
  updateStyleHelper(theme, 'color-button-background-focus');
  updateStyleHelper(theme, 'color-button-background-hover');
  updateStyleHelper(theme, 'color-button');
  updateStyleHelper(theme, 'color-button-disabled');
  updateStyleHelper(theme, 'color-button-focus');
  updateStyleHelper(theme, 'color-button-hover');
  updateStyleHelper(theme, 'color-component-name');
  updateStyleHelper(theme, 'color-component-name-inverted');
  updateStyleHelper(theme, 'color-dim');
  updateStyleHelper(theme, 'color-dimmer');
  updateStyleHelper(theme, 'color-dimmest');
  updateStyleHelper(theme, 'color-jsx-arrow-brackets');
  updateStyleHelper(theme, 'color-jsx-arrow-brackets-inverted');
  updateStyleHelper(theme, 'color-tree-node-selected');
  updateStyleHelper(theme, 'color-tree-node-hover');
  updateStyleHelper(theme, 'color-search-match');
  updateStyleHelper(theme, 'color-search-match-current');
  updateStyleHelper(theme, 'color-text-color');
}

export { SettingsContext, SettingsContextController };
