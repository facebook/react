/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext, useMemo} from 'react';
import {SettingsContext} from './Settings/SettingsContext';
import {THEME_STYLES} from '../../constants';

export default function ThemeProvider({children}: {|children: React$Node|}) {
  const {theme, displayDensity, browserTheme} = useContext(SettingsContext);

  const style = useMemo(
    () => ({
      width: '100%',
      height: '100%',
      ...THEME_STYLES[displayDensity],
      ...THEME_STYLES[theme === 'auto' ? browserTheme : theme],
    }),
    [theme, browserTheme, displayDensity],
  );

  return <div style={style}>{children}</div>;
}
