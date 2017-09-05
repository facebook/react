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
import {media} from 'theme';

const FooterNav = ({children, title}) => (
  <div
    css={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '50%',
      [media.between('medium', 'large')]: {
        width: '25%',
      },
      [media.greaterThan('xlarge')]: {
        width: 'calc(100% / 6)',
      },
    }}>
    <div
      css={{
        display: 'inline-flex',
        flexDirection: 'column',
      }}>
      {children}
    </div>
  </div>
);

export default FooterNav;
