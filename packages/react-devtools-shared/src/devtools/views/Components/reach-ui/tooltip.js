/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import ReachTooltip from '@reach/tooltip';
import useThemeStyles from '../../useThemeStyles';

const Tooltip = ({children, ...props}: {children: React$Node, ...}) => {
  const style = useThemeStyles();
  return (
    <ReachTooltip style={style} {...props}>
      {children}
    </ReachTooltip>
  );
};

export default Tooltip;
