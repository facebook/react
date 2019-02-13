// @flow

import React, { createContext, useLayoutEffect, useMemo } from 'react';
import { useLocalStorage } from './hooks';

import type { BrowserTheme } from './DevTools';

export type DisplayDensity = 'compact' | 'comfortable';
export type Theme = 'auto' | 'light' | 'dark';

type Context = {|
  displayDensity: DisplayDensity,
  setDisplayDensity(value: DisplayDensity): void,
  theme: Theme,
  setTheme(value: Theme): void,
|};

const SettingsContext = createContext<Context>(((null: any): Context));
// $FlowFixMe displayName is a valid attribute of React$ConsearchText
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
  }, [theme]);

  const value = useMemo(
    () => ({
      displayDensity,
      setDisplayDensity,
      theme,
      setTheme,
    }),
    [displayDensity, setDisplayDensity, theme, setTheme]
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

function updateDisplayDensity(displayDensity: DisplayDensity): void {
  setStyleVariable(
    '--font-size-monospace-normal',
    `var(--${displayDensity}-font-size-monospace-normal)`
  );
  setStyleVariable(
    '--font-size-monospace-large',
    `var(--${displayDensity}-font-size-monospace-large)`
  );
  setStyleVariable(
    '--font-size-sans-normal',
    `var(--${displayDensity}-font-size-sans-normal)`
  );
  setStyleVariable(
    '--font-size-sans-large',
    `var(--${displayDensity}-font-size-sans-large)`
  );
  setStyleVariable(
    '--line-height-data',
    `var(--${displayDensity}-line-height-data)`
  );
}

function updateThemeVariables(theme: Theme): void {
  setStyleVariable('--color-arrow', `var(--theme-${theme}-arrow)`);
  setStyleVariable(
    '--color-arrow-inverted',
    `var(--theme-${theme}-arrow-inverted)`
  );
  setStyleVariable(
    '--color-attribute-name',
    `var(--theme-${theme}-attribute-name)`
  );
  setStyleVariable(
    '--color-attribute-value',
    `var(--theme-${theme}-attribute-value)`
  );
  setStyleVariable('--color-background', `var(--theme-${theme}-background)`);
  setStyleVariable('--color-border', `var(--theme-${theme}-color-border)`);
  setStyleVariable('--color-button', `var(--theme-${theme}-button)`);
  setStyleVariable(
    '--color-button-hover',
    `var(--theme-${theme}-button-hover)`
  );
  setStyleVariable(
    '--color-component-name',
    `var(--theme-${theme}-component-name)`
  );
  setStyleVariable(
    '--color-component-name-inverted',
    `var(--theme-${theme}-component-name-inverted)`
  );
  setStyleVariable('--color-dim', `var(--theme-${theme}-dim)`);
  setStyleVariable('--color-dimmer', `var(--theme-${theme}-dimmer)`);
  setStyleVariable('--color-dimmest', `var(--theme-${theme}-dimmest)`);
  setStyleVariable(
    '--color-search-match',
    `var(--theme-${theme}-search-match)`
  );
  setStyleVariable(
    '--color-search-match-current',
    `var(--theme-${theme}-search-match-current)`
  );
  setStyleVariable('--color-text-color', `var(--theme-${theme}-text-color)`);
  setStyleVariable(
    '--color-tree-jsx-arrow-brackets',
    `var(--theme-${theme}-jsx-arrow-brackets)`
  );
  setStyleVariable(
    '--color-tree-jsx-arrow-brackets-inverted',
    `var(--theme-${theme}-jsx-arrow-brackets-inverted)`
  );
  setStyleVariable(
    '--color-tree-node-selected',
    `var(--theme-${theme}-tree-node-selected)`
  );
  setStyleVariable(
    '--color-tree-node-hover',
    `var(--theme-${theme}-tree-node-hover)`
  );
}

export { SettingsContext, SettingsContextController };
