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

const ButtonLink = ({children, type, ...rest}) => {
  let typeStyle;
  switch (type) {
    case 'primary':
      typeStyle = primaryStyle;
      break;
    case 'secondary':
      typeStyle = secondaryStyle;
      break;
  }

  return (
    <Link {...rest} css={[style, typeStyle]}>
      {children}
    </Link>
  );
};

const style = {
  display: 'inline-block',
  fontSize: 16,

  [media.greaterThan('xlarge')]: {
    fontSize: 20,
  },
};

const primaryStyle = {
  backgroundColor: colors.brand,
  color: colors.black,
  fontWeight: 100,
  padding: '10px 25px',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.2s ease-out',

  [media.greaterThan('xlarge')]: {
    paddingTop: 15,
    paddingBottom: 15,
  },

  ':hover': {
    backgroundColor: colors.white,
  },
};

const secondaryStyle = {
  color: colors.brand,
  transition: 'color 0.2s ease-out',

  ':hover': {
    color: colors.white,
  },
};

export default ButtonLink;
