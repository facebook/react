/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  unstable_createMutableSource as createMutableSource,
  unstable_useMutableSource as useMutableSource,
  useLayoutEffect,
} from 'react';

import {
  updateDisplayDensity,
  updateThemeVariables,
} from 'react-devtools-shared/src/devtools/views/Settings/SettingsContext';
import {enableDarkMode} from './SchedulingProfilerFeatureFlags';

export type BrowserTheme = 'dark' | 'light';

const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

const getSnapshot = window =>
  window.matchMedia(DARK_MODE_QUERY).matches ? 'dark' : 'light';

const darkModeMutableSource = createMutableSource(
  window,
  () => window.matchMedia(DARK_MODE_QUERY).matches,
);

const subscribe = (window, callback) => {
  const mediaQueryList = window.matchMedia(DARK_MODE_QUERY);
  mediaQueryList.addEventListener('change', callback);
  return () => {
    mediaQueryList.removeEventListener('change', callback);
  };
};

export function useBrowserTheme(): void {
  const theme = useMutableSource(darkModeMutableSource, getSnapshot, subscribe);

  useLayoutEffect(() => {
    const documentElements = [((document.documentElement: any): HTMLElement)];
    if (enableDarkMode) {
      switch (theme) {
        case 'light':
          updateThemeVariables('light', documentElements);
          break;
        case 'dark':
          updateThemeVariables('dark', documentElements);
          break;
        default:
          throw Error(`Unsupported theme value "${theme}"`);
      }
    } else {
      updateThemeVariables('light', documentElements);
    }
  }, [theme]);
}

export function useDisplayDensity(): void {
  useLayoutEffect(() => {
    const documentElements = [((document.documentElement: any): HTMLElement)];
    updateDisplayDensity('comfortable', documentElements);
  }, []);
}
