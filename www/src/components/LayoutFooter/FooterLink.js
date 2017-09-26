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

const FooterLink = ({children, target, to}) => (
  <a
    css={{
      fontWeight: 300,
      lineHeight: 2,
      ':hover': {
        color: colors.brand,
      },
    }}
    href={to}
    target={target}>
    {children}
    {target === '_blank' &&
      <ExternalLinkSvg
        cssProps={{
          verticalAlign: -2,
          display: 'inline-block',
          marginLeft: 5,
          color: colors.subtle,
        }}
      />}
  </a>
);

export default FooterLink;
