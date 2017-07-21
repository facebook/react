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

import Link from 'gatsby-link';
import React from 'react';
import {colors, media} from 'theme';

const HeaderLink = ({isActive, title, to}) => (
  <Link css={[style, isActive && activeStyle]} to={to}>
    {title}
  </Link>
);

const style = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  color: colors.white,
  transition: 'color 0.2s ease-out',
  paddingLeft: 15,
  paddingRight: 15,
  fontWeight: 300,

  [media.xsmall]: {
    paddingLeft: 8,
    paddingRight: 8,
  },

  [media.small]: {
    paddingLeft: 10,
    paddingRight: 10,
  },

  [media.xlargeUp]: {
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 18,
    fontWeight: 400,

    ':hover': {
      color: colors.brand,
    },
  },
};

const activeStyle = {
  color: colors.brand,

  [media.xlargeUp]: {
    position: 'relative',

    ':after': {
      content: '',
      position: 'absolute',
      bottom: -1,
      height: 4,
      background: colors.brand,
      left: 0,
      right: 0,
      zIndex: 1,
    },
  },
};

export default HeaderLink;
