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
import ExternalLinkSvg from 'templates/components/ExternalLinkSvg';

const ExternalFooterLink = ({children, href, target}) => (
  <a
    css={{
      fontWeight: 300,
      lineHeight: 2,
      ':hover': {
        color: colors.brand,
      },
    }}
    href={href}
    target={target}>
    {children}
    <ExternalLinkSvg
      cssProps={{
        verticalAlign: -2,
        display: 'inline-block',
        marginLeft: 5,
        color: colors.subtle,
      }}
    />
  </a>
);

export default ExternalFooterLink;
