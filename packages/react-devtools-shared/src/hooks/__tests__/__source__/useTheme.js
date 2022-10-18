/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createContext, useContext, useDebugValue} from 'react';

export const ThemeContext = createContext('bright');

export default function useTheme() {
  const theme = useContext(ThemeContext);
  useDebugValue(theme);
  return theme;
}
