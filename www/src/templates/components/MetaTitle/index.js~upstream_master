/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

import React from 'react';
import {colors} from 'theme';

const MetaTitle = ({
  children,
  title,
  cssProps = {},
  onClick,
  onDark = false,
}) => (
  <div
    onClick={onClick}
    css={{
      color: onDark ? colors.subtleOnDark : colors.subtle,
      cursor: onClick ? 'pointer' : null,
      fontSize: 14,
      fontWeight: 700,
      lineHeight: 3,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      ...cssProps,
    }}>
    {children}
  </div>
);

export default MetaTitle;
