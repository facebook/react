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
import {Sticky} from 'react-sticky';
import Sidebar from 'templates/components/Sidebar';
import {media} from 'theme';

const StickySidebar = props => (
  <Sticky>
    {({style}) => (
      <div style={style}>
        <div
          css={{
            marginTop: 60,

            [media.lessThan('small')]: {
              marginTop: 40,
            },

            [media.between('medium', 'large')]: {
              marginTop: 50,
            },
          }}>
          <Sidebar {...props} />
        </div>
      </div>
    )}
  </Sticky>
);

export default StickySidebar;
