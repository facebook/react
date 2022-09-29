/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import useThemeStyles from './useThemeStyles';

export default function ThemeProvider({
  children,
}: {
  children: React.Node,
}): React.Node {
  const themeStyle = useThemeStyles();

  const style = React.useMemo(() => {
    return {
      ...themeStyle,
      width: '100%',
      height: '100%',
    };
  }, [themeStyle]);

  return <div style={style}>{children}</div>;
}
