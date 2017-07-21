/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
*/

'use strict';

import React from 'react';
import {colors} from 'theme';

const FooterTitle = ({children, title}) => (
  <div
    css={{
      color: colors.subtle,
      fontSize: 14,
      fontWeight: 700,
      lineHeight: 3,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    }}>
    {children}
  </div>
);

export default FooterTitle;
