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

type DocumentElements = Array<HTMLElement>;

type Props = {|
  browserTheme: BrowserTheme,
  children: React$Node,
  componentsPortalContainer?: Element,
  profilerPortalContainer?: Element,
  settingsPortalContainer?: Element,
|};

function SettingsContextController({
  browserTheme,
  children,
  componentsPortalContainer,
  profilerPortalContainer,
  settingsPortalContainer,
}: Props) {
  const [displayDensity, setDisplayDensity] = useLocalStorage<DisplayDensity>(
    'React::DevTools::displayDensity',
    'compact'
  );
  const [theme, setTheme] = useLocalStorage<Theme>(
    'React::DevTools::theme',
    'auto'
  );

  const documentElements = useMemo<DocumentElements>(() => {
    const array: Array<HTMLElement> = [
      ((document.documentElement: any): HTMLElement),
    ];
    if (componentsPortalContainer != null) {
      array.push(
        ((componentsPortalContainer.ownerDocument
          .documentElement: any): HTMLElement)
      );
    }
    if (profilerPortalContainer != null) {
      array.push(
        ((profilerPortalContainer.ownerDocument
          .documentElement: any): HTMLElement)
      );
    }
    if (settingsPortalContainer != null) {
      array.push(
        ((settingsPortalContainer.ownerDocument
          .documentElement: any): HTMLElement)
      );
    }
    return array;
  }, [
    componentsPortalContainer,
    profilerPortalContainer,
    settingsPortalContainer,
  ]);

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
        updateDisplayDensity('compact', documentElements);
        break;
      case 'comfortable':
        updateDisplayDensity('comfortable', documentElements);
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

function setStyleVariable(
  name: string,
  value: string,
  documentElements: DocumentElements
) {
  documentElements.forEach(documentElement =>
    documentElement.style.setProperty(name, value)
  );
}

function updateStyleHelper(
  themeKey: string,
  style: string,
  documentElements: DocumentElements
) {
  setStyleVariable(
    `--${style}`,
    `var(--${themeKey}-${style})`,
    documentElements
  );
}

function updateDisplayDensity(
  displayDensity: DisplayDensity,
  documentElements: DocumentElements
): void {
  updateStyleHelper(
    displayDensity,
    'font-size-monospace-normal',
    documentElements
  );
  updateStyleHelper(
    displayDensity,
    'font-size-monospace-large',
    documentElements
  );
  updateStyleHelper(displayDensity, 'font-size-sans-normal', documentElements);
  updateStyleHelper(displayDensity, 'font-size-sans-large', documentElements);
  updateStyleHelper(displayDensity, 'line-height-data', documentElements);
}

function updateThemeVariables(
  theme: Theme,
  documentElements: DocumentElements
): void {
  updateStyleHelper(theme, 'color-attribute-name', documentElements);
  updateStyleHelper(theme, 'color-attribute-value', documentElements);
  updateStyleHelper(theme, 'color-attribute-editable-value', documentElements);
  updateStyleHelper(theme, 'color-background', documentElements);
  updateStyleHelper(theme, 'color-border', documentElements);
  updateStyleHelper(theme, 'color-button-background', documentElements);
  updateStyleHelper(theme, 'color-button-background-focus', documentElements);
  updateStyleHelper(theme, 'color-button-background-hover', documentElements);
  updateStyleHelper(theme, 'color-button', documentElements);
  updateStyleHelper(theme, 'color-button-disabled', documentElements);
  updateStyleHelper(theme, 'color-button-focus', documentElements);
  updateStyleHelper(theme, 'color-button-hover', documentElements);
  updateStyleHelper(theme, 'color-commit-did-not-render', documentElements);
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
  updateStyleHelper(theme, 'color-dim', documentElements);
  updateStyleHelper(theme, 'color-dimmer', documentElements);
  updateStyleHelper(theme, 'color-dimmest', documentElements);
  updateStyleHelper(theme, 'color-hover-background', documentElements);
  updateStyleHelper(theme, 'color-inactive-background', documentElements);
  updateStyleHelper(theme, 'color-jsx-arrow-brackets', documentElements);
  updateStyleHelper(
    theme,
    'color-jsx-arrow-brackets-inverted',
    documentElements
  );
  updateStyleHelper(theme, 'color-modal-background', documentElements);
  updateStyleHelper(theme, 'color-record-active', documentElements);
  updateStyleHelper(theme, 'color-record-hover', documentElements);
  updateStyleHelper(theme, 'color-record-inactive', documentElements);
  updateStyleHelper(theme, 'color-selected-background', documentElements);
  updateStyleHelper(theme, 'color-selected-border', documentElements);
  updateStyleHelper(theme, 'color-selected-foreground', documentElements);
  updateStyleHelper(theme, 'color-search-match', documentElements);
  updateStyleHelper(theme, 'color-search-match-current', documentElements);
  updateStyleHelper(theme, 'color-text-color', documentElements);
}

export { SettingsContext, SettingsContextController };
