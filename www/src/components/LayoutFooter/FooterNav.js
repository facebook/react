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

const FooterNav = ({children, title, layoutHasSidebar = false}) => (
  <div
    css={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      width: '50%',
      paddingTop: 40,

      [media.size('sidebarFixed')]: {
        paddingTop: 0,
        width: '25%',
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
